const MenuItem = require('../models/MenuItem');

const getMenuItems = async (req, res) => {
  try {
    const { category, search, available } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (available !== undefined && available !== '') {
      filter.isAvailable = available === 'true';
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    return res.status(200).json({ items, count: items.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    return res.status(200).json({ item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch menu item', error: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, category, price, description, isAvailable, imageUrl } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Item name is required' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ message: 'Item category is required' });
    }
    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({ message: 'Valid price (non-negative) is required' });
    }

    const newItem = new MenuItem({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      description: description ? description.trim() : '',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      imageUrl: imageUrl ? imageUrl.trim() : ''
    });

    const saved = await newItem.save();
    return res.status(201).json({ message: 'Menu item created successfully', item: saved });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create menu item', error: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { name, category, price, description, isAvailable, imageUrl } = req.body;
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (name !== undefined) item.name = name.trim();
    if (category !== undefined) item.category = category.trim();
    if (price !== undefined) {
      if (Number(price) < 0) {
        return res.status(400).json({ message: 'Price cannot be negative' });
      }
      item.price = Number(price);
    }
    if (description !== undefined) item.description = description.trim();
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (imageUrl !== undefined) item.imageUrl = imageUrl.trim();

    const updated = await item.save();
    return res.status(200).json({ message: 'Menu item updated successfully', item: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update menu item', error: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    const updated = await item.save();
    return res.status(200).json({
      message: `Menu item ${updated.isAvailable ? 'activated' : 'deactivated'} successfully`,
      item: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to toggle availability', error: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    return res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
};
