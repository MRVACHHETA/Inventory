'use client';

import React from 'react';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronsDown, Info } from 'lucide-react';
import { format } from 'date-fns';
// Note: Assuming your types are defined here.
// Please ensure your 'PaymentSource' type includes 'pending_bill_payment'
import { PendingBill, PaymentMode, PaymentSource } from './types';

interface PendingBillsSectionProps {
    pendingBills: PendingBill[];
    billsToClear: string[];
    handleToggleBillToClear: (billId: string) => void;
    totalPendingAmount: number;
    paymentMode: PaymentMode;
}

const PendingBillsSection: React.FC<PendingBillsSectionProps> = ({
    pendingBills,
    billsToClear,
    handleToggleBillToClear,
    totalPendingAmount,
    paymentMode,
}) => {
    if (pendingBills.length === 0) return null;

    return (
        <Card className="border-l-4 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-base font-bold sm:text-lg text-red-500">
                    Pending Payments ({pendingBills.length})
                </CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent className="p-3 sm:p-6">
                <p className="text-sm text-muted-foreground">This customer has an outstanding balance of:</p>
                <p className="text-xl font-bold text-red-500 sm:text-2xl">₹{totalPendingAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mb-3">
                    {totalPendingAmount > 0
                        ? 'Select which bills to pay off with this transaction:'
                        : 'No pending payments.'}
                </p>

                <div className="space-y-3">
                    {pendingBills.map((bill) => (
                        <Collapsible key={bill._id}>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`bill-${bill._id}`}
                                        checked={billsToClear.includes(bill._id)}
                                        onCheckedChange={() => handleToggleBillToClear(bill._id)}
                                        disabled={paymentMode === 'fully_unpaid'}
                                    />
                                    <Label
                                        htmlFor={`bill-${bill._id}`}
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Bill No. <strong>{bill.billId}</strong>: ₹{bill.pendingAmount.toFixed(2)}
                                        <span className="ml-2 text-xs text-muted-foreground">(Click for details)</span>
                                    </Label>
                                </div>

                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="sm:ml-auto">
                                        <ChevronsDown className="h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent className="pl-4 mt-2 border-l-2 border-muted">
                                <div className="text-xs text-muted-foreground pl-2">
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between">
                                            <span>Created:</span>
                                            <span className="font-medium text-foreground">
                                                {format(new Date(bill.createdAt), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total:</span>
                                            <span className="font-medium text-foreground">₹{bill.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Paid:</span>
                                            <span className="font-medium text-foreground">₹{bill.amountPaid.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-red-500">
                                            <span>Remaining:</span>
                                            <span>₹{bill.pendingAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <h4 className="font-semibold mt-3">Payments Received:</h4>
                                    <ul className="space-y-0.5">
                                        {bill.payments && bill.payments.length > 0 ? (
                                            bill.payments.map((p, index) => (
                                                <li
                                                    key={index}
                                                    className="flex flex-col sm:flex-row justify-between text-muted-foreground"
                                                >
                                                    <span>
                                                        {/* FIX: Corrected the comparison string */}
                                                        {p.source === 'pending_bill_payment' && p.sourceBillIds?.length ? (
                                                            <span className="font-bold text-green-600 italic">
                                                                Paid from Bill #{p.sourceBillIds.join(', ')}
                                                            </span>
                                                        ) : (
                                                            p.source
                                                        )}
                                                    </span>
                                                    <span className="font-medium text-foreground sm:text-right">
                                                        ₹{p.amount.toFixed(2)}
                                                    </span>
                                                </li>
                                            ))
                                        ) : (
                                            <li>No payments have been received yet.</li>
                                        )}
                                    </ul>

                                    <h4 className="font-semibold mt-3">Products:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {bill.items.map((item, index) => (
                                            <li key={index}>
                                                {item.sparePart?.category || 'N/A'} x {item.quantity} (₹
                                                {item.unitPrice.toFixed(2)})
                                                {item.sparePart?.boxNumber && (
                                                    <span className="ml-2 font-bold">Box: {item.sparePart.boxNumber}</span>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {item.sparePart?.deviceModel?.join(', ') || 'N/A'}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default PendingBillsSection;