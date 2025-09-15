import React, { useState, useEffect, useCallback } from 'react';
import type { Invoice, LorryReceipt, Customer, CompanyInfo } from '../types';
import { GstType } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { Card } from './ui/Card';
import { numberToWords, formatDate, getCurrentDate } from '../services/utils';

interface InvoiceFormProps {
  onSave: (invoice: Partial<Invoice>) => void;
  onCancel: () => void;
  availableLrs: LorryReceipt[];
  customers: Customer[];
  companyInfo: CompanyInfo;
  existingInvoice?: Invoice;
  preselectedLr?: LorryReceipt;
  onSaveCustomer: (customer: Omit<Customer, 'id' | '_id'> & { _id?: string }) => Promise<Customer>;
  onSaveVehicle: (vehicle: Omit<Vehicle, 'id' | '_id'>) => Promise<Vehicle>;
  vehicles: Vehicle[];
  lorryReceipts: LorryReceipt[];
}

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ label, checked, onChange, disabled }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
    </label>
);

import { LorryReceiptForm } from './LorryReceiptForm';
import { API_BASE_URL } from '../constants';

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel, availableLrs, customers, companyInfo, existingInvoice, preselectedLr, onSaveCustomer, onSaveVehicle, vehicles, lorryReceipts }) => {

  const [isLrModalOpen, setIsLrModalOpen] = useState(false);

  const [invoice, setInvoice] = useState<Partial<Invoice>>(
    existingInvoice
    ? { ...existingInvoice }
    : {
        date: getCurrentDate(),
        customerId: '',
        lorryReceipts: [],
        totalAmount: 0,
        remarks: '',
        gstType: GstType.IGST,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        grandTotal: 0,
        isRcm: false,
        isManualGst: false,
      }
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedLrs, setSelectedLrs] = useState<Set<string>>(
    new Set(existingInvoice?.lorryReceipts.map(lr => lr._id) || [])
  );

  const handleLrCreated = (newLr: LorryReceipt) => {
    setIsLrModalOpen(false);
    setSelectedLrs(prev => new Set(prev).add(newLr._id));
  };
  
  // Auto-set GST type based on client and company state
  useEffect(() => {
    if (invoice.customerId && !invoice.isManualGst) {
        const client = customers.find(c => c._id === invoice.customerId);
        if (client) {
            const newGstType = client.state === companyInfo.state ? GstType.CGST_SGST : GstType.IGST;
            setInvoice(prev => ({...prev, gstType: newGstType}));
        }
    }
  }, [invoice.customerId, invoice.isManualGst, customers, companyInfo.state]);

  // Handle pre-selection of an LR when creating an invoice from it
  useEffect(() => {
    if (preselectedLr) {
      const billToId = preselectedLr.consignor._id;
      setInvoice(prev => ({ ...prev, customerId: billToId }));
      setSelectedLrs(new Set([preselectedLr._id]));
    }
  }, [preselectedLr]);

  const calculateTotals = useCallback(() => {
      const lrs = availableLrs.filter(lr => selectedLrs.has(lr._id));
      const subtotal = lrs.reduce((sum, lr) => sum + lr.totalAmount, 0);
      
      let cgst = 0, sgst = 0, igst = 0, grandTotal = subtotal;

      if (invoice.isRcm) {
        // All tax is 0 under RCM
      } else if (invoice.isManualGst) {
          cgst = invoice.cgstAmount || 0;
          sgst = invoice.sgstAmount || 0;
          igst = invoice.igstAmount || 0;
          grandTotal = subtotal + cgst + sgst + igst;
      } else {
        if (invoice.gstType === GstType.CGST_SGST) {
            cgst = subtotal * ((invoice.cgstRate || 0) / 100);
            sgst = subtotal * ((invoice.sgstRate || 0) / 100);
        } else if (invoice.gstType === GstType.IGST) {
            igst = subtotal * ((invoice.igstRate || 0) / 100);
        }
        grandTotal = subtotal + cgst + sgst + igst;
      }
      
      setInvoice(prev => ({
        ...prev,
        lorryReceipts: lrs,
        totalAmount: subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        grandTotal: grandTotal,
      }));
  }, [selectedLrs, availableLrs, invoice.isRcm, invoice.isManualGst, invoice.gstType, invoice.cgstRate, invoice.sgstRate, invoice.igstRate, invoice.cgstAmount, invoice.sgstAmount, invoice.igstAmount]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleLrSelectionChange = (lrId: string) => {
    setSelectedLrs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lrId)) newSet.delete(lrId);
      else newSet.add(lrId);
      return newSet;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'customerId') {
      setSelectedLrs(new Set());
    }
    
    const numericFields = ['cgstRate', 'sgstRate', 'igstRate', 'cgstAmount', 'sgstAmount', 'igstAmount'];
    setInvoice(prev => ({
        ...prev,
        [name]: (type === 'number' || numericFields.includes(name)) ? parseFloat(value) || 0 : value
    }));
  };
  
  const handleToggle = (field: 'isRcm' | 'isManualGst', value: boolean) => {
    setInvoice(prev => ({...prev, [field]: value}));
    if (field === 'isRcm' && value) {
        setInvoice(prev => ({...prev, isManualGst: false}));
    }
  };


  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!invoice.customerId) newErrors.customerId = 'Client is required.';
    if (!invoice.date) newErrors.date = 'Invoice date is required.';
    if (selectedLrs.size === 0) newErrors.lrs = 'At least one Lorry Receipt must be selected.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Create a copy of the invoice object for saving
      // This ensures we don't mutate the state directly
      // And we can format the lorryReceipts to just be their IDs if needed by the backend
      const invoiceToSave = {
        ...invoice,
        lorryReceipts: (invoice.lorryReceipts || []).map(lr => ({ _id: lr._id })),
      };
      onSave(invoiceToSave as Partial<Invoice>);
    }
  };
  
  const customerLrs = availableLrs.filter(lr => lr.consignor?._id === invoice.customerId || lr.consignee?._id === invoice.customerId);
  const customer = customers.find(c => c._id === invoice.customerId);
  const manualTaxFromRate = invoice.gstType === GstType.IGST 
    ? ((invoice.totalAmount || 0) * (invoice.igstRate || 0) / 100)
    : ((invoice.totalAmount || 0) * ((invoice.cgstRate || 0) + (invoice.sgstRate || 0)) / 100);
  const manualTaxEntered = (invoice.igstAmount || 0) + (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0);
  const manualTaxMismatch = invoice.isManualGst && !invoice.isRcm && Math.abs(manualTaxFromRate - manualTaxEntered) > 0.01;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">{existingInvoice ? `Edit Invoice #${existingInvoice.invoiceNumber}` : 'Create Invoice'}</h2>

      <Card title="Invoice Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select label="Client" name="customerId" value={invoice.customerId || ''} onChange={handleChange} required error={errors.customerId}>
            <option value="" disabled>Select Client</option>
            {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Invoice Date" type="date" name="date" value={invoice.date || ''} onChange={handleChange} required error={errors.date} />
        </div>
        {customer && <p className="text-sm text-gray-500 mt-2">Client State: <span className="font-medium text-gray-700">{customer.state}</span></p>}
      </Card>

      <Card title={
        <div className="flex justify-between items-center">
          <span>Select Lorry Receipts for Invoice</span>
          <Button type="button" variant="secondary" onClick={() => setIsLrModalOpen(true)}>Create New LR</Button>
        </div>
      }>
        {isLrModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <LorryReceiptForm
                onSave={async (lr) => {
                  // This is a simplified save for the modal context.
                  // It doesn't navigate away, just creates the LR and calls back.
                  const response = await fetch(`${API_BASE_URL}/lorryreceipts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...lr, companyInfo }),
                  });
                  const newLr = await response.json();
                  if (response.ok) {
                    handleLrCreated(newLr);
                  } else {
                    alert(`Error creating LR: ${newLr.message}`);
                  }
                }}
                onCancel={() => setIsLrModalOpen(false)}
                customers={customers}
                vehicles={vehicles}
                onSaveCustomer={onSaveCustomer}
                lorryReceipts={lorryReceipts}
                onSaveVehicle={onSaveVehicle}
                companyInfo={companyInfo}
              />
            </div>
          </div>
        )}
        <div className="max-h-64 overflow-y-auto border rounded-md">
          {invoice.customerId === '' ? (
            <p className="text-gray-500 text-center p-4">Please select a client to see available Lorry Receipts.</p>
          ) : customerLrs.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left w-12"><input type="checkbox" onChange={(e) => {
                      const allIds = new Set(customerLrs.map(lr => lr._id));
                      setSelectedLrs(e.target.checked ? allIds : new Set());
                  }}/></th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">LR No.</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
              {customerLrs.map(lr => (
                <tr key={lr._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3"><input type="checkbox" checked={selectedLrs.has(lr._id)} onChange={() => handleLrSelectionChange(lr._id)} /></td>
                  <td className="p-3 text-sm">{lr.lrNumber}</td>
                  <td className="p-3 text-sm">{formatDate(lr.date)}</td>
                  <td className="p-3 text-sm">{lr.to}</td>
                  <td className="p-3 text-right text-sm">₹{lr.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center p-4">No available Lorry Receipts for the selected client.</p>
          )}
        </div>
        {errors.lrs && <p className="mt-1 text-xs text-red-600">{errors.lrs}</p>}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card title="GST Details">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-3 sm:space-y-0">
                   <ToggleSwitch label="Enable Reverse Charge (RCM)" checked={invoice.isRcm || false} onChange={v => handleToggle('isRcm', v)} />
                   <ToggleSwitch label="Manual GST Entry" checked={invoice.isManualGst || false} onChange={v => handleToggle('isManualGst', v)} disabled={invoice.isRcm} />
                </div>

                {invoice.isRcm ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                        GST is set to ₹0. The invoice will state that GST is payable under Reverse Charge.
                    </div>
                ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                        <div className="p-2 bg-slate-100 rounded-md font-semibold text-center text-indigo-700">
                           {invoice.gstType} {invoice.isManualGst ? '' : '(Auto-selected)'}
                        </div>
                    </div>
                    {invoice.gstType === GstType.CGST_SGST ? (
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="CGST Rate (%)" type="number" name="cgstRate" value={invoice.cgstRate || 0} onChange={handleChange} onFocus={e => e.target.select()} disabled={!invoice.isManualGst} />
                            <Input label="SGST Rate (%)" type="number" name="sgstRate" value={invoice.sgstRate || 0} onChange={handleChange} onFocus={e => e.target.select()} disabled={!invoice.isManualGst} />
                            <Input label="CGST Amount" type="number" name="cgstAmount" value={invoice.cgstAmount || 0} onChange={handleChange} onFocus={e => e.target.select()} disabled={!invoice.isManualGst} />
                            <Input label="SGST Amount" type="number" name="sgstAmount" value={invoice.sgstAmount || 0} onChange={handleChange} onFocus={e => e.target.select()} disabled={!invoice.isManualGst} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="IGST Rate (%)" type="number" name="igstRate" value={invoice.igstRate || 0} onChange={handleChange} onFocus={e => e.target.select()} disabled={!invoice.isManualGst} />
                            <Input label="IGST Amount" type="number" name="igstAmount" value={invoice.igstAmount || 0} onChange={handleChange} onFocus={e => e.target.select()} disabled={!invoice.isManualGst} />
                        </div>
                    )}
                    {manualTaxMismatch && (
                        <p className="text-xs text-orange-600 mt-2">Warning: The manually entered tax amount does not match the amount calculated from the specified rate.</p>
                    )}
                </>
                )}
            </div>
        </Card>
        
        <div className="p-6 space-y-2">
            <div className="flex justify-between text-lg">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
             {invoice.gstType === GstType.CGST_SGST && !invoice.isRcm && (
                <>
                    <div className="flex justify-between text-md text-gray-600">
                        <span>CGST ({(invoice.cgstRate || 0)}%):</span>
                        <span>+ ₹{(invoice.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                     <div className="flex justify-between text-md text-gray-600">
                        <span>SGST ({(invoice.sgstRate || 0)}%):</span>
                        <span>+ ₹{(invoice.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </>
             )}
             {invoice.gstType === GstType.IGST && !invoice.isRcm && (
                 <div className="flex justify-between text-md text-gray-600">
                    <span>IGST ({(invoice.igstRate || 0)}%):</span>
                    <span>+ ₹{(invoice.igstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
             )}
            <div className="border-t pt-2 mt-2 flex justify-between text-2xl font-bold">
                <span>Grand Total:</span>
                <span>₹{(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-gray-500 text-sm text-right mt-1">In words: {numberToWords(Math.round(invoice.grandTotal || 0))} Only /-</div>
        </div>
      </div>

      <Card title="Additional Information">
        <Textarea label="Remarks" name="remarks" value={invoice.remarks || ''} onChange={handleChange} rows={3}/>
      </Card>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Invoice</Button>
      </div>
    </form>
  );
};