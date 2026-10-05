const projectsRepository = require('../repositories/projects.repository');

async function projectAccess(req, res, next) {
  try {
    const projectId = Number(req.params.projectId);
    const project = await projectsRepository.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { projectAccess };
