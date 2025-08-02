'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import ViewBill from './ViewBill';

// Define the Payment interface to handle amount and source
interface IPayment {
  amount: number;
  source: 'Cash' | 'UPI';
}

interface IBillDisplay {
  _id: string;
  billId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: 'Full Paid' | 'Unpaid' | 'Partially Paid';
  createdAt: string;
  items: IBillItemDisplay[];
  notes?: string;
  discountAmount: number;
  payments: IPayment[];
}

interface IBillItemDisplay {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sparePart: {
    category: string;
    deviceModel: string[];
    brand: string[];
    boxNumber?: string;
  };
}

const BillList: React.FC = () => {
  const [bills, setBills] = useState<IBillDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'Full Paid' | 'Unpaid' | 'Partially Paid'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'custom'>('all');
  
  // NEW: State for pagination
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const limit = 10;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(customerSearchTerm);
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [customerSearchTerm]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  useEffect(() => {
    // NEW: Reset pagination state when filters change
    setBills([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearchTerm, paymentStatusFilter, dateRange, datePreset]);

  useEffect(() => {
    // Prevent fetching if there are no more bills to load, and it's not the initial load
    if (!hasMore && page > 1) return;
    
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        
        // UPDATED: Search logic now correctly handles number-only search terms as a bill ID
        if (debouncedSearchTerm) {
          const isNumber = /^\d+$/.test(debouncedSearchTerm.replace(/BILL-/, ''));
          
          if (isNumber) {
            queryParams.append('billId', debouncedSearchTerm);
          } else {
            queryParams.append('customerSearch', debouncedSearchTerm);
          }
        }

        if (paymentStatusFilter !== 'All') {
          queryParams.append('paymentStatus', paymentStatusFilter);
        }

        if (dateRange?.from) {
          queryParams.append('startDate', dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          const endDate = new Date(dateRange.to);
          endDate.setDate(endDate.getDate() + 1);
          queryParams.append('endDate', endDate.toISOString());
        }

        // Add pagination parameters to the query
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        const res = await fetch(`/api/bills?${queryParams.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch bills');
        }

        // --- NEW: De-duplication logic ---
        setBills((prevBills) => {
            const combinedBills = [...prevBills, ...data];
            const uniqueBillIds = new Set(combinedBills.map(bill => bill.billId));
            const uniqueBills = Array.from(uniqueBillIds).map(billId => {
                // Find the latest version of the bill in the combined list
                return combinedBills.find(bill => bill.billId === billId);
            }).filter(bill => bill !== undefined) as IBillDisplay[];
            return uniqueBills;
        });
        
        setHasMore(data.length === limit);

        if (page === 1) {
            toast.success("Bills Loaded", {
              description: `Successfully fetched ${data.length} bills.`,
            });
        }
      } catch (err) { // FIX: Remove ': any' and handle error type-safely
        console.error("Error fetching bills:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        toast.error("Error Loading Bills", {
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [debouncedSearchTerm, paymentStatusFilter, dateRange, datePreset, page, hasMore]);
  
  const handleDatePresetChange = (value: typeof datePreset) => {
    setDatePreset(value);
    if (value === 'all') {
      setDateRange(undefined);
    } else if (value === 'today') {
      const today = new Date();
      setDateRange({ from: today, to: today });
    } else if (value === 'last7') {
      const today = new Date();
      setDateRange({ from: subDays(today, 6), to: today });
    } else if (value === 'last30') {
      const today = new Date();
      setDateRange({ from: subDays(today, 29), to: today });
    } else if (value === 'thisMonth') {
      const today = new Date();
      setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
    } else if (value === 'custom') {
      // Don't change dateRange, let the calendar handle it
    }
  };

  const handleClearFilters = () => {
    setCustomerSearchTerm('');
    setPaymentStatusFilter('All');
    setDateRange(undefined);
    setDatePreset('all');
  };

  const handleViewMore = () => {
    setPage((prevPage) => prevPage + 1);
  };
  
  const handleViewDetails = (billId: string) => {
      setSelectedBillId(billId);
      setIsViewModalOpen(true);
  };

  if (loading && bills.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Loading bills...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error}</p>
        <p>Please check your server and network connection.</p>
      </div>
    );
  }

  const normalizedStatus = (status: 'Full Paid' | 'Unpaid' | 'Partially Paid'): string => {
    if (!status) return '';
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  const displayDateRange = dateRange?.from ? (
    dateRange.to ? (
      `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
    ) : (
      format(dateRange.from, "LLL dd, y")
    )
  ) : (
    "All Dates"
  );
  
  return (
    <>
      <Card>
        {/* NEW: Reduced padding on mobile for a tighter fit */}
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">Past Bills</CardTitle>
          <CardDescription>All generated bills and their payment status.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* NEW: More compact grid layout for filters on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <div className="space-y-1">
              <Label htmlFor="customerSearch" className="text-sm">Filter by Customer or Bill ID</Label>
              <Input
                id="customerSearch"
                type="text"
                placeholder="Name, Phone, or Bill ID..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentStatusFilter" className="text-sm">Filter by Status</Label>
              <Select
                value={paymentStatusFilter}
                onValueChange={(value: 'All' | 'Full Paid' | 'Unpaid' | 'Partially Paid') => setPaymentStatusFilter(value)}
              >
                <SelectTrigger id="paymentStatusFilter" className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Full Paid">Full Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateRange" className="text-sm">Filter by Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 relative",
                      (datePreset === 'all' || !dateRange?.from) && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{displayDateRange}</span>
                    {(dateRange?.from || datePreset !== 'all') && (
                      <X className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground" onClick={(e) => {
                        e.stopPropagation();
                        handleClearFilters();
                      }} />
                    )}
                  </Button>
                </PopoverTrigger>
                {/* NEW: Popover fills the screen width on mobile */}
                <PopoverContent className="w-[calc(100vw-2rem)] p-0" align="start">
                  <div className='flex flex-col p-2'>
                    <div className='flex gap-2 mb-2'>
                      <Select
                        value={datePreset}
                        onValueChange={handleDatePresetChange}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder="All Dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="last7">Last 7 Days</SelectItem>
                          <SelectItem value="last30">Last 30 Days</SelectItem>
                          <SelectItem value="thisMonth">This Month</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {datePreset === 'custom' && (
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                      />
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {/* NEW: Full-width button on mobile, stacked at the bottom */}
            <div className="flex items-end col-span-1 md:col-span-1">
              <Button variant="outline" onClick={handleClearFilters} className="w-full h-9">
                Clear Filters
              </Button>
            </div>
          </div>

          {bills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bills found. Create a new bill to see it here.</p>
          ) : (
            <>
              {/* Desktop View: Regular Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Amt (₹)</TableHead>
                        <TableHead>Paid (₹)</TableHead>
                        <TableHead>Pending (₹)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bills.map((bill) => (
                        <TableRow key={bill._id}>
                          <TableCell className="font-medium">{bill.billId}</TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                          <TableCell>{bill.customerPhone}</TableCell>
                          <TableCell>₹{bill.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>₹{bill.amountPaid.toFixed(2)}</TableCell>
                          <TableCell className={bill.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                            ₹{bill.pendingAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                bill.paymentStatus === 'Full Paid' ? 'bg-green-100 text-green-800' :
                                bill.paymentStatus === 'Partially Paid' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {normalizedStatus(bill.paymentStatus)}
                            </span>
                          </TableCell>
                          <TableCell>{format(new Date(bill.createdAt), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(bill._id)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {/* NEW: Mobile View: Card-based list for smaller screens */}
              <div className="block md:hidden space-y-3">
                {bills.map((bill) => (
                  <div key={bill._id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-base">{bill.billId}</p>
                        <p className="text-sm text-muted-foreground">{bill.customerName}</p>
                        <p className="text-xs text-muted-foreground">{bill.customerPhone}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold self-start ${
                        bill.paymentStatus === 'Full Paid' ? 'bg-green-100 text-green-800' :
                        bill.paymentStatus === 'Partially Paid' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {normalizedStatus(bill.paymentStatus)}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Total Amount</p>
                        <p className="font-semibold">₹{bill.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Amount Paid</p>
                        <p className="font-semibold text-green-600">₹{bill.amountPaid.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Pending Amount</p>
                        <p className={`font-semibold ${bill.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{bill.pendingAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Date</p>
                        <p className="font-semibold">{format(new Date(bill.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full h-9" onClick={() => handleViewDetails(bill._id)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* "View More" button for pagination */}
          {hasMore && (
            <div className="mt-4 text-center">
              <Button onClick={handleViewMore} disabled={loading}>
                {loading ? "Loading..." : "View More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {/* NEW: Make the modal content responsive */}
        <DialogContent className="max-w-full sm:max-w-4xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            {selectedBillId ? (
                <ViewBill billId={selectedBillId} />
            ) : (
                <div className="flex justify-center items-center h-48">
                    <p>Loading bill details...</p>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillList;