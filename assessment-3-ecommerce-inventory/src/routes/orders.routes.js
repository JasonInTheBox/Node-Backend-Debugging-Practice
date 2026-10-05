const express = require('express');
const controller = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

router.get('/', authenticate, requireAdmin, controller.getOrders);
router.get('/:id', authenticate, requireAdmin, controller.getOrderById);
router.post('/', authenticate, controller.createOrder);
router.delete('/:id', requireAdmin, authenticate, controller.deleteOrder);

module.exports = router;
