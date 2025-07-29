// src/app/api/spare-parts/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SparePart from '@/models/SparePart'; // Assuming SparePart is your Mongoose Model

// Define the interface for the SparePart document as it appears in the database.
// This is based on the 'SparePart' interface you provided in public-inventory/page.tsx,
// extended to include potential Mongoose-specific properties like _id, createdAt, and updatedAt.
interface ISparePartDocument {
  _id: string; // Mongoose adds this
  name: string;
  deviceModel: string;
  quantity: number;
  price: number;
  status: "in-stock" | "out-of-stock";
  category: string;
  imageUrl?: string;
  description?: string;
  createdAt?: Date; // Mongoose adds this if timestamps: true is in schema
  updatedAt?: Date; // Mongoose adds this if timestamps: true is in schema
}

// Define a type for the incoming request body when updating a spare part.
// This interface accurately reflects what the API *receives* from the client.
interface UpdateRequestBody {
  name?: string;
  deviceModel?: string;
  quantity?: number;
  price?: number;
  status?: "in-stock" | "out-of-stock";
  category?: string;
  imageUrl?: string;
  description?: string;
  model?: string; // This allows the client to send 'model' for deviceModel
}

// GET a single spare part by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params; // params is already an object, no need to await
    const sparePart = await SparePart.findById(id);
    if (!sparePart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }
    return NextResponse.json(sparePart, { status: 200 });
  } catch (error) {
    console.error("Error fetching single spare part:", error);
    // Ensure error is properly handled and is stringifiable
    return NextResponse.json({ message: "Failed to fetch spare part", error: (error as Error).message || String(error) }, { status: 500 });
  }
}

// PUT (Update) a spare part by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params; // params is already an object, no need to await
    const body: UpdateRequestBody = await request.json(); // Type the incoming body

    // The type for updateData is now a Partial of the document interface (ISparePartDocument),
    // explicitly allowing the 'model' property which will be transformed.
    const updateData: Partial<ISparePartDocument> & { model?: string } = { ...body };

    // Handle the 'model' alias for 'deviceModel'
    if (updateData.model !== undefined) {
      updateData.deviceModel = updateData.model;
      delete updateData.model; // This works because 'model' is allowed on `updateData`'s type
    }

    const updatedSparePart = await SparePart.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedSparePart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }
    return NextResponse.json(updatedSparePart, { status: 200 });
  } catch (error) {
    console.error("Error updating spare part:", error);
    return NextResponse.json({ message: "Failed to update spare part", error: (error as Error).message || String(error) }, { status: 500 });
  }
}

// DELETE a spare part by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params; // params is already an object, no need to await
    const deletedSparePart = await SparePart.findByIdAndDelete(id);
    if (!deletedSparePart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Spare part deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting spare part:", error);
    return NextResponse.json({ message: "Failed to delete spare part", error: (error as Error).message || String(error) }, { status: 500 });
  }
}