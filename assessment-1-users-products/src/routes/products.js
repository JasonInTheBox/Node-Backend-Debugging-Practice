const express = require('express');
const controller = require('../controllers/productController');

const router = express.Router();

router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);
router.post('/', controller.createProduct);
router.put('/:id', controller.updateProduct);
router.delete('/:id', controller.deleteProduct);

module.exports = router;
