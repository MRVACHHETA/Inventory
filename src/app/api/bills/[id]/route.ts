// src/app/api/bills/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import mongoose from 'mongoose';
import { Payment } from '@/app/billing/_components/types';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectMongoDB();
    const { id } = context.params;

    // FIX: Corrected the capitalization of isValidObjectId
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
    const { payments: newPayments = [] }: { payments: Payment[] } = body;
    
    // FIX: Corrected the capitalization of isValidObjectId
    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid Bill ID.");
    }
    
    const bill = await Bill.findById(id).session(session);
    if (!bill) {
      throw new Error("Bill not found.");
    }

    const newPaymentAmount = newPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const newPaymentsWithDate = newPayments.map((p: Payment) => ({
        ...p,
        date: new Date(),
    }));

    if (newPaymentAmount > bill.pendingAmount) {
      throw new Error(`Payment amount (₹${newPaymentAmount}) exceeds the pending balance (₹${bill.pendingAmount}).`);
    }

    const updatedBill = await Bill.findByIdAndUpdate(id,
      {
        $inc: { amountPaid: newPaymentAmount },
        $set: { pendingAmount: bill.pendingAmount - newPaymentAmount },
        $push: { payments: { $each: newPaymentsWithDate } },
      },
      { new: true, runValidators: true, session }
    );
    
    if (!updatedBill) {
      throw new Error("Bill not found after update attempt.");
    }

    let updatedPaymentStatus;
    if (updatedBill.pendingAmount <= 0.01) {
        updatedPaymentStatus = 'Fully Paid';
        updatedBill.pendingAmount = 0;
    } else if (updatedBill.amountPaid > 0) {
        updatedPaymentStatus = 'Partially Paid';
    } else {
        updatedPaymentStatus = 'Unpaid';
    }
    
    updatedBill.paymentStatus = updatedPaymentStatus;
    await updatedBill.save({ session });
    
    await session.commitTransaction();
    session.endSession();

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