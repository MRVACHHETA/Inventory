// src/app/api/customers/route.ts

import { NextResponse, NextRequest } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { z } from 'zod';
import mongoose from 'mongoose';

// Define a schema for customer data using Zod
const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  phone: z.string().min(1, "Customer phone is required.").or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

// Existing POST handler for creating a new customer
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();

    const validation = customerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        message: "Validation Error",
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { name, phone, address } = validation.data;

    const existingCustomer = await Customer.findOne({ name, phone });
    if (existingCustomer) {
      return NextResponse.json(
        { message: "Customer with this name and phone already exists", _id: existingCustomer._id },
        { status: 409 }
      );
    }

    const newCustomer = await Customer.create({ name, phone, address });
    return NextResponse.json(newCustomer, { status: 201 });

  } catch (error) { // FIX: Remove ': any' and handle error type-safely
    console.error("Failed to create customer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to create customer", error: errorMessage }, { status: 500 });
  }
}

// GET handler for searching customers
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';

    // ADDED: Log the search term to the console to verify
    console.log(`Searching for customers with term: '${searchTerm}'`);

    let customers;
    if (searchTerm) {
      customers = await Customer.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
        ],
      });
    } else {
      customers = await Customer.find().sort({ createdAt: -1 }).limit(20);
    }

    // ADDED: Log the search results to the console
    console.log(`Found ${customers.length} customers.`);

    return NextResponse.json(customers);
  } catch (error) { // FIX: Remove ': any' and handle error type-safely
    console.error("Failed to fetch customers:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: "Failed to fetch customers", error: errorMessage }, { status: 500 });
  }
}

// NEW: PUT handler for updating an existing customer
export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid or missing customer ID.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = customerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        message: "Validation Error",
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, validation.data, { new: true, runValidators: true });

    if (!updatedCustomer) {
      return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (error) { // FIX: Remove ': any' and handle error type-safely
    console.error("Failed to update customer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: 'Failed to update customer', error: errorMessage }, { status: 500 });
  }
}

// NEW: DELETE handler for deleting a customer
export async function DELETE(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid or missing customer ID.' }, { status: 400 });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer deleted successfully.' }, { status: 200 });
  } catch (error) { // FIX: Remove ': any' and handle error type-safely
    console.error("Failed to delete customer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ message: 'Failed to delete customer', error: errorMessage }, { status: 500 });
  }
}