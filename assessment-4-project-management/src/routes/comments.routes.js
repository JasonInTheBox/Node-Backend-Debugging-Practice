const express = require('express');
const controller = require('../controllers/comments.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:commentId', authenticate, controller.deleteComment);

module.exports = router;
