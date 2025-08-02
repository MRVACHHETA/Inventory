// src/app/billing/_components/AddPaymentModal.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { IndianRupee, Loader2 } from 'lucide-react';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface AddPaymentModalProps {
  billId: string;
  pendingAmount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ billId, pendingAmount, onPaymentSuccess, onClose }) => {
  const [amount, setAmount] = useState<number | ''>('');
  // FIX: Updated source to only allow Cash or UPI
  const [source, setSource] = useState<'Cash' | 'UPI'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (amount > pendingAmount) {
      toast.error('Payment exceeds pending amount', {
        description: `Payment amount ₹${amount.toFixed(2)} cannot exceed the pending balance of ₹${pendingAmount.toFixed(2)}.`,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payments: [{
            amount: amount,
            source: source,
          }],
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add payment.');
      }

      toast.success('Payment Added', {
        description: `₹${amount.toFixed(2)} payment recorded successfully.`,
      });
      onPaymentSuccess();
      onClose();

    } catch (err) { // FIX: Remove ': any' and handle error type-safely
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

      {/* NEW: Reduced overall vertical spacing */}
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
        
        <div className="space-y-2">
          <Label htmlFor="source" className="text-sm">Payment Source</Label>
          <Select value={source} onValueChange={(value: 'Cash' | 'UPI') => setSource(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment source" />
            </SelectTrigger>
            <SelectContent>
              {/* FIX: Removed 'Pending Bill Payment' from the list */}
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* NEW: Reduced top padding for a more compact footer */}
        <DialogFooter className="pt-3">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || amount === '' || amount <= 0 || amount > pendingAmount}>
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