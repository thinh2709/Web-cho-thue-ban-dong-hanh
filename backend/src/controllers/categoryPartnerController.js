import Category from '../models/Category.js';
import PartnerApplication from '../models/PartnerApplication.js';
import User from '../models/User.js';

// Categories: Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories: ' + error.message });
  }
};

// Categories: Create a new category
export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category: ' + error.message });
  }
};

// Categories: Update a category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category: ' + error.message });
  }
};

// Categories: Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category: ' + error.message });
  }
};

// Partner: Create a partner application
export const createPartnerApplication = async (req, res) => {
  try {
    const partnerApplication = new PartnerApplication(req.body);
    await partnerApplication.save();
    res.status(201).json({ message: 'Partner application submitted', partnerApplication });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting partner application: ' + error.message });
  }
};

// Partner: Review a partner application
export const reviewPartnerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    const partnerApplication = await PartnerApplication.findByIdAndUpdate(id, { status, reviewNote }, { new: true });
    if (!partnerApplication) {
      return res.status(404).json({ message: 'Partner application not found' });
    }

    if (status === 'approved') {
        // If application is approved, update user role to 'companion'
        await User.findByIdAndUpdate(partnerApplication.userId, { role: 'companion' });
    }

    res.status(200).json({ message: 'Partner application reviewed', partnerApplication });
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing partner application: ' + error.message });
  }
};
