const express = require('express');
const productsRouter = require('./routes/products.routes');
const ordersRouter = require('./routes/orders.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
