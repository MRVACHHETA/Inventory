// File: src/app/billing/_components/NewBillForm.tsx

'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';

// Corrected import paths
import CustomerSection from './CustomerSection';
import PendingBillsSection from './PendingBillsSection';
import BillItemsSection from './BillItemsSection';
import PaymentSection from './PaymentSection';
import PaymentSummaryCard from './PaymentSummaryCard';
import EditCustomerModal from './EditCustomerModal';

// Import the custom hook
import useNewBillForm from './useNewBillForm';

const NewBillForm: React.FC = () => {
  const {
    // Customer state and handlers
    customer, setCustomer, customerSearchTerm, handleCustomerSearch, searchResultsCustomers,
    selectedCustomerId, handleSelectExistingCustomer, handleClearCustomer, handleEditCustomerClick,
    handleDeleteCustomer,

    // Customer Modal state and handlers
    isEditCustomerModalOpen, setIsEditCustomerModalOpen, customerToEdit, setCustomerToEdit,
    handleUpdateCustomer,

    // Bill Items state and handlers
    billItems, partSearchTerm, searchResultsParts, selectedPartToAdd,
    handleSelectPartToAdd, handleAddItem, handleItemQuantityChange, handleItemPriceChange,
    handleRemoveItem, openPartSearch, setOpenPartSearch, categories, selectedCategory,
    handleSelectCategory,
    handlePartSearch,

    // Pending Bills state and handlers
    pendingBills, billsToClear, handleToggleBillToClear, totalPendingAmount,

    // Payment and Finalization state and handlers
    discountAmount, setDiscountAmount, notes, setNotes, totalNewBillAmount, totalDue,
    paymentMode, handlePaymentModeChange, payments, newPayment, setNewPayment, totalPaid,
    remainingToPay, isSubmitting, handleSubmitBill, handleAddPayment, handleUpdatePaymentSource,
    handleRemovePayment,

    // Final Summary state
    showPaymentSummary, finalNewBillStatus, paidBillsHistory,
  } = useNewBillForm();

  return (
    <div className="space-y-6">
      <CustomerSection
        customer={customer}
        setCustomer={setCustomer}
        customerSearchTerm={customerSearchTerm}
        handleCustomerSearch={handleCustomerSearch}
        searchResultsCustomers={searchResultsCustomers}
        selectedCustomerId={selectedCustomerId}
        handleSelectExistingCustomer={handleSelectExistingCustomer}
        handleClearCustomer={handleClearCustomer}
        handleEditCustomerClick={handleEditCustomerClick}
        handleDeleteCustomer={handleDeleteCustomer}
      />

      {selectedCustomerId && !showPaymentSummary && (
        <PendingBillsSection
          pendingBills={pendingBills}
          billsToClear={billsToClear}
          handleToggleBillToClear={handleToggleBillToClear}
          totalPendingAmount={totalPendingAmount}
          paymentMode={paymentMode}
        />
      )}

      <Separator />

      <BillItemsSection
        billItems={billItems}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleSelectCategory}
        partSearchTerm={partSearchTerm}
        handlePartSearch={handlePartSearch}
        searchResultsParts={searchResultsParts}
        selectedPartToAdd={selectedPartToAdd}
        handleSelectPartToAdd={handleSelectPartToAdd}
        handleAddItem={handleAddItem}
        handleItemQuantityChange={handleItemQuantityChange}
        handleItemPriceChange={handleItemPriceChange}
        handleRemoveItem={handleRemoveItem}
        openPartSearch={openPartSearch}
        setOpenPartSearch={setOpenPartSearch}
      />

      <Separator />

      {!showPaymentSummary && (
        <PaymentSection
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          notes={notes}
          setNotes={setNotes}
          totalNewBillAmount={totalNewBillAmount}
          totalPendingAmount={totalPendingAmount} // Corrected line: added the missing prop
          totalDue={totalDue}
          paymentMode={paymentMode}
          handlePaymentModeChange={handlePaymentModeChange}
          payments={payments}
          newPayment={newPayment}
          setNewPayment={setNewPayment}
          totalPaid={totalPaid}
          remainingToPay={remainingToPay}
          isSubmitting={isSubmitting}
          handleSubmitBill={handleSubmitBill}
          handleAddPayment={handleAddPayment}
          handleUpdatePaymentSource={handleUpdatePaymentSource}
          handleRemovePayment={handleRemovePayment}
        />
      )}

      {showPaymentSummary && (
        <PaymentSummaryCard
          finalNewBillStatus={finalNewBillStatus}
          paidBillsHistory={paidBillsHistory}
          handleClearCustomer={handleClearCustomer}
        />
      )}

      <EditCustomerModal
        isOpen={isEditCustomerModalOpen}
        onOpenChange={setIsEditCustomerModalOpen}
        customerToEdit={customerToEdit}
        setCustomerToEdit={setCustomerToEdit}
        handleUpdateCustomer={handleUpdateCustomer}
      />
    </div>
  );
};

export default NewBillForm;