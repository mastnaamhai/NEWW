import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LorryReceiptForm } from './components/LorryReceiptForm';
import { InvoiceForm } from './components/InvoiceForm';
import { LorryReceiptPDF } from './components/LorryReceiptPDF';
import { InvoicePDF } from './components/InvoicePDF';
import { Invoices } from './components/Invoices';
import { LorryReceipts } from './components/LorryReceipts';
import { Settings } from './components/Settings';
import { Ledger } from './components/Ledger';
import { PendingPayments } from './components/PendingPayments';
import { Clients } from './components/Clients';
import { TruckHiringNotes } from './components/TruckHiringNotes';
import { THNPdf } from './components/THNPdf';
import { LedgerPDF } from './components/LedgerPDF';
import { Login } from './components/Login';
import { Setup } from './components/Setup';
import { hashPassword } from './services/authService';
import type { LorryReceipt, Invoice, Customer, Vehicle, CompanyInfo, Payment } from './types';
import { LorryReceiptStatus } from './types';
import { initialCompanyInfo } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer as deleteCustomerService } from './services/customerService';
import { getVehicles, createVehicle } from './services/vehicleService';
import { getLorryReceipts, createLorryReceipt, updateLorryReceipt, deleteLorryReceipt } from './services/lorryReceiptService';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice as deleteInvoiceService } from './services/invoiceService';
import { getPayments, createPayment } from './services/paymentService';
import { getTruckHiringNotes, createTruckHiringNote, updateTruckHiringNote } from './services/truckHiringNoteService';
import { resetApplicationData, backupData, restoreData } from './services/dataService';

export type View =
  | { name: 'DASHBOARD' }
  | { name: 'LORRY_RECEIPTS', filters?: any }
  | { name: 'INVOICES', filters?: any }
  | { name: 'CREATE_LR' }
  | { name: 'EDIT_LR', id: string }
  | { name: 'VIEW_LR', id: string }
  | { name: 'CREATE_INVOICE' }
  | { name: 'CREATE_INVOICE_FROM_LR', lrId: string }
  | { name: 'EDIT_INVOICE', id: string }
  | { name: 'VIEW_INVOICE', id: string }
  | { name: 'SETTINGS' }
  | { name: 'CLIENTS' }
  | { name: 'LEDGER' }
  | { name: 'PENDING_PAYMENTS' }
  | { name: 'TRUCK_HIRING_NOTES', filters?: any }
  | { name: 'VIEW_THN', id: string }
  | { name: 'VIEW_CLIENT_LEDGER_PDF', customerId: string }
  | { name: 'VIEW_COMPANY_LEDGER_PDF' };

const App: React.FC = () => {
  const [viewHistory, setViewHistory] = useState<View[]>([{ name: 'DASHBOARD' }]);
  const currentView = viewHistory[viewHistory.length - 1];

  const navigateTo = (newView: View) => {
    setViewHistory(prev => [...prev, newView]);
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      setViewHistory(prev => prev.slice(0, -1));
    }
  };

  const navigateHome = () => {
    setViewHistory([{ name: 'DASHBOARD' }]);
  };
  
  const [lorryReceipts, setLorryReceipts] = useState<LorryReceipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [truckHiringNotes, setTruckHiringNotes] = useState<TruckHiringNote[]>([]);
  const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>('companyInfo', initialCompanyInfo);

  // Auth state
  const [passwordHash, setPasswordHash] = useLocalStorage<string | null>('app_password_hash', null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  const fetchAllData = useCallback(async () => {
    try {
      const [
        fetchedCustomers,
        fetchedVehicles,
        fetchedLorryReceipts,
        fetchedInvoices,
        fetchedPayments,
        fetchedTruckHiringNotes,
      ] = await Promise.all([
        getCustomers(),
        getVehicles(),
        getLorryReceipts(),
        getInvoices(),
        getPayments(),
        getTruckHiringNotes(),
      ]);
      setCustomers(fetchedCustomers);
      setVehicles(fetchedVehicles);
      setLorryReceipts(fetchedLorryReceipts);
      setInvoices(fetchedInvoices);
      setPayments(fetchedPayments);
      setTruckHiringNotes(fetchedTruckHiringNotes);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      alert('Failed to load data from the server. Please check your connection and refresh the page.');
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSetPassword = async (password: string) => {
      const hash = await hashPassword(password);
      setPasswordHash(hash);
      setIsAuthenticated(true);
  };

  const handleLogin = async (password: string) => {
      if (!passwordHash) return;
      const inputHash = await hashPassword(password);
      if (inputHash === passwordHash) {
          setIsAuthenticated(true);
          setLoginError('');
      } else {
          setLoginError('Incorrect password. Please try again.');
          setIsAuthenticated(false);
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      navigateHome();
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<{success: boolean, message: string}> => {
      if (!passwordHash) return { success: false, message: "No password set." };
      
      const currentHash = await hashPassword(currentPassword);
      if (currentHash !== passwordHash) {
          return { success: false, message: "Current password is not correct." };
      }
      
      const newHash = await hashPassword(newPassword);
      setPasswordHash(newHash);
      return { success: true, message: "Password updated successfully." };
  };

  const saveLorryReceipt = async (lr: Partial<LorryReceipt>) => {
    try {
      if (lr._id) {
        await updateLorryReceipt(lr._id, lr);
      } else {
        await createLorryReceipt(lr as Omit<LorryReceipt, '_id' | 'id'>, companyInfo);
      }
      await fetchAllData(); // Refetch all data for consistency
      navigateHome();
    } catch (error) {
      console.error('Failed to save lorry receipt:', error);
    }
  };
  
  const saveCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
    try {
      let savedCustomer;
      if (customerData._id) {
        savedCustomer = await updateCustomer(customerData._id, customerData);
      } else {
        savedCustomer = await createCustomer(customerData as Omit<Customer, 'id'>);
      }
      await fetchAllData(); // Refetch all data
      return savedCustomer;
    } catch (error) {
      console.error('Failed to save customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await deleteCustomerService(id);
        await fetchAllData();
      } catch (error: any) {
        console.error('Failed to delete customer:', error);
        alert(`Failed to delete client: ${error.message}`);
      }
    }
  };

  const saveVehicle = async (vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    try {
      const newVehicle = await createVehicle(vehicleData as Omit<Vehicle, 'id'>);
      await fetchAllData();
      return newVehicle;
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      throw error;
    }
  };

  const saveInvoice = async (invoice: Partial<Invoice>) => {
    try {
      let savedInvoice;
      if (invoice._id) {
        savedInvoice = await updateInvoice(invoice._id, invoice);
      } else {
        savedInvoice = await createInvoice(invoice as Omit<Invoice, '_id' | 'id'>);
      }

      const invoicedLrIds = new Set<string>(savedInvoice.lorryReceipts.map(lr => lr._id));
      for (const lrId of invoicedLrIds) {
        await updateLorryReceipt(lrId, { status: LorryReceiptStatus.INVOICED });
      }

      await fetchAllData();
      navigateHome();
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }
  };

  const saveTruckHiringNote = async (note: Partial<Omit<TruckHiringNote, '_id' | 'thnNumber' | 'balancePayable'>>) => {
    try {
      if (note._id) {
        await updateTruckHiringNote(note._id, note);
      } else {
        await createTruckHiringNote(note as any);
      }
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save Truck Hiring Note:', error);
    }
  };

  const savePayment = async (payment: Omit<Payment, '_id' | 'customer' | 'invoice' | 'truckHiringNote'>) => {
    try {
      await createPayment(payment);
      await fetchAllData(); // Refetch all data to update invoices, THNs, and payments
    } catch (error) {
      console.error('Failed to save payment:', error);
    }
  };
  
  const updateLrStatus = async (id: string, status: LorryReceiptStatus) => {
    try {
        await updateLorryReceipt(id, { status });
        await fetchAllData();
    } catch (error) {
        console.error('Failed to update LR status:', error);
    }
  };
  
  const deleteLr = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Lorry Receipt?')) {
      try {
        await deleteLorryReceipt(id);
        await fetchAllData();
      } catch (error: any) {
        console.error('Failed to delete lorry receipt:', error);
        alert(`Failed to delete lorry receipt: ${error.message}`);
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Invoice?')) {
      try {
        await deleteInvoiceService(id);
        await fetchAllData();
      } catch (error: any) {
        console.error('Failed to delete invoice:', error);
        alert(`Failed to delete invoice: ${error.message}`);
      }
    }
  };

  const handleResetData = async () => {
    try {
      await resetApplicationData();
      await fetchAllData();
      alert('Application data has been successfully reset.');
    } catch (error: any) {
      console.error('Failed to reset data:', error);
      alert(`An error occurred while resetting data: ${error.message}`);
    }
  };

  const handleBackup = async () => {
    try {
      const data = await backupData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to backup data:', error);
      alert(`An error occurred during backup: ${error.message}`);
    }
  };

  const handleRestore = async (data: any) => {
    try {
      await restoreData(data);
      await fetchAllData();
      alert('Data has been successfully restored.');
    } catch (error: any) {
      console.error('Failed to restore data:', error);
      alert(`An error occurred during restore: ${error.message}`);
    }
  };

  const renderContent = () => {
    switch (currentView.name) {
      case 'CREATE_LR':
        return <LorryReceiptForm onSave={saveLorryReceipt} onCancel={goBack} customers={customers} vehicles={vehicles} onSaveCustomer={saveCustomer} lorryReceipts={lorryReceipts} onSaveVehicle={saveVehicle} companyInfo={companyInfo} />;
      case 'EDIT_LR':
        const lrToEdit = lorryReceipts.find(lr => lr._id === currentView.id);
        return lrToEdit ? <LorryReceiptForm onSave={saveLorryReceipt} onCancel={goBack} customers={customers} vehicles={vehicles} existingLr={lrToEdit} onSaveCustomer={saveCustomer} lorryReceipts={lorryReceipts} onSaveVehicle={saveVehicle} companyInfo={companyInfo} /> : <div>LR not found</div>;
      case 'VIEW_LR':
        const lrToView = lorryReceipts.find(lr => lr._id === currentView.id);
        return lrToView ? <LorryReceiptPDF lorryReceipt={lrToView} companyInfo={companyInfo} onBack={goBack} /> : <div>LR not found</div>;
      
      case 'CREATE_INVOICE':
        const availableLrs = lorryReceipts.filter(lr => [LorryReceiptStatus.CREATED, LorryReceiptStatus.IN_TRANSIT, LorryReceiptStatus.DELIVERED].includes(lr.status));
        return <InvoiceForm onSave={saveInvoice} onCancel={goBack} availableLrs={availableLrs} customers={customers} companyInfo={companyInfo} onSaveCustomer={saveCustomer} onSaveVehicle={saveVehicle} vehicles={vehicles} lorryReceipts={lorryReceipts} />;
      case 'CREATE_INVOICE_FROM_LR':
        const lrToInvoice = lorryReceipts.find(lr => lr._id === currentView.lrId);
        if (!lrToInvoice) return <div>LR not found</div>;
        const availableLrsForNewInvoice = lorryReceipts.filter(lr => [LorryReceiptStatus.CREATED, LorryReceiptStatus.IN_TRANSIT, LorryReceiptStatus.DELIVERED].includes(lr.status) || lr._id === currentView.lrId);
         return <InvoiceForm onSave={saveInvoice} onCancel={goBack} availableLrs={availableLrsForNewInvoice} customers={customers} preselectedLr={lrToInvoice} companyInfo={companyInfo} onSaveCustomer={saveCustomer} onSaveVehicle={saveVehicle} vehicles={vehicles} lorryReceipts={lorryReceipts} />;
      case 'EDIT_INVOICE':
         const invoiceToEdit = invoices.find(inv => inv._id === currentView.id);
         const lrsForEdit = lorryReceipts.filter(lr => (lr.status !== LorryReceiptStatus.INVOICED && lr.status !== LorryReceiptStatus.PAID) || invoiceToEdit?.lorryReceipts.some(ilr => ilr._id === lr._id));
         return invoiceToEdit ? <InvoiceForm onSave={saveInvoice} onCancel={goBack} availableLrs={lrsForEdit} customers={customers} existingInvoice={invoiceToEdit} companyInfo={companyInfo} onSaveCustomer={saveCustomer} onSaveVehicle={saveVehicle} vehicles={vehicles} lorryReceipts={lorryReceipts} /> : <div>Invoice not found</div>;
      case 'VIEW_INVOICE':
        const invoiceToView = invoices.find(inv => inv._id === currentView.id);
        return invoiceToView ? <InvoicePDF invoice={invoiceToView} companyInfo={companyInfo} customers={customers} onBack={goBack} /> : <div>Invoice not found</div>;
      
      case 'SETTINGS':
        return <Settings 
                  companyInfo={companyInfo} 
                  onSave={setCompanyInfo} 
                  lorryReceipts={lorryReceipts}
                  invoices={invoices}
                  payments={payments}
                  customers={customers}
                  vehicles={vehicles}
                  truckHiringNotes={truckHiringNotes}
                  onPasswordChange={handleChangePassword}
                  onResetData={handleResetData}
                  onBackup={handleBackup}
                  onRestore={handleRestore}
                  onBack={goBack}
                />;

      case 'LEDGER':
        return <Ledger customers={customers} invoices={invoices} payments={payments} truckHiringNotes={truckHiringNotes} onViewChange={navigateTo} onBack={goBack} />;

      case 'VIEW_CLIENT_LEDGER_PDF':
        const customerId = currentView.customerId;
        const customer = customers.find(c => c._id === customerId);
        const customerInvoices = invoices.filter(inv => inv.customer?._id === customerId);
        const customerPayments = payments.filter(p => p.invoiceId?.customer?._id === customerId);

        const invoiceTx = customerInvoices.map(inv => ({
            type: 'invoice', date: inv.date, particulars: `Invoice No: ${inv.invoiceNumber}`, debit: inv.grandTotal, credit: 0
        }));
        const paymentTx = customerPayments.map(p => ({
            type: 'payment', date: p.date, particulars: `Payment for INV-${p.invoiceId?.invoiceNumber}`, debit: 0, credit: p.amount
        }));

        let runningBalance = 0;
        const transactions = [...invoiceTx, ...paymentTx]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(tx => {
                runningBalance += (tx.debit - tx.credit);
                return { ...tx, balance: `${Math.abs(runningBalance).toFixed(2)} ${runningBalance >= 0 ? 'Dr' : 'Cr'}` };
            });

        return customer ? <LedgerPDF
                    title={`Client-Ledger-${customer.name}`}
                    transactions={transactions}
                    companyInfo={companyInfo}
                    columns={[
                        { key: 'date', label: 'Date' },
                        { key: 'particulars', label: 'Particulars' },
                        { key: 'debit', label: 'Debit (₹)', align: 'right' },
                        { key: 'credit', label: 'Credit (₹)', align: 'right' },
                        { key: 'balance', label: 'Balance (₹)', align: 'right' },
                    ]}
                    summary={[
                        { label: 'Client', value: customer.name },
                        { label: 'Closing Balance', value: transactions.length > 0 ? transactions[transactions.length - 1].balance : '0.00 Dr', color: 'font-bold' }
                    ]}
                    onBack={goBack}
                /> : <div>Customer not found</div>;

      case 'VIEW_COMPANY_LEDGER_PDF':
        const invoiceTxComp = invoices.map(inv => ({ type: 'income', date: inv.date, particulars: `Invoice No: ${inv.invoiceNumber} to ${inv.customer?.name}`, amount: inv.grandTotal }));
        const thnTxComp = truckHiringNotes.map(thn => ({ type: 'expense', date: thn.date, particulars: `THN No: ${thn.thnNumber} to ${thn.truckOwnerName}`, amount: thn.freight }));
        const companyTransactions = [...invoiceTxComp, ...thnTxComp].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return <LedgerPDF
                    title="Company-Ledger"
                    transactions={companyTransactions}
                    companyInfo={companyInfo}
                    columns={[
                        { key: 'date', label: 'Date' },
                        { key: 'type', label: 'Type' },
                        { key: 'particulars', label: 'Particulars' },
                        { key: 'amount', label: 'Amount (₹)', align: 'right' },
                    ]}
                    onBack={goBack}
                />;

      case 'PENDING_PAYMENTS':
        return <PendingPayments invoices={invoices} onSavePayment={savePayment} onBack={goBack} />;
      
      case 'CLIENTS':
        return <Clients customers={customers} onSave={saveCustomer} onDelete={deleteCustomer} onBack={goBack} />;

      case 'TRUCK_HIRING_NOTES':
        return <TruckHiringNotes notes={truckHiringNotes} onSave={saveTruckHiringNote} onSavePayment={savePayment} onViewChange={navigateTo} onBack={goBack} initialFilters={currentView.filters} />;

      case 'VIEW_THN':
        const thnToView = truckHiringNotes.find(thn => thn._id === currentView.id);
        return thnToView ? <THNPdf truckHiringNote={thnToView} companyInfo={companyInfo} onBack={goBack} /> : <div>THN not found</div>;

      case 'LORRY_RECEIPTS':
        return <LorryReceipts
                  lorryReceipts={lorryReceipts}
                  customers={customers}
                  vehicles={vehicles}
                  companyInfo={companyInfo}
                  onViewChange={navigateTo}
                  onUpdateLrStatus={updateLrStatus}
                  onDeleteLr={deleteLr}
                  onBack={goBack}
                  initialFilters={currentView.filters}
                />;

      case 'INVOICES':
        return <Invoices
                  invoices={invoices}
                  payments={payments}
                  customers={customers}
                  companyInfo={companyInfo}
                  onViewChange={navigateTo}
                  onDeleteInvoice={deleteInvoice}
                  onSavePayment={savePayment}
                  onBack={goBack}
                  initialFilters={currentView.filters}
                />;

      case 'DASHBOARD':
      default:
        return <Dashboard 
                 lorryReceipts={lorryReceipts} 
                 invoices={invoices}
                 payments={payments}
                 customers={customers}
                 vehicles={vehicles}
                 truckHiringNotes={truckHiringNotes}
                 companyInfo={companyInfo}
                 onViewChange={navigateTo}
                 onUpdateLrStatus={updateLrStatus}
                 onDeleteLr={deleteLr}
                 onDeleteInvoice={deleteInvoice}
                 onSavePayment={savePayment}
               />;
    }
  };

  if (!passwordHash) {
    return <Setup onSetPassword={handleSetPassword} />;
  }

  if (!isAuthenticated) {
      return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Header view={currentView} onViewChange={navigateTo} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
