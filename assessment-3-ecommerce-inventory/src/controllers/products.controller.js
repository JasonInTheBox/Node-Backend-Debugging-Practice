const productService = require('../services/products.service');
const { validateProduct } = require('../validation/products.validation');

async function getProducts(req, res, next) {
  try {
    const result = await productService.getAllProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const id = req.params.id;
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const errors = validateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const created = await productService.createProduct(req.body);
    res.status(200).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const updated = await productService.updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const success = await productService.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
