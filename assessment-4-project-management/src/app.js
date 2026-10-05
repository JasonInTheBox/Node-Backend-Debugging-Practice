const express = require('express');
const projectsRouter = require('./routes/projects.routes');
const tasksRouter = require('./routes/tasks.routes');
const commentsRouter = require('./routes/comments.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
