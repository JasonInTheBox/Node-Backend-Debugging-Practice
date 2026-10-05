const express = require('express');
const controller = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);
router.post('/', authenticate, requireAdmin, controller.createProduct);
router.patch('/:id', authenticate, controller.updateProduct);
router.delete('/:id', authenticate, requireAdmin, controller.deleteProduct);

module.exports = router;
