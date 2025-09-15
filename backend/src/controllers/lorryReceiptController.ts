import { Request, Response } from 'express';
import LorryReceipt from '../models/lorryReceipt';
import { getLrNumber } from '../utils/sequence';

export const getLorryReceipts = async (req: Request, res: Response) => {
  try {
    const lorryReceipts = await LorryReceipt.find()
      .populate('consignor')
      .populate('consignee')
      .populate('vehicle')
      .sort({ lrNumber: -1 });
    res.json(lorryReceipts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getLorryReceiptById = async (req: Request, res: Response) => {
    try {
        const lorryReceipt = await LorryReceipt.findById(req.params.id)
            .populate('consignor')
            .populate('consignee')
        .populate('vehicle');
        if (lorryReceipt == null) {
            return res.status(404).json({ message: 'Cannot find lorry receipt' });
        }
        res.json(lorryReceipt);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

export const createLorryReceipt = async (req: Request, res: Response) => {
  const { consignorId, consigneeId, vehicleId, customLrNumber, companyInfo, ...rest } = req.body;

  try {
    const nextLrNumber = await getLrNumber(customLrNumber, companyInfo);
    const lorryReceipt = new LorryReceipt({
      ...rest,
      lrNumber: nextLrNumber,
      consignor: consignorId,
      consignee: consigneeId,
      vehicle: vehicleId,
    });

    const newLorryReceipt = await lorryReceipt.save();
    const populatedLr = await LorryReceipt.findById(newLorryReceipt._id)
        .populate('consignor')
        .populate('consignee')
        .populate('vehicle');
    res.status(201).json(populatedLr);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateLorryReceipt = async (req: Request, res: Response) => {
    try {
        const { consignorId, consigneeId, vehicleId, ...rest } = req.body;

        const updatedData = {
            ...rest,
            consignor: consignorId,
            consignee: consigneeId,
            vehicle: vehicleId,
        };
        const updatedLorryReceipt = await LorryReceipt.findByIdAndUpdate(req.params.id, updatedData, { new: true })
            .populate('consignor')
            .populate('consignee')
            .populate('vehicle');

        if (updatedLorryReceipt == null) {
            return res.status(404).json({ message: 'Cannot find lorry receipt' });
        }
        res.json(updatedLorryReceipt);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteLorryReceipt = async (req: Request, res: Response) => {
    try {
        // TODO: Check if this LR is part of an invoice before deleting
        const lorryReceipt = await LorryReceipt.findByIdAndDelete(req.params.id);
        if (lorryReceipt == null) {
            return res.status(404).json({ message: 'Cannot find lorry receipt' });
        }
        res.json({ message: 'Deleted Lorry Receipt' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
