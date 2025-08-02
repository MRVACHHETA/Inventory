// src/models/Customer.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string; // CHANGED: Now a required string in the interface
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema: Schema<ICustomer> = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required.'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required.'], // CHANGED: phone is now required in Mongoose schema
      // You can add a regex here if you want to enforce a specific pattern for the phone number
      // e.g., match: [/^\d{10}$/, 'Phone number must be 10 digits.']
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;