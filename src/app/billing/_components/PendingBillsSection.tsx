// File: src/app/billing/_components/PendingBillsSection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronsDown, Info } from 'lucide-react';
import { format } from 'date-fns';

// FIX: Removed the unused 'Payment' import
import { PendingBill, PaymentMode } from './types';

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
  if (pendingBills.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-red-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base font-bold sm:text-lg">
            <span className="text-red-500">Pending Payments ({pendingBills.length})</span>
        </CardTitle>
        <Info className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <p className="text-sm text-muted-foreground">
            This customer has an outstanding balance of:
        </p>
        <p className="text-xl font-bold text-red-500 mb-0 sm:text-2xl sm:mb-2">₹{totalPendingAmount.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">
            {totalPendingAmount > 0 ? 'Select which bills to pay off with this transaction:' : 'No pending payments.'}
        </p>
        <div className="space-y-2 mt-2">
            {pendingBills.map(bill => (
                <Collapsible key={bill._id}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-2 space-y-1 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`bill-${bill._id}`}
                                checked={billsToClear.includes(bill._id)}
                                onCheckedChange={() => handleToggleBillToClear(bill._id)}
                                disabled={paymentMode === 'fully_paid' || paymentMode === 'fully_unpaid'}
                            />
                            <CollapsibleTrigger asChild>
                                <Label htmlFor={`bill-${bill._id}`} className="text-sm font-medium cursor-pointer flex-1">
                                    Bill No. **{bill.billId}**: ₹{bill.pendingAmount.toFixed(2)} pending
                                    <span className="ml-2 text-muted-foreground text-xs"> (Click for details)</span>
                                </Label>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="sm:ml-auto">
                                <ChevronsDown className="h-4 w-4" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent className="pl-4 mt-2">
                        <div className="text-xs text-muted-foreground border-l-2 pl-3">
                            <div className="space-y-0.5">
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span className="font-medium text-foreground">{format(new Date(bill.createdAt), 'MMM dd, yyyy')}</span>
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
                            
                            <h4 className="font-semibold mt-2 mb-1">Payments Received:</h4>
                            <ul className="space-y-0.5">
                                {bill.payments && bill.payments.length > 0 ? (
                                    bill.payments.map((p, index) => (
                                        <li key={index} className="flex flex-col sm:flex-row justify-between text-muted-foreground">
                                            <span>
                                                {p.source}:
                                                {p.source === 'Pending Bill Payment' && p.sourceBillIds && (
                                                    <span className="font-semibold text-foreground ml-2">
                                                        ({p.sourceBillIds.join(', ')})
                                                    </span>
                                                )}
                                            </span>
                                            <span className="font-medium text-foreground sm:text-right">₹{p.amount.toFixed(2)}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li>No payments have been received yet.</li>
                                )}
                            </ul>
                            
                            <h4 className="font-semibold mt-2 mb-1">Products:</h4>
                            <ul className="list-disc list-inside space-y-0.5">
                                {bill.items.map((item, index) => (
                                    <li key={index} className="flex flex-col">
                                        <span className="flex-1">
                                            {item.sparePart?.category || 'N/A'} x {item.quantity} (₹{item.unitPrice.toFixed(2)})
                                            {item.sparePart?.boxNumber && (
                                                <span className="ml-2 font-bold text-foreground">Box: {item.sparePart.boxNumber}</span>
                                            )}
                                        </span>
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