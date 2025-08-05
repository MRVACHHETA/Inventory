// src/app/billing/_components/AddPaymentModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { IndianRupee, Loader2 } from 'lucide-react';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming you have a Checkbox component
import { PendingBill, PaymentSource, PaidBillHistoryItem, Payment } from './types';
import { format } from 'date-fns';

interface AddPaymentModalProps {
  billId: string;
  pendingAmount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ billId, pendingAmount, onPaymentSuccess, onClose }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [source, setSource] = useState<PaymentSource>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [selectedBills, setSelectedBills] = useState<Record<string, boolean>>({});
  const [isLoadingPendingBills, setIsLoadingPendingBills] = useState(true);

  // Calculate the total pending amount of the selected bills
  const totalSelectedPendingAmount = pendingBills.reduce((total, bill) => {
    if (selectedBills[bill._id]) {
      return total + bill.pendingAmount;
    }
    return total;
  }, 0);

  // Calculate the amount to be applied to the current bill
  const paymentForThisBill = (amount === '' || amount <= totalSelectedPendingAmount)
    ? 0
    : amount - totalSelectedPendingAmount;

  // Fetch all pending bills for the customer (excluding the current one)
  useEffect(() => {
    const fetchPendingBills = async () => {
      try {
        setIsLoadingPendingBills(true);
        const res = await fetch(`/api/bills?getPendingBills=true&customerId=YOUR_CUSTOMER_ID_HERE&excludeBillId=${billId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch pending bills.');
        }
        const data: PendingBill[] = await res.json();
        setPendingBills(data);
      } catch (err) {
        console.error('Error fetching pending bills:', err);
        toast.error('Error fetching pending bills', {
          description: 'Could not load other pending bills for this customer.',
        });
      } finally {
        setIsLoadingPendingBills(false);
      }
    };
    // You need to pass the customerId to fetch the pending bills.
    // This part of the code needs to be adapted based on how you get the customerId in this component.
    // For now, I'm leaving a placeholder.
    // fetchPendingBills(); 
  }, [billId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (amount === '' || amount <= 0) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid payment amount.',
      });
      setIsSubmitting(false);
      return;
    }

    const totalPayment = amount;
    const paymentForOldBills = totalPayment > totalSelectedPendingAmount
        ? totalSelectedPendingAmount
        : totalPayment;

    const paymentForCurrentBill = totalPayment - paymentForOldBills;

    if (paymentForCurrentBill > pendingAmount) {
        toast.error('Payment exceeds pending amount', {
            description: `The amount applied to this bill (₹${paymentForCurrentBill.toFixed(2)}) cannot exceed the pending balance of ₹${pendingAmount.toFixed(2)}.`,
        });
        setIsSubmitting(false);
        return;
    }

    const paidBillHistory: PaidBillHistoryItem[] = [];
    const sourceBillIds: string[] = [];
    let remainingPaymentForOldBills = paymentForOldBills;

    // Build the paidBillHistory based on selected bills
    pendingBills.forEach(bill => {
        if (selectedBills[bill._id] && remainingPaymentForOldBills > 0) {
            const amountToClear = Math.min(remainingPaymentForOldBills, bill.pendingAmount);
            paidBillHistory.push({
                billId: bill._id,
                amountCleared: amountToClear,
                newPendingAmount: bill.pendingAmount - amountToClear,
            });
            sourceBillIds.push(bill.billId);
            remainingPaymentForOldBills -= amountToClear;
        }
    });

    try {
      const payload: {
          payments: Omit<Payment, 'date'>[];
          paidBillHistory?: PaidBillHistoryItem[];
      } = {
          payments: [],
          paidBillHistory: paidBillHistory.length > 0 ? paidBillHistory : undefined,
      };

      if (paymentForCurrentBill > 0) {
          payload.payments.push({
              amount: paymentForCurrentBill,
              source: source,
          });
      }

      if (paymentForOldBills > 0) {
          payload.payments.push({
              amount: paymentForOldBills,
              source: 'Payment for Previous Bills',
              sourceBillIds: sourceBillIds,
          });
      }

      if (payload.payments.length === 0) {
          toast.error("No payment amount specified.", {
              description: "Please specify an amount to pay for this bill or previous bills."
          });
          setIsSubmitting(false);
          return;
      }
      
      const res = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add payment.');
      }

      toast.success('Payment Added', {
        description: `₹${totalPayment.toFixed(2)} payment recorded successfully.`,
      });
      onPaymentSuccess();
      onClose();

    } catch (err) {
      console.error('Error adding payment:', err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while adding the payment.";
      toast.error('Payment Failed', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record New Payment</DialogTitle>
        <DialogDescription>
          Record a new payment for this bill. The current pending amount is{' '}
          <span className="font-bold text-red-600">₹{pendingAmount.toFixed(2)}</span>.
        </DialogDescription>
      </DialogHeader>
      
      <Separator className="my-3" />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm">Payment Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="pl-8"
              required
            />
            <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {isLoadingPendingBills ? (
            <div className="flex items-center space-x-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <p>Loading other pending bills...</p>
            </div>
        ) : pendingBills.length > 0 && (
            <div className="space-y-2 p-4 border rounded-md bg-muted/40">
                <p className="text-sm font-semibold">Other Pending Bills</p>
                <div className="max-h-[150px] overflow-y-auto">
                    {pendingBills.map(bill => (
                        <div key={bill._id} className="flex items-center space-x-2 my-2">
                            <Checkbox
                                id={bill._id}
                                checked={selectedBills[bill._id] || false}
                                onCheckedChange={(checked) => {
                                    setSelectedBills(prev => ({
                                        ...prev,
                                        [bill._id]: !!checked,
                                    }));
                                }}
                            />
                            <Label htmlFor={bill._id} className="font-normal text-sm">
                                Bill #{bill.billId} - <span className="font-semibold">₹{bill.pendingAmount.toFixed(2)}</span> ({format(new Date(bill.createdAt), 'dd MMM yyyy')})
                            </Label>
                        </div>
                    ))}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                    <p>Total of selected bills: <span className="font-bold text-red-500">₹{totalSelectedPendingAmount.toFixed(2)}</span></p>
                    <p>Amount for this bill: <span className="font-bold text-green-500">₹{paymentForThisBill.toFixed(2)}</span></p>
                </div>
            </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="source" className="text-sm">Payment Source</Label>
          <Select value={source} onValueChange={(value: PaymentSource) => setSource(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              {/* 'Payment for Previous Bills' is not a selectable option */}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="pt-3">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || amount === '' || amount <= 0 || paymentForThisBill > pendingAmount}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IndianRupee className="mr-2 h-4 w-4" />
            )}
            Record Payment
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default AddPaymentModal;