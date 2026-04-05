import { isValidObjectId } from '../db/memoryEngine.js';
import Pricing from '../models/Pricing.js';

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export async function listPricing(req, res) {
  try {
    const { publicOnly } = req.query;
    const filter = {};
    if (publicOnly === 'true' || publicOnly === '1') {
      filter.isPublic = true;
    }
    const items = await Pricing.find(filter).sort({ category: 1, packageName: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
  }
}

export async function createPricing(req, res) {
  try {
    const { packageName, price, unit, isPublic, description, maxPrice, category } = req.body;
    if (!packageName || typeof packageName !== 'string') {
      return res.status(400).json({ message: 'packageName là bắt buộc' });
    }
    const priceNum = parseNumber(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'price phải là số không âm' });
    }
    const doc = await Pricing.create({
      packageName: packageName.trim(),
      price: priceNum,
      unit: typeof unit === 'string' && unit.trim() ? unit.trim() : 'buổi',
      isPublic: Boolean(isPublic),
      description: typeof description === 'string' ? description : '',
      maxPrice: (() => {
        const m = parseNumber(maxPrice);
        return Number.isFinite(m) && m >= 0 ? m : null;
      })(),
      category: category === 'premium' ? 'premium' : 'basic',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
  }
}

export async function updatePricing(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }
    const patch = {};
    const { packageName, price, unit, isPublic, description, maxPrice, category } = req.body;
    if (packageName !== undefined) {
      if (typeof packageName !== 'string' || !packageName.trim()) {
        return res.status(400).json({ message: 'packageName không hợp lệ' });
      }
      patch.packageName = packageName.trim();
    }
    if (price !== undefined) {
      const priceNum = parseNumber(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: 'price phải là số không âm' });
      }
      patch.price = priceNum;
    }
    if (unit !== undefined) {
      if (typeof unit !== 'string' || !unit.trim()) {
        return res.status(400).json({ message: 'unit không hợp lệ' });
      }
      patch.unit = unit.trim();
    }
    if (isPublic !== undefined) patch.isPublic = Boolean(isPublic);
    if (description !== undefined) patch.description = String(description);
    if (maxPrice !== undefined) {
      const m = parseNumber(maxPrice);
      patch.maxPrice = Number.isFinite(m) && m >= 0 ? m : null;
    }
    if (category !== undefined) {
      patch.category = category === 'premium' ? 'premium' : 'basic';
    }
    const updated = await Pricing.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
  }
}

export async function deletePricing(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'id không hợp lệ' });
    }
    const removed = await Pricing.findByIdAndDelete(id);
    if (!removed) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
  }
}
