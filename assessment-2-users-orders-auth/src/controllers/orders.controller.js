const orderService = require('../services/orders.service');
const { validateOrder } = require('../validation/orders.validation');

async function getOrders(req, res, next) {
  try {
    const result = orderService.getAllOrders(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const data = await orderService.getOrdersForUser(req.user.userId);
    res.status(200).json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const id = req.params.id;
    const order = await orderService.getOrderById(id);
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
    const errors = validateOrder(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const created = await orderService.createOrder(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const updated = await orderService.updateOrder(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(updated);
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
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
