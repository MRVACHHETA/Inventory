import { NextResponse } from 'next/server' // Removed 'type NextRequest' from import
import dbConnect from '@/lib/mongodb'
import SparePart from '@/models/SparePart'

// Define the interface for the SparePart document as it appears in the database.
interface ISparePartDocument {
  _id: string;
  name: string;
  deviceModel: string;
  quantity: number;
  price: number;
  status: "in-stock" | "out-of-stock";
  category: string;
  imageUrl?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define a type for the incoming request body when updating a spare part.
interface UpdateRequestBody {
  name?: string;
  deviceModel?: string;
  quantity?: number;
  price?: number;
  status?: "in-stock" | "out-of-stock";
  category?: string;
  imageUrl?: string;
  description?: string;
  model?: string;
}

// GET spare part by ID
export async function GET(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any // WORKAROUND: Explicitly typing as 'any' to bypass Next.js 15.4.4 validation bug
) {
  await dbConnect()

  try {
    const id = context.params.id; // Access id from context.params
    const sparePart = await SparePart.findById(id);

    if (!sparePart) {
      return NextResponse.json({ message: 'Spare part not found' }, { status: 404 })
    }

    return NextResponse.json(sparePart)
  } catch (error) {
    console.error("Error fetching part:", error);
    return NextResponse.json({ message: 'Error fetching part', error: (error as Error).message || String(error) }, { status: 500 })
  }
}

// UPDATE spare part by ID
export async function PUT(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any // WORKAROUND: Explicitly typing as 'any'
) {
  await dbConnect()

  try {
    const body: UpdateRequestBody = await req.json()

    const updateData: Partial<ISparePartDocument> & { model?: string } = { ...body };

    if (updateData.model !== undefined) {
      updateData.deviceModel = updateData.model;
      delete updateData.model;
    }

    const id = context.params.id; // Access id from context.params
    const updatedPart = await SparePart.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updatedPart) {
      return NextResponse.json({ message: 'Spare part not found' }, { status: 404 })
    }

    return NextResponse.json(updatedPart)
  } catch (error) {
    console.error("Error updating part:", error);
    return NextResponse.json({ message: 'Error updating part', error: (error as Error).message || String(error) }, { status: 500 })
  }
}

// DELETE spare part by ID
export async function DELETE(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any // WORKAROUND: Explicitly typing as 'any'
) {
  await dbConnect()

  try {
    const id = context.params.id; // Access id from context.params
    const deletedPart = await SparePart.findByIdAndDelete(id)

    if (!deletedPart) {
      return NextResponse.json({ message: 'Spare part not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Spare part deleted successfully' })
  } catch (error) {
    console.error("Error deleting part:", error);
    return NextResponse.json({ message: 'Error deleting part', error: (error as Error).message || String(error) }, { status: 500 })
  }
}