import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Không tìm thấy danh mục');
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      res.status(400);
      throw new Error('Danh mục đã tồn tại');
    }

    const category = await Category.create({
      name,
      description,
      icon,
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PATCH /api/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Không tìm thấy danh mục');
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.icon = icon || category.icon;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Không tìm thấy danh mục');
    }

    await category.deleteOne();
    res.json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    next(error);
  }
};
