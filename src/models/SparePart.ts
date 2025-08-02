// src/models/SparePart.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for your SparePart document
export interface ISparePart extends Document {
  // REMOVED: name: string;
  deviceModel: string[];
  brand: string[];
  quantity: number;
  price: number;
  status: "in-stock" | "out-of-stock";
  category: string;
  imageUrl?: string;
  description?: string;
  boxNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema for SparePart
const SparePartSchema: Schema<ISparePart> = new Schema<ISparePart>({
  // REMOVED: name: { type: String, required: true },
  deviceModel: { type: [String], required: true },
  brand: { type: [String] },
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ["in-stock", "out-of-stock"],
    default: "in-stock",
  },
  category: { type: String, required: true }, // Category is now the primary required identifier
  imageUrl: { type: String },
  description: { type: String },
  boxNumber: { type: String },
}, { timestamps: true });

// Check if the model already exists to prevent OverwriteModelError
const SparePart: Model<ISparePart> = mongoose.models.SparePart || mongoose.model<ISparePart>('SparePart', SparePartSchema);

export default SparePart;