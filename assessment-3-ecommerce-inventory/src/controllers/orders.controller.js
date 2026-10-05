const orderService = require('../services/orders.service');
const { validateOrder } = require('../validation/orders.validation');

async function getOrders(req, res, next) {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ data: orders, total: orders.length });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = orderService.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const payload = {
      productId: Number(req.body.productId),
      quantity: req.body.qty,
      userId: req.user.id,
    };

    const errors = validateOrder(payload);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const order = await orderService.createOrder(payload);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const success = await orderService.deleteOrder(id);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  deleteOrder,
};
