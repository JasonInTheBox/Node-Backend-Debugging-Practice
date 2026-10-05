const express = require('express');
const usersRouter = require('./routes/users.routes');
const ordersRouter = require('./routes/orders.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
