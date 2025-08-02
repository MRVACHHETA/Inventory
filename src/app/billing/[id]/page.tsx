// src/app/billing/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns'; // Use 'format' from 'date-fns' directly
import { ArrowLeft, Printer } from 'lucide-react';

interface Bill {
    _id: string;
    billId: string;
    customer: {
        _id: string;
        name: string;
        phone: string;
    };
    items: {
        name: string;
        deviceModel: string[];
        brand: string[];
        boxNumber: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }[];
    totalAmount: number;
    discountAmount: number;
    amountPaid: number;
    pendingAmount: number;
    paymentStatus: string;
    paymentSource?: string;
    notes?: string;
    createdAt: string;
}

const BillDetailPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const [bill, setBill] = useState<Bill | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                // Fetch a single bill by its ID from the new API route
                const res = await fetch(`/api/bills/${params.id}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch bill data.");
                }
                const data = await res.json();
                if (data) {
                    setBill(data);
                } else {
                    toast.error("Bill not found.");
                }
            } catch (error) { // FIX: Remove ': any' and handle error type-safely
                console.error("Error fetching bill:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast.error("Error fetching bill details", { description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchBill();
        }
    }, [params.id]);

    if (isLoading) {
        return <div className="text-center p-8">Loading bill details...</div>;
    }

    if (!bill) {
        return <div className="text-center p-8">Bill not found.</div>;
    }

    // Function to handle printing
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handlePrint} className="print:hidden">
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </div>

            <Card id="bill-content" className="print:border-none print:shadow-none">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Bill No: <span className="text-2xl font-bold">{bill.billId}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Date: {format(new Date(bill.createdAt), 'MMM dd, yyyy')}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold text-lg">Customer Details</h3>
                            <p className="text-sm text-muted-foreground">Name: <span className="text-foreground">{bill.customer.name}</span></p>
                            <p className="text-sm text-muted-foreground">Phone: <span className="text-foreground">{bill.customer.phone}</span></p>
                        </div>
                        <div className="text-left md:text-right">
                            <h3 className="font-semibold text-lg">Payment Summary</h3>
                            <p className="text-sm text-muted-foreground">Total: <span className="text-foreground">₹{bill.totalAmount.toFixed(2)}</span></p>
                            <p className="text-sm text-muted-foreground">Paid: <span className="text-foreground">₹{bill.amountPaid.toFixed(2)}</span></p>
                            <p className="text-sm text-muted-foreground">Pending: <span className="text-foreground text-red-500">₹{bill.pendingAmount.toFixed(2)}</span></p>
                            <p className="text-sm text-muted-foreground">Status: <span className="text-foreground">{bill.paymentStatus}</span></p>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Items Billed</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (₹)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {bill.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.name} <br/>
                                                <span className="text-xs text-muted-foreground">{item.deviceModel.join(', ')} / {item.brand.join(', ')}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{item.unitPrice.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₹{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {bill.notes && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Notes</h3>
                                <p className="text-sm text-muted-foreground">{bill.notes}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default BillDetailPage;