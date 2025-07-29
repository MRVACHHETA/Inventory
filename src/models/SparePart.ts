import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for your SparePart document
export interface ISparePart extends Document {
  name: string;
  deviceModel: string; // CHANGED: Renamed from 'model' to 'deviceModel'
  quantity: number;
  price: number;
  status: "in-stock" | "out-of-stock";
  category: string;
  imageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema for SparePart
const SparePartSchema: Schema<ISparePart> = new Schema<ISparePart>({
  name: { type: String, required: true },
  deviceModel: { type: String, required: true }, // CHANGED: Renamed from 'model' to 'deviceModel'
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ["in-stock", "out-of-stock"],
    default: "in-stock",
  },
  category: { type: String, required: true },
  imageUrl: { type: String },
  description: { type: String },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

// Check if the model already exists to prevent OverwriteModelError
const SparePart: Model<ISparePart> = mongoose.models.SparePart || mongoose.model<ISparePart>('SparePart', SparePartSchema);

export default SparePart;