export enum LorryReceiptStatus {
  CREATED = 'Created',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  INVOICED = 'Invoiced',
  PAID = 'Paid',
}

export enum GstPayableBy {
  CONSIGNOR = 'Consignor',
  CONSIGNEE = 'Consignee',
  TRANSPORTER = 'Transporter',
}

export enum GstType {
    CGST_SGST = 'CGST/SGST',
    IGST = 'IGST',
}

export enum InvoiceStatus {
    UNPAID = 'Unpaid',
    PARTIALLY_PAID = 'Partially Paid',
    PAID = 'Paid',
}

export enum THNStatus {
    UNPAID = 'Unpaid',
    PARTIALLY_PAID = 'Partially Paid',
    PAID = 'Paid',
}

export enum PaymentType {
    ADVANCE = 'Advance',
    RECEIPT = 'Receipt',
    PAYMENT = 'Payment',
}

export enum PaymentMode {
    CASH = 'Cash',
    CHEQUE = 'Cheque',
    NEFT = 'NEFT',
    RTGS = 'RTGS',
    UPI = 'UPI',
}

export interface Customer {
  _id: string;
  name: string; // Legal Name of Business
  tradeName?: string;
  address: string;
  state:string;
  gstin?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface Vehicle {
  _id: string;
  number: string;
}

export interface LorryReceipt {
  _id: string;
  lrNumber: number;
  date: string;
  reportingDate?: string;
  deliveryDate?: string;
  consignorId: string;
  consignor?: Customer;
  consigneeId: string;
  consignee?: Customer;
  vehicleId: string;
  vehicle?: Vehicle;
  from: string;
  to: string;
  packages: {
    count: number;
    packingMethod: string;
    description: string;
    actualWeight: number;
    chargedWeight: number;
  }[];
  charges: {
    freight: number;
    aoc: number;
    hamali: number;
    bCh: number;
    trCh: number;
    detentionCh: number;
  };
  totalAmount: number;
  eWayBillNo: string;
  valueGoods: number;
  gstPayableBy: GstPayableBy;
  status: LorryReceiptStatus;
  insurance: {
      hasInsured: boolean;
      company?: string;
      policyNo?: string;
      date?: string;
      amount?: number;
      risk?: string;
  },
  invoiceNo: string;
  sealNo: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: number;
  date: string;
  customerId: string;
  customer?: Customer;
  lorryReceipts: LorryReceipt[];
  totalAmount: number;
  remarks: string;
  gstType: GstType;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  isRcm: boolean;
  isManualGst: boolean;
  status: InvoiceStatus;
}

export interface CompanyInfo {
    name: string;
    address: string;
    state: string;
    phone1: string;
    phone2: string;
    email: string;
    website: string;
    gstin: string;
    pan: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    // New fields for number ranges
    lrNumberStart?: number;
    lrNumberEnd?: number;
    invoiceNumberStart?: number;
    invoiceNumberEnd?: number;
    allowCustomLr?: boolean;
}

export interface Payment {
    _id:string;
    invoiceId?: string;
    invoice?: Invoice;
    truckHiringNoteId?: string;
    truckHiringNote?: TruckHiringNote;
    customerId: string;
    customer?: Customer;
    date: string;
    amount: number;
    type: PaymentType;
    mode: PaymentMode;
    referenceNo?: string;
    notes?: string;
}

export interface TruckHiringNote {
  _id: string;
  thnNumber: number;
  date: string;
  truckOwnerName: string;
  truckNumber: string;
  driverName: string;
  driverLicense: string;
  origin: string;
  destination: string;
  goodsType: string;
  weight: number;
  freight: number;
  advancePaid: number;
  balancePayable: number;
  expectedDeliveryDate: string;
  specialInstructions?: string;
  status: THNStatus;
  paidAmount: number;
  payments: Payment[];
}
