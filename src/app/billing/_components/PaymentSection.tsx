// src/app/billing/_components/PaymentSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

// Import all types from the central types file
import { PaymentMode, Payment } from './types';

interface PaymentSectionProps {
  discountAmount: number;
  setDiscountAmount: (amount: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  totalNewBillAmount: number;
  totalPendingAmount: number;
  totalDue: number;
  paymentMode: PaymentMode;
  handlePaymentModeChange: (mode: PaymentMode) => void;
  payments: Payment[];
  newPayment: Payment;
  setNewPayment: (payment: Payment) => void;
  // FIX: Added new props for the new payment source state and handler
  newPaymentSource: Payment['source'];
  handleNewPaymentSourceChange: (source: Payment['source']) => void;
  totalPaid: number;
  remainingToPay: number;
  isSubmitting: boolean;
  handleSubmitBill: () => void;
  handleAddPayment: () => void;
  handleUpdatePaymentSource: (index: number, source: Payment['source']) => void;
  handleRemovePayment: (index: number) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  discountAmount,
  setDiscountAmount,
  notes,
  setNotes,
  totalNewBillAmount,
  totalPendingAmount,
  totalDue,
  paymentMode,
  handlePaymentModeChange,
  payments,
  newPayment,
  setNewPayment,
  // FIX: Added new props to the destructuring
  newPaymentSource,
  handleNewPaymentSourceChange,
  totalPaid,
  remainingToPay,
  isSubmitting,
  handleSubmitBill,
  handleAddPayment,
  handleUpdatePaymentSource,
  handleRemovePayment,
}) => {
  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-xl md:text-2xl">Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="discount">Discount Amount (₹)</Label>
            <Input
              id="discount"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="md:col-span-1 flex flex-col justify-end text-right space-y-1">
            <p className="text-sm text-muted-foreground">New Bill Subtotal</p>
            <p className="text-lg font-semibold">₹{totalNewBillAmount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Due (New + Pending)</p>
            <p className="text-xl font-bold">₹{totalDue.toFixed(2)}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="mb-4">
          <Label>Payment Mode</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant={paymentMode === 'fully_paid' ? 'default' : 'outline'}
              onClick={() => handlePaymentModeChange('fully_paid')}
              className="flex-1 min-w-[120px]"
            >
              Fully Paid
            </Button>
            <Button
              variant={paymentMode === 'fully_unpaid' ? 'default' : 'outline'}
              onClick={() => handlePaymentModeChange('fully_unpaid')}
              className="flex-1 min-w-[120px]"
            >
              Fully Unpaid
            </Button>
            <Button
              variant={paymentMode === 'partially_paid' ? 'default' : 'outline'}
              onClick={() => handlePaymentModeChange('partially_paid')}
              className="flex-1 min-w-[120px]"
            >
              Partially Paid
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Payments Received</Label>
          <div className="border rounded-md p-4 space-y-4">
            {(paymentMode === 'partially_paid' || paymentMode === 'fully_paid') && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label htmlFor="newPaymentAmount">Amount to Pay</Label>
                  <Input
                    id="newPaymentAmount"
                    type="number"
                    value={newPayment.amount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewPayment({ ...newPayment, amount: value === '' ? 0 : parseFloat(value) || 0 });
                    }}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="newPaymentSource">Payment Source</Label>
                  {/* FIX: Use the newPaymentSource state and handler */}
                  <Select
                    value={newPaymentSource}
                    onValueChange={(value: Payment['source']) => handleNewPaymentSourceChange(value)}
                  >
                    <SelectTrigger id="newPaymentSource">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button onClick={handleAddPayment} className="w-full sm:w-auto">Add Payment</Button>
                </div>
              </div>
            )}

            {payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-semibold">Payment Breakdown</p>
                {payments.map((p, index) => (
                  <div key={index} className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md space-y-2 sm:space-y-0">
                    <div className="flex-1 font-semibold text-lg">
                        ₹{p.amount.toFixed(2)}
                    </div>
                    <div className="flex-1 sm:ml-4">
                        <Select
                            value={p.source}
                            onValueChange={(value: Payment['source']) => handleUpdatePaymentSource(index, value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-muted-foreground hover:text-destructive self-end sm:self-center"
                      onClick={() => handleRemovePayment(index)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {payments.length === 0 && (paymentMode === 'partially_paid' || paymentMode === 'fully_paid') && (
              <p className="text-sm text-muted-foreground text-center">No payments added yet.</p>
            )}
          </div>
        </div>
        
        <Separator className="my-6" />

        <div className="flex justify-between items-center font-bold">
          <span className="text-2xl">Total Paid:</span>
          <span className="text-2xl">₹{totalPaid.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center font-bold mt-2">
          <span className={`text-xl ${remainingToPay > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {remainingToPay > 0 ? 'Remaining to Pay:' : 'Overpaid:'}
          </span>
          <span className={`text-xl ${remainingToPay > 0 ? 'text-red-500' : 'text-green-500'}`}>
              ₹{Math.abs(remainingToPay).toFixed(2)}
          </span>
        </div>

        <div className="mt-6 space-y-1">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes for the bill..."
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSubmitBill}
            disabled={isSubmitting || totalDue <= 0 || (totalPaid > totalDue + 0.01)}
            className="w-full"
          >
            {isSubmitting ? 'Finalizing...' : 'Finalize Bill'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;