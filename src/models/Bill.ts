// src/models/Bill.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define the schema for a single item within the bill
const billItemSchema = new Schema({
  sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
  name: { type: String, required: true },
  deviceModel: [{ type: String, required: true }],
  brand: [{ type: String }],
  boxNumber: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

// Define the schema for a single payment
const paymentSchema = new Schema({
    amount: { type: Number, required: true },
    source: { type: String, enum: ['Cash', 'UPI', 'From New Bill', 'Pending Bill Payment'], required: true },
    date: { type: Date, default: Date.now },
    // FIX: Added new field to store the bill IDs that this payment came from
    sourceBillIds: [{ type: String }],
});

export interface IBill extends Document {
  billId: string;
  customer: mongoose.Schema.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  items: Array<{
    sparePart: mongoose.Schema.Types.ObjectId;
    name: string;
    deviceModel: string[];
    brand: string[];
    boxNumber?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Unpaid';
  payments: Array<{
    amount: number;
    source: 'Cash' | 'UPI' | 'From New Bill' | 'Pending Bill Payment';
    date: Date;
    // FIX: Updated TypeScript interface to match the new schema
    sourceBillIds?: string[];
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>({
  billId: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: [billItemSchema],
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Fully Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid',
  },
  payments: {
      type: [paymentSchema],
      default: [],
  },
  notes: { type: String },
}, {
  timestamps: true,
});

const Bill = mongoose.models.Bill || mongoose.model<IBill>('Bill', billSchema);
export default Bill;