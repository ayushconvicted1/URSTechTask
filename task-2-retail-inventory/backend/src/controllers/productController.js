const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

const getProducts = async (req, res) => {
  try {
    const { search, category, stockStatus, isActive } = req.query;
    const filter = {};

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    let products = await Product.find(filter).sort({ name: 1 });

    if (stockStatus === 'low') {
      products = products.filter((p) => p.availableStock <= p.reorderLevel && p.availableStock > 0);
    } else if (stockStatus === 'out_of_stock') {
      products = products.filter((p) => p.availableStock === 0);
    } else if (stockStatus === 'in_stock') {
      products = products.filter((p) => p.availableStock > p.reorderLevel);
    }

    return res.status(200).json({ products, count: products.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { sku, name, category, purchasePrice, sellingPrice, availableStock = 0, reorderLevel = 10 } = req.body;

    if (!sku || sku.trim() === '') {
      return res.status(400).json({ message: 'SKU is required' });
    }
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Product name is required' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (purchasePrice === undefined || Number(purchasePrice) < 0) {
      return res.status(400).json({ message: 'Valid purchase price is required' });
    }
    if (sellingPrice === undefined || Number(sellingPrice) < 0) {
      return res.status(400).json({ message: 'Valid selling price is required' });
    }

    const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingSku) {
      return res.status(400).json({ message: `SKU "${sku.trim().toUpperCase()}" already exists` });
    }

    const initialStock = Math.max(0, parseInt(availableStock, 10) || 0);

    const product = new Product({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      availableStock: initialStock,
      reorderLevel: Math.max(0, parseInt(reorderLevel, 10) || 10),
      isActive: true
    });

    const savedProduct = await product.save();

    if (initialStock > 0) {
      await InventoryMovement.create({
        product: savedProduct._id,
        type: 'RECEIVED',
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        reason: 'Initial stock intake upon product creation',
        referenceId: `INIT-${savedProduct.sku}`,
        performedBy: req.user ? req.user._id : null
      });
    }

    return res.status(201).json({ message: 'Product created successfully', product: savedProduct });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { sku, name, category, purchasePrice, sellingPrice, reorderLevel, isActive } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (sku && sku.trim().toUpperCase() !== product.sku) {
      const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
      if (existing) {
        return res.status(400).json({ message: `SKU "${sku.trim().toUpperCase()}" already exists` });
      }
      product.sku = sku.trim().toUpperCase();
    }

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (purchasePrice !== undefined) {
      if (Number(purchasePrice) < 0) return res.status(400).json({ message: 'Purchase price cannot be negative' });
      product.purchasePrice = Number(purchasePrice);
    }
    if (sellingPrice !== undefined) {
      if (Number(sellingPrice) < 0) return res.status(400).json({ message: 'Selling price cannot be negative' });
      product.sellingPrice = Number(sellingPrice);
    }
    if (reorderLevel !== undefined) {
      if (Number(reorderLevel) < 0) return res.status(400).json({ message: 'Reorder level cannot be negative' });
      product.reorderLevel = parseInt(reorderLevel, 10);
    }
    if (isActive !== undefined) {
      product.isActive = Boolean(isActive);
    }

    const updated = await product.save();
    return res.status(200).json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct
};
