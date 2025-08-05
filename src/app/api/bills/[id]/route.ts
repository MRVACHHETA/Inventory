// src/app/api/bills/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import mongoose from 'mongoose';
import { Payment, PaidBillHistoryItem } from '@/app/billing/_components/types';

// Helper function to determine payment status
const getPaymentStatus = (bill: any): 'Fully Paid' | 'Partially Paid' | 'Unpaid' => {
  if (bill.pendingAmount <= 0.01) {
    return 'Fully Paid';
  } else if (bill.amountPaid > 0) {
    return 'Partially Paid';
  } else {
    return 'Unpaid';
  }
};

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectMongoDB();
    const { id } = context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid Bill ID" }, { status: 400 });
    }

    const bill = await Bill.findById(id)
      .populate('customer')
      .populate({
        path: 'items.sparePart',
        select: 'category deviceModel brand boxNumber',
      })
      .select('+payments'); 
      
    if (!bill) {
      return NextResponse.json({ message: "Bill not found" }, { status: 404 });
    }
    
    return NextResponse.json(bill);

  } catch (error) {
    console.error("Failed to fetch bill:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to fetch bill", error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await connectMongoDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = context.params;

    const body = await request.json();
    const { payments = [], paidBillHistory = [] }: { payments: Payment[]; paidBillHistory: PaidBillHistoryItem[] } = body;
    
    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid Bill ID.");
    }
    
    const bill = await Bill.findById(id).session(session);
    if (!bill) {
      throw new Error("Bill not found.");
    }

    // Process payments for the current bill first
    let totalPaymentForThisBill = 0;
    const paymentsForThisBill = payments
      .filter((p: Payment) => p.source !== 'Payment for Previous Bills')
      .map((p: Payment) => {
        totalPaymentForThisBill += p.amount;
        return {
            ...p,
            date: new Date(),
        };
      });

    // Check if payment for the current bill exceeds its pending amount
    if (totalPaymentForThisBill > bill.pendingAmount) {
      throw new Error(`Payment amount (₹${totalPaymentForThisBill}) exceeds the pending balance (₹${bill.pendingAmount}) for this bill.`);
    }

    // 1. Update the current bill with payments applied to it
    if (totalPaymentForThisBill > 0) {
        bill.amountPaid += totalPaymentForThisBill;
        bill.pendingAmount -= totalPaymentForThisBill;
        bill.payments.push(...paymentsForThisBill);
    }

    // 2. Process payments that clear other pending bills
    if (paidBillHistory.length > 0) {
        // Find the payment entry from the current bill that was used to clear old ones
        // FIX: Explicitly type the parameter 'p'
        const paymentForOldBillsEntry = payments.find((p: Payment) => p.source === 'Payment for Previous Bills');
        const amountUsedToClearOldBills = paymentForOldBillsEntry?.amount || 0;

        // Add this payment entry to the current bill's payments array
        // FIX: Explicitly type the parameter 'p' in the find method as well
        if (amountUsedToClearOldBills > 0 && !bill.payments.find((p: Payment) => p.source === 'Payment for Previous Bills' && p.amount === amountUsedToClearOldBills)) {
            bill.payments.push({
                amount: amountUsedToClearOldBills,
                source: 'Payment for Previous Bills',
                date: new Date(),
                sourceBillIds: paidBillHistory.map(h => h.billId)
            });
        }

        for (const clearedBillInfo of paidBillHistory) {
            const oldBill = await Bill.findById(clearedBillInfo.billId).session(session);
            if (!oldBill) {
                console.error(`Pending bill with ID ${clearedBillInfo.billId} not found.`);
                continue;
            }

            // Create a payment object for the old bill
            const paymentForOldBill = {
                amount: clearedBillInfo.amountCleared,
                source: 'Payment for Previous Bills',
                date: new Date(),
                // Link this payment back to the current bill that provided the payment
                sourceBillIds: [bill.billId], 
            };

            oldBill.amountPaid += clearedBillInfo.amountCleared;
            oldBill.pendingAmount -= clearedBillInfo.amountCleared;
            oldBill.payments.push(paymentForOldBill);
            oldBill.paymentStatus = getPaymentStatus(oldBill);
            await oldBill.save({ session });
        }
    }

    // 3. Update the current bill's payment status
    bill.paymentStatus = getPaymentStatus(bill);
    await bill.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // Fetch the final state of the current bill to return
    const finalBill = await Bill.findById(id)
      .populate('customer')
      .populate({
        path: 'items.sparePart',
        select: 'category deviceModel brand boxNumber',
      })
      .select('+payments');
    
    return NextResponse.json(finalBill);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Failed to update bill:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to update bill", error: errorMessage }, { status: 500 });
  }
}