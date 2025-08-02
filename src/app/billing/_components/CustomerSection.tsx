// File: src/app/billing/_components/CustomerSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// In a real project, you would move these types to a shared file, e.g., 'types/bill.ts'
interface CustomerFormData {
  _id?: string;
  name: string;
  phone: string;
  address?: string;
}

interface CustomerSectionProps {
  customer: CustomerFormData;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  customerSearchTerm: string;
  handleCustomerSearch: (term: string) => void;
  searchResultsCustomers: CustomerFormData[];
  selectedCustomerId: string | null;
  handleSelectExistingCustomer: (customerId: string) => void;
  handleClearCustomer: () => void;
  handleEditCustomerClick: () => void;
  handleDeleteCustomer: () => void;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({
  customer,
  setCustomer,
  customerSearchTerm,
  handleCustomerSearch,
  searchResultsCustomers,
  selectedCustomerId,
  handleSelectExistingCustomer,
  handleClearCustomer,
  handleEditCustomerClick,
  handleDeleteCustomer,
}) => {
  return (
    <Card>
      {/* NEW: Drastically reduced padding for a tighter fit on mobile */}
      <CardHeader className="p-2 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Customer Details</CardTitle>
      </CardHeader>
      {/* NEW: Reduced padding for the content area on mobile to be even tighter */}
      <CardContent className="p-2 sm:p-6">
        {/* NEW: Reduced gap for a more compact form on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className='space-y-1'>
            <Label htmlFor="customerSearch" className="text-sm">Search/Select Customer (by Name or Phone)</Label>
            <Input
              id="customerSearch"
              type="text"
              placeholder="Enter customer name or phone"
              value={customerSearchTerm}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              className="mb-1"
              disabled={selectedCustomerId !== null}
            />
            {searchResultsCustomers.length > 0 && selectedCustomerId === null && (
              <div className="border rounded-md max-h-48 overflow-y-auto mb-1">
                {searchResultsCustomers.map((c) => (
                  <div
                    key={c._id}
                    className="p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                    onClick={() => handleSelectExistingCustomer(c._id!)}
                  >
                    {c.name} ({c.phone}) {c.address && ` - ${c.address}`}
                  </div>
                ))}
              </div>
            )}
            {selectedCustomerId && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Button variant="outline" onClick={handleClearCustomer} className="h-8 text-sm">
                  Change Customer
                </Button>
                <Button variant="outline" onClick={handleEditCustomerClick} className="h-8 text-sm">
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDeleteCustomer} className="h-8 text-sm">
                  Delete
                </Button>
              </div>
            )}
          </div>
          {!selectedCustomerId ? (
            <>
              <div className='space-y-1'>
                <Label htmlFor="customerName" className="text-sm">Customer Name</Label>
                <Input
                  id="customerName"
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  required
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor="customerPhone" className="text-sm">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  type="text"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <Label htmlFor="customerAddress" className="text-sm">Customer Address (Optional)</Label>
                <Textarea
                  id="customerAddress"
                  value={customer.address || ''}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </div>
            </>
          ) : (
              <div className="md:col-span-2 space-y-0.5">
                  <p className="text-sm text-muted-foreground">Selected Customer:</p>
                  <p className="font-semibold text-sm">{customer.name}</p>
                  <p className="text-sm">{customer.phone}</p>
                  {customer.address && <p className="text-sm">{customer.address}</p>}
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSection;