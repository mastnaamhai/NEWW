import React, { useState, useMemo } from 'react';
import type { CompanyInfo, LorryReceipt, Invoice, Payment, Customer, Vehicle } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { exportToCsv } from '../services/exportService';
import { formatDate } from '../services/utils';
import { indianStates } from '../constants';

interface SettingsProps {
  companyInfo: CompanyInfo;
  onSave: (info: CompanyInfo) => void;
  lorryReceipts: LorryReceipt[];
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
  vehicles: Vehicle[];
  truckHiringNotes: TruckHiringNote[];
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<{success: boolean, message: string}>;
  onResetData: () => Promise<void>;
  onBackup: () => Promise<void>;
  onRestore: (data: any) => Promise<void>;
  onBack: () => void;
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

const CompanyInfoForm: React.FC<{ companyInfo: CompanyInfo, onSave: (info: CompanyInfo) => void }> = ({ companyInfo, onSave }) => {
    const [info, setInfo] = useState<CompanyInfo>(companyInfo);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(info);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Company & Bank Details</h3>
                {saved && <span className="text-green-600 bg-green-100 px-3 py-1 rounded-md text-sm font-medium">Saved!</span>}
            </div>
            <Card title="Company Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Company Name" name="name" value={info.name} onChange={handleChange} />
                    <Textarea label="Address" name="address" value={info.address} onChange={handleChange} rows={4} wrapperClassName="md:col-span-2" />
                     <Select label="State" name="state" value={info.state} onChange={handleChange} required>
                        <option value="" disabled>Select State</option>
                        {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Input label="Phone 1" name="phone1" value={info.phone1} onChange={handleChange} />
                    <Input label="Phone 2" name="phone2" value={info.phone2} onChange={handleChange} />
                    <Input label="Email" name="email" type="email" value={info.email} onChange={handleChange} />
                    <Input label="Website" name="website" value={info.website} onChange={handleChange} />
                    <Input label="GSTIN" name="gstin" value={info.gstin} onChange={handleChange} />
                    <Input label="PAN" name="pan" value={info.pan} onChange={handleChange} />
                </div>
            </Card>
            <Card title="Bank Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Bank Name" name="bankName" value={info.bankName} onChange={handleChange} />
                    <Input label="Account Number" name="accountNumber" value={info.accountNumber} onChange={handleChange} />
                    <Input label="IFSC Code" name="ifsc" value={info.ifsc} onChange={handleChange} />
                </div>
            </Card>
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit">Save Settings</Button>
            </div>
        </form>
    );
};

const NumberingForm: React.FC<{ companyInfo: CompanyInfo, onSave: (info: CompanyInfo) => void }> = ({ companyInfo, onSave }) => {
    const [info, setInfo] = useState<CompanyInfo>(companyInfo);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setInfo(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleToggleChange = (name: keyof CompanyInfo, checked: boolean) => {
        setInfo(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(info);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Numbering Settings</h3>
                {saved && <span className="text-green-600 bg-green-100 px-3 py-1 rounded-md text-sm font-medium">Saved!</span>}
            </div>
            <Card title="Lorry Receipt (LR) Numbers">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="LR Number Start" name="lrNumberStart" type="number" value={info.lrNumberStart || ''} onChange={handleChange} />
                    <Input label="LR Number End" name="lrNumberEnd" type="number" value={info.lrNumberEnd || ''} onChange={handleChange} />
                </div>
                <div className="mt-4">
                    <ToggleSwitch label="Allow Custom LR Numbers" checked={info.allowCustomLr || false} onChange={checked => handleToggleChange('allowCustomLr', checked)} />
                </div>
            </Card>
            <Card title="Invoice Numbers">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Invoice Number Start" name="invoiceNumberStart" type="number" value={info.invoiceNumberStart || ''} onChange={handleChange} />
                    <Input label="Invoice Number End" name="invoiceNumberEnd" type="number" value={info.invoiceNumberEnd || ''} onChange={handleChange} />
                </div>
            </Card>
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit">Save Settings</Button>
            </div>
        </form>
    );
};

const BackupExport: React.FC<Pick<SettingsProps, 'lorryReceipts' | 'invoices' | 'truckHiringNotes'>> = (props) => {

    const handleExportLrs = () => {
        const data = props.lorryReceipts.map(lr => ({
            'LR No': lr.lrNumber, 'Date': formatDate(lr.date), 'Consignor': lr.consignor?.name, 'Consignee': lr.consignee?.name,
             'Vehicle No': lr.vehicle?.number, 'From': lr.from, 'To': lr.to, 'Amount': lr.totalAmount, 'Status': lr.status
        }));
        exportToCsv('lorry-receipts-backup.csv', data);
    };

    const handleExportInvoices = () => {
        const data = props.invoices.map(inv => ({
            'Invoice No': inv.invoiceNumber, 'Date': formatDate(inv.date), 'Client': inv.customer?.name,
            'LRs Included': inv.lorryReceipts.map(lr => lr.lrNumber).join(', '), 'Grand Total': inv.grandTotal, 'Status': inv.status
        }));
        exportToCsv('invoices-backup.csv', data);
    };

    const handleExportThns = () => {
        const data = props.truckHiringNotes.map(thn => ({
            'THN No': thn.thnNumber, 'Date': formatDate(thn.date), 'Owner': thn.truckOwnerName, 'Truck No': thn.truckNumber,
            'From': thn.origin, 'To': thn.destination, 'Freight': thn.freight, 'Balance': thn.balancePayable, 'Status': thn.status
        }));
        exportToCsv('truck-hiring-notes-backup.csv', data);
    };
    
    return (
        <div className="space-y-6">
             <h3 className="text-xl font-bold text-gray-800">Backup & Export Data</h3>
             <p className="text-gray-600">Download your data in CSV format. CSV files can be opened with any spreadsheet software like Microsoft Excel or Google Sheets.</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <Card className="flex flex-col items-start">
                    <h4 className="font-semibold text-lg">Lorry Receipts</h4>
                    <p className="text-sm text-gray-500 mb-4 flex-grow">Export all Lorry Receipt data.</p>
                    <Button onClick={handleExportLrs} variant="secondary">Export LRs</Button>
                </Card>
                 <Card className="flex flex-col items-start">
                    <h4 className="font-semibold text-lg">Invoices</h4>
                    <p className="text-sm text-gray-500 mb-4 flex-grow">Export all Invoice data.</p>
                    <Button onClick={handleExportInvoices} variant="secondary">Export Invoices</Button>
                </Card>
                <Card className="flex flex-col items-start">
                    <h4 className="font-semibold text-lg">Truck Hiring Notes</h4>
                    <p className="text-sm text-gray-500 mb-4 flex-grow">Export all Truck Hiring Note data.</p>
                    <Button onClick={handleExportThns} variant="secondary">Export THNs</Button>
                </Card>
             </div>
        </div>
    );
};

const ChangePasswordForm: React.FC<{ onPasswordChange: SettingsProps['onPasswordChange'] }> = ({ onPasswordChange }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); setIsError(false);
        if (!newPassword || newPassword !== confirmPassword) {
            setMessage('New passwords do not match or are empty.'); setIsError(true); return;
        }
        const result = await onPasswordChange(currentPassword, newPassword);
        setMessage(result.message); setIsError(!result.success);
        if (result.success) {
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
            <Card>
                <div className="space-y-4">
                    <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                    <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required />
                    <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                </div>
            </Card>
            {message && (<p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{message}</p>)}
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit">Update Password</Button>
            </div>
        </form>
    );
};

const DataManagement: React.FC<{ onResetData: () => void, onBackup: () => void, onRestore: (data: any) => void }> = ({ onResetData, onBackup, onRestore }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleReset = async () => {
        if (window.confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
            setIsLoading(true);
            await onResetData();
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        await onBackup();
        setIsLoading(false);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmation = window.confirm(
            'This action will delete all existing data and replace it with the uploaded backup. This cannot be undone. Are you sure you want to proceed?'
        );

        if (confirmation) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result;
                    if (typeof content === 'string') {
                        const data = JSON.parse(content);
                        setIsLoading(true);
                        await onRestore(data);
                        setIsLoading(false);
                    }
                } catch (error) {
                    alert('Failed to read or parse the backup file. Please ensure it is a valid JSON file.');
                    setIsLoading(false);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Data Management</h3>
            <Card>
                <div className="space-y-4">
                     <div>
                        <h4 className="font-semibold text-lg">Backup & Restore</h4>
                        <p className="text-sm text-gray-500 mb-2">Download all your data into a single file or restore from a backup file.</p>
                        <div className="flex space-x-2">
                             <Button onClick={handleBackup} variant="secondary" disabled={isLoading}>
                                {isLoading ? 'Backing up...' : 'Backup Data'}
                            </Button>
                            <Button onClick={handleRestoreClick} variant="secondary" disabled={isLoading}>
                                {isLoading ? 'Restoring...' : 'Restore Data'}
                            </Button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="application/json"
                            />
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold text-lg text-red-700">Reset Application Data</h4>
                        <p className="text-sm text-gray-500 mb-2">Permanently delete all data from the application, including all clients, lorry receipts, invoices, and payments. This is irreversible.</p>
                        <Button onClick={handleReset} variant="destructive" disabled={isLoading}>
                            {isLoading ? 'Resetting...' : 'Reset All Data'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};


export const Settings: React.FC<SettingsProps> = (props) => {
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
      { key: 'info', label: 'Company Info' },
      { key: 'numbering', label: 'Numbering' },
      { key: 'export', label: 'Backup & Export' },
      { key: 'security', label: 'Security' },
      { key: 'data', label: 'Data Management' },
  ];

  return (
    <Card>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <Button variant="secondary" onClick={props.onBack}>Back</Button>
        </div>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
        <div className="pt-8">
            {activeTab === 'info' && <CompanyInfoForm companyInfo={props.companyInfo} onSave={props.onSave} />}
            {activeTab === 'numbering' && <NumberingForm companyInfo={props.companyInfo} onSave={props.onSave} />}
            {activeTab === 'export' && <BackupExport lorryReceipts={props.lorryReceipts} invoices={props.invoices} truckHiringNotes={props.truckHiringNotes} />}
            {activeTab === 'security' && <ChangePasswordForm onPasswordChange={props.onPasswordChange} />}
            {activeTab === 'data' && <DataManagement onResetData={props.onResetData} onBackup={props.onBackup} onRestore={props.onRestore} />}
        </div>
    </Card>
  );
};