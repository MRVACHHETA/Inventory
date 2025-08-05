// src/app/api/bills/route.ts

import { NextResponse, NextRequest } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import SparePart from '@/models/SparePart';
import mongoose, { Schema } from 'mongoose';
import { Payment, BillItemFormData, PaidBillHistoryItem } from '@/app/billing/_components/types';

// Ensure the Counter model is defined and accessible
const counterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

// Handles POST requests to create a new bill
export async function POST(request: NextRequest) {
  await connectMongoDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await request.json();
    const {
      customer,
      customerName,
      customerPhone,
      items,
      discountAmount = 0,
      payments = [],
      notes,
      pendingBillsToClear = [],
    } = body;

    if (!customer || !customerName || !customerPhone || !items || items.length === 0) {
      throw new Error("Missing required bill data.");
    }
    
    // Get new bill ID
    const counterDoc = await Counter.findByIdAndUpdate(
      { _id: 'billId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );
    const newBillId = counterDoc.seq.toString(); 

    // Update spare part quantities
    for (const billItem of items) {
      const sparePart = await SparePart.findById(billItem.sparePart).session(session);
      if (!sparePart) {
        throw new Error(`Spare part with ID ${billItem.sparePart} not found.`);
      }
      if (sparePart.quantity < billItem.quantity) {
        throw new Error(`Insufficient stock for ${sparePart.category}. Available: ${sparePart.quantity}, Requested: ${billItem.quantity}.`);
      }
      sparePart.quantity -= billItem.quantity;
      await sparePart.save({ session });
    }

    const paidBillsHistory: PaidBillHistoryItem[] = [];
    const totalPaymentForTransaction = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
    let amountUsedForOldBills = 0;
    
    let remainingPayment = totalPaymentForTransaction;

    // Find and sort pending bills to clear
    const pendingBills = await Bill.find({
      _id: { $in: pendingBillsToClear },
      pendingAmount: { $gt: 0 }
    }).sort({ createdAt: 1 }).session(session);

    // Apply payments to old bills
    for (const pendingBill of pendingBills) {
      if (remainingPayment <= 0) break;

      const amountToClear = Math.min(pendingBill.pendingAmount, remainingPayment);
      
      pendingBill.amountPaid += amountToClear;
      pendingBill.pendingAmount -= amountToClear;
      
      if (!pendingBill.payments) {
          pendingBill.payments = [];
      }
      
      pendingBill.paymentStatus = pendingBill.pendingAmount <= 0.01 ? 'Fully Paid' : 'Partially Paid';
      if (pendingBill.pendingAmount <= 0.01) {
          pendingBill.pendingAmount = 0;
      }
      
      pendingBill.payments.push({
          amount: amountToClear,
          source: 'Pending Bill Payment',
          date: new Date(),
          sourceBillIds: [newBillId],
      });

      await pendingBill.save({ session });
      remainingPayment -= amountToClear;
      amountUsedForOldBills += amountToClear;

      paidBillsHistory.push({
        billId: pendingBill.billId,
        amountCleared: amountToClear,
        newPendingAmount: pendingBill.pendingAmount
      });
    }

    const totalAmountBeforeDiscount = items.reduce((sum: number, item: BillItemFormData) => sum + item.quantity * item.unitPrice, 0);
    const finalTotal = totalAmountBeforeDiscount - discountAmount;
    
    const newBillPaymentAmount = totalPaymentForTransaction - amountUsedForOldBills;
    const newBillPendingAmount = Math.max(0, finalTotal - newBillPaymentAmount);
    
    let newBillPaymentStatus;
    if (newBillPendingAmount <= 0.01) {
        newBillPaymentStatus = 'Fully Paid';
    } else if (newBillPaymentAmount > 0) {
        newBillPaymentStatus = 'Partially Paid';
    } else {
        newBillPaymentStatus = 'Unpaid';
    }

    // FIX START: This section has been refactored to correctly populate the payments array for the new bill
    const newBillPayments = [];
    let amountToAssignToNewBill = newBillPaymentAmount;

    for (const p of payments) {
      if (amountToAssignToNewBill <= 0) break;
      const amountForThisEntry = Math.min(p.amount, amountToAssignToNewBill);

      newBillPayments.push({
        amount: amountForThisEntry,
        source: p.source,
        date: new Date(),
      });
      amountToAssignToNewBill -= amountForThisEntry;
    }
    // FIX END
    
    // Add a separate entry for the payments made to old bills
    if (amountUsedForOldBills > 0 && paidBillsHistory.length > 0) {
      newBillPayments.push({
        amount: amountUsedForOldBills,
        source: 'Payment for Previous Bills',
        date: new Date(),
        sourceBillIds: paidBillsHistory.map(h => h.billId),
      });
    }
    
    const newBill = await Bill.create([{
      billId: newBillId,
      customer,
      customerName,
      customerPhone,
      items,
      totalAmount: finalTotal,
      discountAmount,
      amountPaid: newBillPaymentAmount,
      pendingAmount: newBillPendingAmount,
      paymentStatus: newBillPaymentStatus,
      payments: newBillPayments,
      notes,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      bill: {
        billId: newBill[0].billId,
        pendingAmount: newBill[0].pendingAmount,
        paymentStatus: newBill[0].paymentStatus,
      },
      paidBillsHistory: paidBillsHistory,
    }, { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to create bill:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("Insufficient stock")) {
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create bill", error: errorMessage }, { status: 500 });
  }
}

// Handles GET requests to fetch bills (with powerful filtering options)
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);

    const customerId = searchParams.get('customerId');
    const getPendingBills = searchParams.get('getPendingBills') === 'true';
    const paymentStatus = searchParams.get('paymentStatus') as 'Fully Paid' | 'Unpaid' | 'Partially Paid';
    const billIdSearch = searchParams.get('billId') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerSearch = searchParams.get('customerSearch');

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const conditions = [];
    
    if (customerId) {
      conditions.push({ customer: customerId });
    }
    if (paymentStatus) {
      conditions.push({ paymentStatus });
    }
    if (billIdSearch) {
      conditions.push({ billId: billIdSearch });
    }
    if (customerSearch) {
      conditions.push({
          $or: [
              { customerName: { $regex: customerSearch, $options: 'i' } },
              { customerPhone: { $regex: customerSearch, $options: 'i' } },
          ]
      });
    }
    if (startDate || endDate) {
      const dateQuery: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate!);
        endOfDay.setHours(23, 59, 59, 999);
        dateQuery.$lte = endOfDay;
      }
      conditions.push({ createdAt: dateQuery });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    if (getPendingBills && customerId) {
      const pendingBills = await Bill.find({ customer: customerId, pendingAmount: { $gt: 0 } })
                                     .sort({ createdAt: 1 })
                                     .select('billId totalAmount amountPaid pendingAmount createdAt items payments.sourceBillIds payments.source payments.amount payments.date')
                                     .populate('items.sparePart', 'category deviceModel brand boxNumber')
                                     .exec();
      return NextResponse.json(pendingBills);
    }
    
    const bills = await Bill.find(query)
                            .populate('customer', 'name phone')
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(limit);

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Failed to fetch bills:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to fetch bills", error: errorMessage }, { status: 500 });
  }
}

// Handles DELETE requests to reset the bill counter
export async function DELETE() {
    await connectMongoDB();
    try {
        const resetAction = await Counter.updateOne(
            { _id: 'billId' },
            { $set: { seq: 0 } }
        );

        if (resetAction.modifiedCount === 0 && resetAction.upsertedCount === 0) {
            await Counter.create({ _id: 'billId', seq: 0 });
            return NextResponse.json({ message: 'Bill counter initialized and reset to 0.' }, { status: 200 });
        }
        
        return NextResponse.json({ message: 'Bill counter has been reset to 0.' }, { status: 200 });

    } catch (error) {
        console.error("Failed to reset bill counter:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ message: "Failed to reset bill counter", error: errorMessage }, { status: 500 });
    }
}