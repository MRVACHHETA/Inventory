// src/app/billing/_components/PaymentSummaryCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';
import {
  PaidBillHistoryItem,
  FinalNewBillStatus,
} from './types';

interface PaymentSummaryCardProps {
  finalNewBillStatus: FinalNewBillStatus;
  paidBillsHistory: PaidBillHistoryItem[];
  handleClearCustomer: () => void;
}

const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  finalNewBillStatus,
  paidBillsHistory,
  handleClearCustomer,
}) => {
  const isOverpaid = finalNewBillStatus.pendingAmount < 0;
  const isFullyPaid = finalNewBillStatus.pendingAmount === 0;
  const isPartiallyPaid = finalNewBillStatus.pendingAmount > 0;

  return (
    <Card className="border-l-4 border-green-500">
      <CardHeader className="bg-green-50 dark:bg-green-950 p-4 md:p-6 flex flex-row items-center space-x-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <CardTitle className="text-green-600 dark:text-green-400 text-xl">Bill Finalized Successfully!</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <h4 className="text-lg font-bold">Today&apos;s Bill:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p><span className="font-semibold text-sm">Bill ID:</span> {finalNewBillStatus.billId}</p>
            <p><span className="font-semibold text-sm">Status:</span> <span className="font-semibold">{finalNewBillStatus.paymentStatus}</span></p>
          </div>
          
          {/* FIX: Updated display logic to handle negative, zero, and positive pending amounts */}
          {isPartiallyPaid && (
              <p className="text-red-500 font-bold">Remaining Due: ₹{finalNewBillStatus.pendingAmount.toFixed(2)}</p>
          )}
          {isFullyPaid && (
              <p className="text-green-500 font-bold">This bill is fully paid!</p>
          )}
          {isOverpaid && (
              <p className="text-blue-500 font-bold">Overpaid: ₹{Math.abs(finalNewBillStatus.pendingAmount).toFixed(2)}</p>
          )}

          {paidBillsHistory.length > 0 && (
              <>
                  <Separator className="my-4" />
                  {/* FIX: Improved heading to be more descriptive */}
                  <h4 className="text-lg font-bold">Payments Applied to Previous Bills:</h4>
                  <div className="space-y-2">
                      {paidBillsHistory.map((history, index) => (
                          <div key={index} className="border p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                              <p className="font-semibold text-base">Bill No. {history.billId}</p>
                              <p className="text-sm">Amount Cleared: <span className="font-medium">₹{history.amountCleared.toFixed(2)}</span></p>
                              {history.newPendingAmount > 0 ? (
                                  <p className="text-sm text-orange-500 font-medium">New Pending: ₹{history.newPendingAmount.toFixed(2)}</p>
                              ) : (
                                  <p className="text-sm text-green-500 font-medium">Status: Fully Paid</p>
                              )}
                          </div>
                      ))}
                  </div>
              </>
          )}
        </div>
        <Button onClick={handleClearCustomer} className="mt-6 w-full md:w-auto">
            Create Another Bill
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentSummaryCard;