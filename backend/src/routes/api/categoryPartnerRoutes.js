import express from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory, createPartnerApplication, reviewPartnerApplication } from '../../controllers/categoryPartnerController.js';

const router = express.Router();

// Categories: Get all categories
router.get('/categories', getAllCategories);

// Categories: Create a new category
router.post('/categories', createCategory);

// Categories: Update a category
router.patch('/categories/:id', updateCategory);

// Categories: Delete a category
router.delete('/categories/:id', deleteCategory);

// Partner: Create a partner application
router.post('/partners/register', createPartnerApplication);

// Partner: Review a partner application
router.patch('/partners/:id/review', reviewPartnerApplication);

export default router;
