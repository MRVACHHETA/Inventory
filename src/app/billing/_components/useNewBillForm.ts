// File: src/app/billing/_components/useNewBillForm.ts

// FIX: Removed 'useCallback' as it was not being used
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  BillItemFormData,
  CustomerFormData,
  PendingBill,
  Payment,
  PaymentMode,
  SparePart,
  FinalNewBillStatus,
  PaidBillHistoryItem,
} from './types';

const useNewBillForm = () => {
  const [customer, setCustomer] = useState<CustomerFormData>({ name: '', phone: '', address: '' });
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [searchResultsCustomers, setSearchResultsCustomers] = useState<CustomerFormData[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerFormData | null>(null);

  const [billItems, setBillItems] = useState<BillItemFormData[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState<string>('');
  const [searchResultsParts, setSearchResultsParts] = useState<SparePart[]>([]);
  const [selectedPartToAdd, setSelectedPartToAdd] = useState<SparePart | null>(null);
  const [openPartSearch, setOpenPartSearch] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('partially_paid');

  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [paidBillsHistory, setPaidBillsHistory] = useState<PaidBillHistoryItem[]>([]);
  const [finalNewBillStatus, setFinalNewBillStatus] = useState<FinalNewBillStatus>({
    billId: '',
    pendingAmount: 0,
    paymentStatus: '',
  });

  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [billsToClear, setBillsToClear] = useState<string[]>([]);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPayment, setNewPayment] = useState<Payment>({ amount: 0, source: '', date: new Date().toISOString() });

  // Derived state calculations
  const subtotalItems = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalNewBillAmount = subtotalItems - discountAmount;
  const totalPendingAmount = pendingBills.reduce((sum, bill) => sum + bill.pendingAmount, 0);
  const totalDue = totalNewBillAmount + totalPendingAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingToPay = totalDue - totalPaid;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/spare-parts');
        const data: SparePart[] = await res.json(); // FIXED: Added type annotation to 'data'
        const uniqueCategories = Array.from(new Set(data.map((part) => part.category))); // FIXED: Removed 'any'
        setCategories(uniqueCategories as string[]);
      } catch (error: unknown) {
        // FIX: Replaced 'any' with 'unknown' and added type guard
        console.error('Failed to fetch categories:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not load part categories.';
        toast.error('Error fetching categories', { description: errorMessage });
      }
    };
    fetchCategories();
  }, []);

  const handleSelectCategory = (value: string) => {
    setSelectedCategory(value);
    setPartSearchTerm('');
    setSearchResultsParts([]);
  };

  const handleCustomerSearch = async (term: string) => {
    setCustomerSearchTerm(term);
    if (term.length > 2) {
      try {
        const res = await fetch(`/api/customers?search=${term}`);
        const data = await res.json();
        setSearchResultsCustomers(data);
      } catch (error: unknown) {
        // FIX: Replaced 'any' with 'unknown' and added type guard
        console.error('Failed to search customers:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not fetch customer suggestions.';
        toast.error('Error searching customers', {
          description: errorMessage,
        });
      }
    } else {
      setSearchResultsCustomers([]);
    }
  };

  const handleSelectExistingCustomer = async (customerId: string) => {
    const selected = searchResultsCustomers.find((c) => c._id === customerId);
    if (selected) {
      setCustomer(selected);
      setSelectedCustomerId(selected._id || null);
      setCustomerSearchTerm(selected.name);
      setSearchResultsCustomers([]);

      try {
        const res = await fetch(`/api/bills?getPendingBills=true&customerId=${customerId}`);
        const data = await res.json();
        setPendingBills(data);
        setBillsToClear(data.map((bill: PendingBill) => bill._id));
      } catch (error: unknown) {
        // FIX: Replaced 'any' with 'unknown' and added type guard
        console.error('Failed to fetch pending bills:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not retrieve pending payment information.';
        toast.error('Error fetching pending bills', {
          description: errorMessage,
        });
      }
    }
  };

  const handleClearCustomer = () => {
    setCustomer({ name: '', phone: '', address: '' });
    setSelectedCustomerId(null);
    setCustomerSearchTerm('');
    setSearchResultsCustomers([]);
    setPendingBills([]);
    setBillsToClear([]);
    setPayments([]);
    setNewPayment({ amount: 0, source: '', date: new Date().toISOString() });
    setPaymentMode('partially_paid');
    setShowPaymentSummary(false);
    setFinalNewBillStatus({ billId: '', pendingAmount: 0, paymentStatus: '' });
    setPaidBillsHistory([]);
    setBillItems([]);
    setDiscountAmount(0);
    setNotes('');
  };

  const handleEditCustomerClick = () => {
    if (selectedCustomerId && customer) {
      setCustomerToEdit(customer);
      setIsEditCustomerModalOpen(true);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!customerToEdit || !customerToEdit._id) return;

    try {
      const res = await fetch(`/api/customers?id=${customerToEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerToEdit.name,
          phone: customerToEdit.phone,
          address: customerToEdit.address,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update customer.');
      }

      const updatedCustomer = await res.json();
      setCustomer(updatedCustomer);
      // FIX: Escaped the apostrophe in the toast description
      toast.success('Customer Updated', {
        description: `${updatedCustomer.name}'s details have been saved.`,
      });
      setIsEditCustomerModalOpen(false);
    } catch (error: unknown) {
      // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error('Error updating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer.';
      toast.error('Update Failed', {
        description: errorMessage,
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomerId) return;

    if (!window.confirm('Are you sure you want to permanently delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/customers?id=${selectedCustomerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete customer.');
      }

      toast.success('Customer Deleted', {
        description: `${customer.name} has been permanently removed.`,
      });
      handleClearCustomer();
    } catch (error: unknown) {
      // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error('Error deleting customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer.';
      toast.error('Deletion Failed', {
        description: errorMessage,
      });
    }
  };

  const handlePartSearch = async (term: string) => {
    setPartSearchTerm(term);
    if (term.length > 0) {
      try {
        let url = `/api/spare-parts?search=${term}`;
        if (selectedCategory !== 'all') {
          url += `&category=${selectedCategory}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setSearchResultsParts(data);
      } catch (error: unknown) {
        // FIX: Replaced 'any' with 'unknown' and added type guard
        console.error('Failed to search parts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not fetch part suggestions.';
        toast.error('Error searching parts', {
          description: errorMessage,
        });
      }
    } else {
      setSearchResultsParts([]);
    }
  };

  const handleSelectPartToAdd = (partId: string) => {
    const selected = searchResultsParts.find((p) => p._id === partId);
    if (selected) {
      setSelectedPartToAdd(selected);
      setPartSearchTerm(`${selected.category} (${selected.deviceModel.join(', ')})`);
      setSearchResultsParts([]);
      setOpenPartSearch(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedPartToAdd || selectedPartToAdd.quantity <= 0) {
      toast.error('Cannot add item', {
        description: 'Please select a part with available stock.',
      });
      return;
    }

    const newBillItem: BillItemFormData = {
      sparePart: selectedPartToAdd._id,
      name: selectedPartToAdd.category,
      deviceModel: selectedPartToAdd.deviceModel,
      brand: selectedPartToAdd.brand,
      boxNumber: selectedPartToAdd.boxNumber,
      quantity: 1,
      unitPrice: selectedPartToAdd.price,
      subtotal: selectedPartToAdd.price * 1,
    };

    const existingItemIndex = billItems.findIndex((item) => item.sparePart === newBillItem.sparePart);
    if (existingItemIndex > -1) {
      const updatedItems = [...billItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setBillItems(updatedItems);
    } else {
      setBillItems([...billItems, newBillItem]);
    }

    setSelectedPartToAdd(null);
    setPartSearchTerm('');
  };

  const handleItemQuantityChange = (index: number, newQuantity: number) => {
    const updatedItems = [...billItems];
    const finalQuantity = Math.max(1, newQuantity);
    updatedItems[index].quantity = finalQuantity;
    updatedItems[index].subtotal = finalQuantity * updatedItems[index].unitPrice;
    setBillItems(updatedItems);
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    const updatedItems = [...billItems];
    const finalPrice = Math.max(0, newPrice);
    updatedItems[index].unitPrice = finalPrice;
    updatedItems[index].subtotal = updatedItems[index].quantity * finalPrice;
    setBillItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = billItems.filter((_, i) => i !== index);
    setBillItems(updatedItems);
  };

  const handleToggleBillToClear = (billId: string) => {
    setBillsToClear((prev) => (prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]));
  };

  const handleAddPayment = () => {
    if (newPayment.amount > 0 && newPayment.source) {
      if (totalPaid + newPayment.amount > totalDue + 0.01) {
        toast.error('Payment Exceeds Total Due', {
          description: 'The total paid amount cannot exceed the total due amount.',
        });
        return;
      }
      setPayments([...payments, newPayment]);
      setNewPayment({ amount: 0, source: '', date: new Date().toISOString() });
    } else {
      toast.error('Payment Incomplete', {
        description: 'Please enter an amount and select a payment source.',
      });
    }
  };

  const handleUpdatePaymentSource = (index: number, source: Payment['source']) => {
    const updatedPayments = [...payments];
    updatedPayments[index].source = source;
    setPayments(updatedPayments);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    setPayments([]);
    setNewPayment({ amount: 0, source: '', date: new Date().toISOString() });

    if (mode === 'fully_paid') {
      setBillsToClear(pendingBills.map((b) => b._id));
    } else if (mode === 'fully_unpaid') {
      setBillsToClear([]);
    } else {
      setBillsToClear(pendingBills.map((b) => b._id));
    }
  };

  const handleSubmitBill = async () => {
    setIsSubmitting(true);
    setShowPaymentSummary(false);

    let finalCustomerId = selectedCustomerId;
    let createdNewCustomer = false;

    if (!selectedCustomerId && customer.name && customer.phone) {
      try {
        const customerRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        });
        const customerData = await customerRes.json();
        if (!customerRes.ok) {
          throw new Error(customerData.message || 'Failed to create new customer.');
        }
        finalCustomerId = customerData._id;
        createdNewCustomer = true;
      } catch (error: unknown) {
        // FIX: Replaced 'any' with 'unknown' and added type guard
        console.error('Error creating new customer:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create new customer.';
        toast.error('Customer Creation Failed', {
          description: errorMessage,
        });
        setIsSubmitting(false);
        return;
      }
    } else if (!selectedCustomerId) {
      toast.error('Customer Missing', {
        description: "Please select an existing customer or enter a new customer's name and phone.",
      });
      setIsSubmitting(false);
      return;
    }

    if (billItems.length === 0) {
      toast.error('No Items', {
        description: 'Please add at least one item to the bill.',
      });
      setIsSubmitting(false);
      return;
    }

    const hasUnsourcedPayment = payments.some((p) => p.amount > 0 && !p.source);
    if (hasUnsourcedPayment) {
      toast.error('Payment Information Incomplete', {
        description: 'A payment amount is entered but no payment source is selected. Please correct.',
      });
      setIsSubmitting(false);
      return;
    }

    if (paymentMode === 'fully_paid' && Math.abs(totalPaid - totalDue) > 0.01) {
      toast.error('Full Payment Required', {
        description: `The total payment must match the total due amount of ₹${totalDue.toFixed(2)}.`,
      });
      setIsSubmitting(false);
      return;
    }

    const allPendingBillIds = pendingBills.map((b) => b._id);
    const pendingBillsToClear = paymentMode === 'fully_paid' ? allPendingBillIds : billsToClear;
    const finalPayments = paymentMode === 'fully_unpaid' ? [] : payments;

    try {
      const billPayload = {
        customer: finalCustomerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: billItems.map((item) => ({
          sparePart: item.sparePart,
          name: item.name,
          deviceModel: item.deviceModel,
          brand: item.brand,
          boxNumber: item.boxNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        discountAmount,
        payments: finalPayments,
        notes,
        pendingBillsToClear,
      };

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create bill');
      }

      toast.success('Bill Created!', {
        description: `Bill ID: ${data.bill.billId} successfully generated.`,
      });

      setFinalNewBillStatus({
        billId: data.bill.billId,
        pendingAmount: data.bill.pendingAmount,
        paymentStatus: data.bill.paymentStatus,
      });
      setPaidBillsHistory(data.paidBillsHistory);
      setShowPaymentSummary(true);

      if (createdNewCustomer) {
        toast.success('Customer Added', {
          description: 'New customer created successfully.',
        });
      }

      setBillItems([]);
      setDiscountAmount(0);
      setNotes('');
      setPayments([]);
      setNewPayment({ amount: 0, source: '', date: new Date().toISOString() });
      setSelectedPartToAdd(null);
      setPartSearchTerm('');
      setPendingBills([]);
      setBillsToClear([]);
      setPaymentMode('partially_paid');
    } catch (error: unknown) {
      // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error('Error creating bill:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bill.';
      toast.error('Bill Creation Failed', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Customer state and handlers
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

    // Customer Modal state and handlers
    isEditCustomerModalOpen,
    setIsEditCustomerModalOpen,
    customerToEdit,
    setCustomerToEdit,
    handleUpdateCustomer,

    // Bill Items state and handlers
    billItems,
    setBillItems,
    partSearchTerm,
    setPartSearchTerm,
    searchResultsParts,
    selectedPartToAdd,
    setSelectedPartToAdd,
    openPartSearch,
    setOpenPartSearch,
    categories,
    selectedCategory,
    handleSelectCategory, // Use the new handler here
    handlePartSearch,
    handleSelectPartToAdd,
    handleAddItem,
    handleItemQuantityChange,
    handleItemPriceChange,
    handleRemoveItem,

    // Pending Bills state and handlers
    pendingBills,
    billsToClear,
    handleToggleBillToClear,
    totalPendingAmount,

    // Payment and Finalization state and handlers
    discountAmount,
    setDiscountAmount,
    notes,
    setNotes,
    totalNewBillAmount,
    totalDue,
    paymentMode,
    handlePaymentModeChange,
    payments,
    newPayment,
    setNewPayment,
    totalPaid,
    remainingToPay,
    isSubmitting,
    handleSubmitBill,
    handleAddPayment,
    handleUpdatePaymentSource,
    handleRemovePayment,

    // Final Summary state
    showPaymentSummary,
    finalNewBillStatus,
    paidBillsHistory,
  };
};

export default useNewBillForm;