const express = require('express');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const {
  listTeamTasks,
  createTask,
  getTask,
  updateTask,
  completeTask,
  removeTask,
  listMyTasks,
} = require('../controllers/taskController');
const { createTaskSchema, updateTaskSchema } = require('../validators/task');

const router = express.Router();

router.use(requireAuth);

router.get('/me', listMyTasks);
router.get('/teams/:teamId', listTeamTasks);
router.post('/teams/:teamId', validate(createTaskSchema), createTask);
router.get('/:taskId', getTask);
router.patch('/:taskId', validate(updateTaskSchema), updateTask);
router.post('/:taskId/complete', completeTask);
router.delete('/:taskId', removeTask);

module.exports = router;
