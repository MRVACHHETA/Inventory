'use client';

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar, IndianRupee, NotebookPen, ReceiptText, User, PlusCircle, Printer, ArrowRightCircle, Smartphone, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddPaymentModal from './AddPaymentModal';
import { Bill, Payment } from './types';

interface ViewBillProps {
  billId: string;
}

const formatStatus = (status: 'Fully Paid' | 'Partially Paid' | 'Unpaid'): string => {
  if (!status) return '';
  return status.replace(/([A-Z])/g, ' $1').trim();
};

const statusColor: Record<Bill['paymentStatus'], string> = {
  'Fully Paid': 'bg-green-500',
  'Partially Paid': 'bg-orange-500',
  'Unpaid': 'bg-red-500'
};

const ViewBill: React.FC<ViewBillProps> = ({ billId }) => {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  const fetchBill = useCallback(async () => {
    if (!billId) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/bills/${billId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch bill data.');
      }
      
      const sortedPayments = data.payments.sort((a: Payment, b: Payment) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setBill({ ...data, payments: sortedPayments });

      toast.success(`Bill ${data.billId} loaded.`, {
        description: `Details for bill ${data.billId} have been fetched successfully.`,
      });
    } catch (err: unknown) {
      console.error('Error fetching bill:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error('Error fetching bill', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBill();
  }, [billId, fetchBill]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!bill) {
    return <p className="text-center text-muted-foreground">Bill not found.</p>;
  }

  const normalizedStatus = formatStatus(bill.paymentStatus);

  const generateShareMessage = (): string => {
    let message = `*--- Sai Chetna Mobiles ---*\n\n`;
    message += `*Invoice ID:* ${bill.billId}\n`;
    message += `*Date:* ${format(new Date(bill.createdAt), 'dd MMMM, yyyy h:mm a')}\n\n`;
    message += `*Customer:* ${bill.customerName}\n`;
    message += `*Phone:* ${bill.customerPhone}\n\n`;
    
    message += `*--- Items on Bill ---*\n`;
    bill.items.forEach((item) => {
        message += `• ${item.name} (${item.deviceModel.join(', ')}) - Qty: ${item.quantity}\n`;
        message += `   Price: ₹${item.unitPrice.toFixed(2)} x ${item.quantity} = ₹${item.subtotal.toFixed(2)}\n`;
    });
    message += `\n`;

    message += `*--- Payment Timeline ---*\n`;
    let runningPendingAmount = bill.totalAmount;
    message += `*Initial Bill Amount:* ₹${bill.totalAmount.toFixed(2)}\n`;
    bill.payments.forEach((payment) => {
      if (payment.source !== 'Payment for Previous Bills') {
          runningPendingAmount -= payment.amount;
          message += `   - *Paid:* ₹${payment.amount.toFixed(2)} via ${payment.source}\n`;
          message += `     *Remaining:* ₹${runningPendingAmount.toFixed(2)}\n`;
      } else {
        message += `   - *Paid:* ₹${payment.amount.toFixed(2)} for previous bill(s): ${payment.sourceBillIds?.join(', ')}\n`;
      }
      message += `     *Date:* ${format(new Date(payment.date), 'dd MMM, yyyy h:mm a')}\n`;
    });
    message += `\n`;
    
    message += `*--- Final Summary ---*\n`;
    message += `*Subtotal:* ₹${(bill.totalAmount + bill.discountAmount).toFixed(2)}\n`;
    if (bill.discountAmount > 0) {
        message += `*Discount:* -₹${bill.discountAmount.toFixed(2)}\n`;
    }
    message += `*Final Total:* ₹${bill.totalAmount.toFixed(2)}\n`;
    message += `*Amount Paid:* ₹${bill.amountPaid.toFixed(2)}\n`;
    message += `*Pending Amount:* ₹${bill.pendingAmount.toFixed(2)}\n\n`;
    
    if (bill.notes) {
      message += `*Notes:* ${bill.notes}\n\n`;
    }

    message += `*Thank you for your purchase. We hope to see you again soon!*`;
    
    return encodeURIComponent(message);
  };

  const generatePrintableHtml = (billData: Bill): string => {
    const itemsHtml = billData.items.map((item) => `
      <tr class="border-b">
        <td class="py-2 px-4 font-medium">${item.name}<br><span class="text-xs text-gray-500">${item.deviceModel.join(', ')}</span></td>
        <td class="py-2 px-4">${item.boxNumber || 'N/A'}</td>
        <td class="py-2 px-4">${item.quantity}</td>
        <td class="py-2 px-4">₹${item.unitPrice.toFixed(2)}</td>
        <td class="py-2 px-4 text-right">₹${item.subtotal.toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentsHtml = billData.payments.map((payment) => {
      let paymentSourceDescription: string;
      if (payment.source === 'Payment for Previous Bills' && payment.sourceBillIds && payment.sourceBillIds.length > 0) {
        paymentSourceDescription = `for old bill(s): ${payment.sourceBillIds.join(', ')}`;
      } else {
        paymentSourceDescription = `via ${payment.source}`;
      }
      return `
        <div class="flex justify-between items-center text-sm">
          <span>Paid ₹${payment.amount.toFixed(2)} (${paymentSourceDescription})</span>
          <span>${format(new Date(payment.date), 'dd MMM, yyyy h:mm a')}</span>
        </div>
      `;
    }).join('');

    const summaryHtml = `
      <div class="space-y-2 mt-4">
        <div class="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₹${(billData.totalAmount + billData.discountAmount).toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm text-red-500">
          <span>Discount</span>
          <span>-₹${billData.discountAmount.toFixed(2)}</span>
        </div>
        <hr class="my-2"/>
        <div class="flex justify-between text-lg font-bold">
          <span>Final Total</span>
          <span>₹${billData.totalAmount.toFixed(2)}</span>
        </div>
        <hr class="my-2"/>
        <div class="flex justify-between text-lg font-bold text-green-500">
          <span>Amount Paid</span>
          <span>₹${billData.amountPaid.toFixed(2)}</span>
        </div>
        ${billData.pendingAmount > 0 ? `
        <div class="flex justify-between text-lg font-bold text-red-500">
          <span>Pending Amount</span>
          <span>₹${billData.pendingAmount.toFixed(2)}</span>
        </div>` : ''}
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${billData.billId}</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 2rem; background: white; color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 2rem; }
          .section { margin-bottom: 1.5rem; }
          h1, h2, h3 { margin: 0; padding: 0; }
          h2 { font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .text-sm { font-size: 0.875rem; }
          .font-bold { font-weight: bold; }
          .text-green-500 { color: #22c55e; }
          .text-red-500 { color: #ef4444; }
          .text-gray-500 { color: #6b7280; }
          .text-lg { font-size: 1.125rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f9fafb; font-weight: bold; }
          .text-right { text-align: right; }
          @page {
            size: A4;
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 class="text-2xl font-bold">Sai Chetna Mobiles</h1>
            <p>Invoice ID: ${billData.billId}</p>
            <p>Date: ${format(new Date(billData.createdAt), 'dd MMMM, yyyy h:mm a')}</p>
          </header>

          <div class="section">
            <h2 class="text-xl font-bold">Customer Details</h2>
            <div class="flex justify-between">
              <span>Customer Name: ${billData.customerName}</span>
              <span>Phone: ${billData.customerPhone}</span>
            </div>
          </div>

          <div class="section">
            <h2 class="text-xl font-bold">Items on Bill</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Box No.</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="text-xl font-bold">Payment Details</h2>
            <div class="space-y-1">
              ${paymentsHtml}
            </div>
          </div>

          <div class="section">
            <h2 class="text-xl font-bold">Financial Summary</h2>
            ${summaryHtml}
          </div>

          ${billData.notes ? `
          <div class="section">
            <h2 class="text-xl font-bold">Notes</h2>
            <p>${billData.notes}</p>
          </div>` : ''}

          <footer style="text-align: center; margin-top: 2rem; font-size: 0.75rem; color: #888;">
            <p>Thank you for your purchase. We hope to see you again soon!</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!bill) {
      toast.error("Bill data not available to print.");
      return;
    }
    
    const printContent = generatePrintableHtml(bill);
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Could not open print window. Please check your browser's pop-up settings.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };
  };

  const paymentTimeline = () => {
      let runningPendingAmount = bill.totalAmount;
      const timeline: { description: string | ReactNode, amount: number, date: string, runningBalance: number, sourceBillIds?: string[] }[] = [];

      timeline.push({
          description: "Initial Bill Amount",
          amount: bill.totalAmount,
          date: bill.createdAt,
          runningBalance: bill.totalAmount,
      });

      bill.payments.forEach((payment) => {
        let amountToSubtract = 0;
        let description: string | ReactNode;

        if (payment.source === 'Payment for Previous Bills') {
          // Do not subtract from current bill's running balance
          amountToSubtract = 0; 
          description = (
            <>
              <span className="flex items-center">
                  <ArrowRightCircle className="h-4 w-4 mr-2 text-green-500" />
                  Payment for Previous Bills
              </span>
            </>
          );
        } else {
          // Subtract a payment made for the current bill
          amountToSubtract = payment.amount;
          description = `Payment via ${payment.source}`;
        }
          
        runningPendingAmount -= amountToSubtract;

        timeline.push({
            description: description,
            amount: payment.amount,
            date: new Date(payment.date).toISOString(),
            runningBalance: runningPendingAmount,
            sourceBillIds: payment.sourceBillIds,
        });
      });

      return timeline;
  };

  const timelineData = paymentTimeline();

  return (
    <>
      <Card className="min-w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-6 w-6" />
              <span>Bill ID: {bill.billId}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${statusColor[bill.paymentStatus]} text-white text-base shrink-0`}>
                {normalizedStatus}
              </Badge>
              <Link href={`https://wa.me/?text=${generateShareMessage()}`} passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="shrink-0">
                    <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                </a>
              </Link>
              <Link href={`sms:?body=${generateShareMessage()}`} passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Smartphone className="h-4 w-4 mr-2" /> SMS
                  </Button>
                </a>
              </Link>
              <Button variant="outline" size="sm" onClick={handlePrint} className="shrink-0">
                  <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-semibold text-lg text-foreground">{bill.customerName}</span>
              <span className="ml-2">({bill.customerPhone})</span>
            </div>
            <div className="flex items-center gap-2 justify-start md:justify-end">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(bill.createdAt), 'dd MMMM, yyyy h:mm a')}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[80vh]">
          <Separator className="my-6" />
          
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Items on Bill
          </h3>
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Box No.</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.name}
                      <br />
                      <span className="text-xs text-muted-foreground">{item.deviceModel.join(', ')}</span>
                    </TableCell>
                    <TableCell>{item.boxNumber || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{item.subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <NotebookPen className="h-5 w-5" />
                Payment Timeline
              </h3>
              <div className="relative pl-5">
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-muted-foreground/30" />
                {timelineData.map((event, index) => {
                    const isInitial = index === 0;
                    const isPaymentForOtherBills = event.sourceBillIds && event.sourceBillIds.length > 0;
                    
                    return (
                        <div key={index} className="relative flex items-start gap-4 mb-6">
                            <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0 mt-0.5">
                                <IndianRupee className="h-3 w-3" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {isPaymentForOtherBills ? (
                                    <>
                                      <span className="flex items-center">
                                        <ArrowRightCircle className="h-4 w-4 mr-2 text-green-500" />
                                        Payment for Previous Bills
                                      </span>
                                      <span className="ml-6 text-xs font-semibold text-muted-foreground">(from bill(s): {event.sourceBillIds?.join(', ')})</span>
                                    </>
                                  ) : (
                                    event.description
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(event.date), 'dd MMM, yyyy h:mm a')}
                                </p>
                                {!isInitial && (
                                    <div className="flex justify-between mt-1 text-sm">
                                        <span className="text-sm">
                                          Paid: <span className="font-bold text-green-500">₹{event.amount.toFixed(2)}</span>
                                        </span>
                                        {/* FIX: Only show remaining if it's not a payment for other bills */}
                                        {!isPaymentForOtherBills && (
                                          <span className="text-sm">
                                            Remaining: <span className="font-bold text-red-500">₹{event.runningBalance.toFixed(2)}</span>
                                          </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
              </div>
              {bill.paymentStatus !== 'Fully Paid' && (
                <Button className="mt-4 w-full" onClick={() => setIsAddPaymentModalOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add New Payment
                </Button>
              )}
            </div>
            
            <div className="self-end">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Financial Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{(bill.totalAmount + bill.discountAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="font-medium text-red-500">-₹{bill.discountAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Total</span>
                  <span>₹{bill.totalAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-green-500">
                  <span>Amount Paid</span>
                  <span>₹{bill.amountPaid.toFixed(2)}</span>
                </div>
                {bill.pendingAmount > 0 && (
                  <div className="flex justify-between text-lg font-bold text-red-500">
                    <span>Pending Amount</span>
                    <span>₹{bill.pendingAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {bill.notes && (
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                {bill.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isAddPaymentModalOpen} onOpenChange={setIsAddPaymentModalOpen}>
        <DialogContent>
            {bill.pendingAmount > 0 && (
                <AddPaymentModal
                    billId={bill._id}
                    pendingAmount={bill.pendingAmount}
                    onPaymentSuccess={fetchBill}
                    onClose={() => setIsAddPaymentModalOpen(false)}
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewBill;