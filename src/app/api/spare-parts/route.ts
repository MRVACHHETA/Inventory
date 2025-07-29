import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SparePart from '@/models/SparePart';

// GET all spare parts
export async function GET() {
  await dbConnect();
  try {
    const spareParts = await SparePart.find({});
    return NextResponse.json(spareParts, { status: 200 });
  } catch (error) {
    console.error("Error fetching spare parts:", error);
    return NextResponse.json({ message: "Failed to fetch spare parts", error }, { status: 500 });
  }
}

// POST a new spare part
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    // Ensure 'deviceModel' is used when creating a new part
    const newSparePart = new SparePart({
      name: body.name,
      deviceModel: body.deviceModel, // CHANGED: Use deviceModel
      quantity: body.quantity,
      price: body.price,
      status: body.status || "in-stock", // Default to in-stock if not provided
      category: body.category,
      imageUrl: body.imageUrl,
      description: body.description,
    });
    await newSparePart.save();
    return NextResponse.json(newSparePart, { status: 201 });
  } catch (error) {
    console.error("Error adding spare part:", error);
    return NextResponse.json({ message: "Failed to add spare part", error }, { status: 500 });
  }
}