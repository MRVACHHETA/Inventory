// src/app/billing/page.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import NewBillForm from './_components/NewBillForm';
import BillList from './_components/BillList'; // <--- NEW: Import BillList

const BillingPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Billing System</h1>

      {/* New Bill Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Bill</CardTitle>
          <CardDescription>Start a new sales transaction and manage items.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewBillForm />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* View Past Bills / Pending Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle>View Bills & Payments</CardTitle>
          <CardDescription>Search past bills and manage pending payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* <BillList /> */} {/* <--- UNCOMMENTED AND NOW RENDERING BillList */}
          <BillList />
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;