const express = require('express');
const controller = require('../controllers/orders.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', controller.getOrders);
router.get('/:id', controller.getOrderById);
router.get('/mine', authenticate, controller.getMyOrders);
router.post('/', authenticate, controller.createOrder);
router.put('/:id', authenticate, controller.updateOrder);
router.delete('/:id', authenticate, requireAdmin, controller.deleteOrder);

module.exports = router;
