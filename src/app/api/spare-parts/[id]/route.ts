import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SparePart from '@/models/SparePart';

// GET a single spare part by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    // Await params before destructuring
    const { id } = await params; // <--- CHANGE IS HERE
    const sparePart = await SparePart.findById(id);
    if (!sparePart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }
    return NextResponse.json(sparePart, { status: 200 });
  } catch (error) {
    console.error("Error fetching single spare part:", error);
    return NextResponse.json({ message: "Failed to fetch spare part", error }, { status: 500 });
  }
}

// PUT (Update) a spare part by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    // Await params before destructuring
    const { id } = await params; // <--- CHANGE IS HERE
    const body = await request.json();
    const updateData: any = { ...body };
    if (updateData.model !== undefined) {
      updateData.deviceModel = updateData.model;
      delete updateData.model;
    }

    const updatedSparePart = await SparePart.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedSparePart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }
    return NextResponse.json(updatedSparePart, { status: 200 });
  } catch (error) {
    console.error("Error updating spare part:", error);
    return NextResponse.json({ message: "Failed to update spare part", error }, { status: 500 });
  }
}

// DELETE a spare part by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    // Await params before destructuring
    const { id } = await params; // <--- CHANGE IS HERE
    const deletedSparePart = await SparePart.findByIdAndDelete(id);
    if (!deletedSparePart) {
      return NextResponse.json({ message: "Spare part not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Spare part deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting spare part:", error);
    return NextResponse.json({ message: "Failed to delete spare part", error }, { status: 500 });
  }
}