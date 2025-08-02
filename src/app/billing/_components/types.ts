// The main customer data interface
export interface CustomerFormData {
  _id?: string;
  name: string;
  phone: string;
  // Address is optional, matching the form logic
  address?: string;
}

// All possible payment sources
export type PaymentSource = 'Cash' | 'UPI' | 'Card' | 'From New Bill' | 'Pending Bill Payment' | '';

// Interface for a single payment object
export interface Payment {
  amount: number;
  source: PaymentSource;
  date: string;
  // Added optional sourceBillIds to the Payment interface
  sourceBillIds?: string[];
}

// Interfaces for bill items
export interface SparePart {
  _id: string;
  category: string;
  deviceModel: string[];
  brand: string[];
  boxNumber?: string;
  quantity: number;
  price: number;
}

export interface PendingBillItem {
  _id: string;
  // SparePart can now be null, matching the component logic
  sparePart: SparePart | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Interface for a pending bill to clear
export interface PendingBill {
  _id: string;
  billId: string;
  createdAt: string;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  items: PendingBillItem[];
  payments: Payment[];
}

// Interface for a complete, saved bill fetched from the database
export interface Bill {
  _id: string;
  billId: string;
  customer: CustomerFormData;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  items: BillItem[];
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Unpaid';
  payments: Payment[];
  notes?: string;
}

// Interface for bill items in the form
export interface BillItemFormData {
  sparePart: string;
  name: string;
  deviceModel: string[];
  brand: string[];
  boxNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Interface for the history of cleared bills, returned by the API
export interface PaidBillHistoryItem {
  billId: string;
  amountCleared: number;
  newPendingAmount: number;
}

// Interface for a complete bill item, used for display
export interface BillItem {
  name: string;
  deviceModel: string[];
  brand: string[];
  boxNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Interface for the final bill summary status
export interface FinalNewBillStatus {
  billId: string;
  pendingAmount: number;
  paymentStatus: string;
}

// Interface for payment mode
export type PaymentMode = 'fully_paid' | 'fully_unpaid' | 'partially_paid';