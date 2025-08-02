// src/app/api/spare-parts/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SparePart from '@/models/SparePart';

export async function GET(req: NextRequest) { // FIX: Use NextRequest for consistency
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    // FIX: Change 'let' to 'const' and remove ': any'
    // Let TypeScript infer the type of 'query'
    const query = {};

    if (searchTerm) {
      // @ts-expect-error - Mongoose query with $or
      query.$or = [
        // REMOVED: Search by 'name' as it's no longer a primary field
        // { name: { $regex: new RegExp(searchTerm, 'i') } },
        { category: { $regex: new RegExp(searchTerm, 'i') } }, // NEW: Search by category instead of name
        { deviceModel: { $regex: new RegExp(searchTerm, 'i') } },
        { brand: { $regex: new RegExp(searchTerm, 'i') } },
        { description: { $regex: new RegExp(searchTerm, 'i') } },
        { boxNumber: { $regex: new RegExp(searchTerm, 'i') } },
      ];
    }

    if (category && category !== 'All') {
      // @ts-expect-error - Mongoose query
      query.category = category;
    }

    if (status && status !== 'All') {
      // @ts-expect-error - Mongoose query
      query.status = status;
    }

    const parts = await SparePart.find(query);
    return NextResponse.json(parts, { status: 200 });
  } catch (error) {
    console.error("Error fetching spare parts:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to fetch spare parts", error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { // FIX: Use NextRequest for consistency
  await dbConnect();
  try {
    const body = await req.json();
    // REMOVED 'name' from destructuring
    const { deviceModel, brand, quantity, price, category, imageUrl, description, boxNumber } = body;

    // UPDATED: Removed 'name' from basic validation
    if (quantity === undefined || price === undefined || !category) {
      return NextResponse.json({ message: "Missing required fields: quantity, price, or category" }, { status: 400 });
    }

    const processedDeviceModel = Array.isArray(deviceModel) ? deviceModel : [];
    const processedBrand = Array.isArray(brand) ? brand : [];

    const status = quantity > 0 ? "in-stock" : "out-of-stock";

    const newPart = await SparePart.create({
      // REMOVED 'name' from the object passed to create
      deviceModel: processedDeviceModel,
      brand: processedBrand,
      quantity,
      price,
      status,
      category,
      imageUrl,
      description,
      boxNumber,
    });

    return NextResponse.json(newPart, { status: 201 });
  } catch (error) { // FIX: Remove ': any' and handle error type-safely
    console.error("Error adding spare part:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to add spare part", error: errorMessage }, { status: 500 });
  }
}