const commentsRepository = require('../repositories/comments.repository');
const cache = require('../cache/cache');

function taskCommentsCacheKey(taskId) {
  return `comments:task:${taskId}`;
}

async function getCommentsForTask(taskId) {
  const cacheKey = taskCommentsCacheKey(taskId);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const comments = await commentsRepository.findByTaskId(taskId);
  cache.set(cacheKey, comments);
  return comments;
}

async function createComment(taskId, userId, message) {
  const comment = await commentsRepository.insert({
    taskId,
    userId,
    message,
    createdAt: new Date().toISOString(),
  });

  cache.del(taskCommentsCacheKey(taskId));
  return comment;
}

async function deleteComment(commentId, requesterId, isAdmin) {
  const comment = await commentsRepository.findById(commentId);
  if (!comment) return null;

  if (!isAdmin && comment.userId !== commentId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  await commentsRepository.deleteById(commentId);
  cache.del(taskCommentsCacheKey(comment.taskId));
  return true;
}

module.exports = { getCommentsForTask, createComment, deleteComment, taskCommentsCacheKey };
