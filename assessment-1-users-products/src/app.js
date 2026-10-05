const express = require('express');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
