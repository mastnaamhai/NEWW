import Counter from '../models/counter';
import LorryReceipt from '../models/lorryReceipt';
import Invoice from '../models/invoice';

export async function getNextSequenceValue(sequenceName: string, start = 1): Promise<number> {
    const sequenceDocument = await Counter.findOneAndUpdate(
        { _id: sequenceName },
        { $setOnInsert: { seq: start - 1 } },
        { new: true, upsert: true }
    );

    const updatedSequence = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { seq: 1 } },
        { new: true }
    );

    if (!updatedSequence) {
        // This should theoretically not happen if the first call succeeds
        throw new Error(`Counter for ${sequenceName} not found.`);
    }
    return updatedSequence.seq;
}

export async function getLrNumber(customLrNumber?: number, companyInfo?: CompanyInfo): Promise<number> {
    if (customLrNumber) {
        if (!companyInfo?.allowCustomLr) {
            throw new Error('Custom LR numbers are not allowed.');
        }

        const { lrNumberStart, lrNumberEnd } = companyInfo;
        if (lrNumberStart && lrNumberEnd && (customLrNumber < lrNumberStart || customLrNumber > lrNumberEnd)) {
            throw new Error(`Custom LR number must be between ${lrNumberStart} and ${lrNumberEnd}.`);
        }

        const existingLr = await LorryReceipt.findOne({ lrNumber: customLrNumber });
        if (existingLr) {
            throw new Error(`LR number ${customLrNumber} is already in use.`);
        }
        return customLrNumber;
    }

    return getNextSequenceValue('lorryReceiptId', companyInfo?.lrNumberStart);
}

export async function getInvoiceNumber(customInvoiceNumber?: number, companyInfo?: CompanyInfo): Promise<number> {
    if (customInvoiceNumber) {
        const { invoiceNumberStart, invoiceNumberEnd } = companyInfo;
        if (invoiceNumberStart && invoiceNumberEnd && (customInvoiceNumber < invoiceNumberStart || customInvoiceNumber > invoiceNumberEnd)) {
            throw new Error(`Custom Invoice number must be between ${invoiceNumberStart} and ${invoiceNumberEnd}.`);
        }

        const existingInvoice = await Invoice.findOne({ invoiceNumber: customInvoiceNumber });
        if (existingInvoice) {
            throw new Error(`Invoice number ${customInvoiceNumber} is already in use.`);
        }
        return customInvoiceNumber;
    }

    return getNextSequenceValue('invoiceId', companyInfo?.invoiceNumberStart);
}
