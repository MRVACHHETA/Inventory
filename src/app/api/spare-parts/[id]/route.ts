// src/app/api/spare-parts/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SparePart from '@/models/SparePart';

// FIX: Removed the unused ISparePartDocument interface.

// Define a type for the incoming request body when updating a spare part.
// Ensure all possible fields are included and correctly typed.
interface UpdateRequestBody {
  // REMOVED: name?: string;
  deviceModel?: string[];
  brand?: string[];
  quantity?: number;
  price?: number;
  status?: "in-stock" | "out-of-stock";
  category?: string;
  imageUrl?: string;
  description?: string;
  boxNumber?: string;
}

// GET spare part by ID
export async function GET(
  req: NextRequest, // FIX: Use NextRequest for consistency
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const sparePart = await SparePart.findById(id);

    if (!sparePart) {
      return NextResponse.json({ message: 'Spare part not found' }, { status: 404 });
    }

    return NextResponse.json(sparePart);
  } catch (error) {
    console.error("Error fetching part:", error);
    return NextResponse.json({ message: 'Error fetching part', error: (error as Error).message || String(error) }, { status: 500 });
  }
}

// UPDATE spare part by ID
export async function PUT(
  req: NextRequest, // FIX: Use NextRequest for consistency
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const body: UpdateRequestBody = await req.json();

    // Find the existing part first
    const existingPart = await SparePart.findById(id);
    if (!existingPart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }

    // REMOVED: No longer updating 'name'
    // if (body.name !== undefined) existingPart.name = body.name;

    // Apply updates only if the value is defined in the body
    if (body.deviceModel !== undefined && Array.isArray(body.deviceModel)) existingPart.deviceModel = body.deviceModel;
    if (body.brand !== undefined && Array.isArray(body.brand)) existingPart.brand = body.brand;
    if (body.quantity !== undefined) existingPart.quantity = body.quantity;
    if (body.price !== undefined) existingPart.price = body.price;
    if (body.status !== undefined) existingPart.status = body.status;
    if (body.category !== undefined) existingPart.category = body.category;
    if (body.imageUrl !== undefined) existingPart.imageUrl = body.imageUrl;
    if (body.description !== undefined) existingPart.description = body.description;
    if (body.boxNumber !== undefined) existingPart.boxNumber = body.boxNumber;

    // Update status based on quantity, regardless of what was in body.status initially
    if (existingPart.quantity <= 0) {
        existingPart.status = 'out-of-stock';
    } else {
        existingPart.status = 'in-stock';
    }

    const updatedPart = await existingPart.save();

    return NextResponse.json(updatedPart);
  } catch (error) {
    console.error("Error updating part:", error);
    return NextResponse.json({ message: 'Error updating part', error: (error as Error).message || String(error) }, { status: 500 });
  }
}

// DELETE spare part by ID
export async function DELETE(
  req: NextRequest, // FIX: Use NextRequest for consistency
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const deletedPart = await SparePart.findByIdAndDelete(id);

    if (!deletedPart) {
      return NextResponse.json({ message: 'Spare part not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Spare part deleted successfully' });
  } catch (error) {
    console.error("Error deleting part:", error);
    return NextResponse.json({ message: 'Error deleting part', error: (error as Error).message || String(error) }, { status: 500 });
  }
}