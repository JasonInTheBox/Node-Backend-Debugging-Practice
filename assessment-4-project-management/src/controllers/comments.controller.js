const commentService = require('../services/comments.service');

async function deleteComment(req, res, next) {
  try {
    const id = Number(req.params.commentId);
    const isAdmin = req.user.role === 'admin';
    const result = await commentService.deleteComment(id, req.user.id, isAdmin);
    if (result === null) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { deleteComment };
