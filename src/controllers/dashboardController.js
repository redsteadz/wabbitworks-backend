const catchAsync = require('../utils/catchAsync');
const { db } = require('../config/db');

const getDashboard = catchAsync(async (req, res) => {
  const now = new Date();
  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const teamsCount = await db('memberships')
    .where({ user_id: req.user.id, status: 'active' })
    .count()
    .first();

  const statusCounts = await db('tasks')
    .where({ assigned_to: req.user.id, is_active: true })
    .groupBy('status')
    .select('status')
    .count();

  const overdueCount = await db('tasks')
    .where({ assigned_to: req.user.id, is_active: true })
    .andWhereNot('status', 'completed')
    .andWhere('due_date', '<', now)
    .count()
    .first();

  const dueSoonCount = await db('tasks')
    .where({ assigned_to: req.user.id, is_active: true })
    .andWhereNot('status', 'completed')
    .andWhereBetween('due_date', [now, inSevenDays])
    .count()
    .first();

  const upcomingTasks = await db('tasks')
    .where({ assigned_to: req.user.id, is_active: true })
    .andWhereNot('status', 'completed')
    .andWhereNotNull('due_date')
    .orderBy('due_date', 'asc')
    .limit(6)
    .select('*');

  res.json({
    teamsCount: parseInt(teamsCount.count, 10),
    statusCounts: statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count, 10);
      return acc;
    }, {}),
    overdueCount: parseInt(overdueCount.count, 10),
    dueSoonCount: parseInt(dueSoonCount.count, 10),
    upcomingTasks,
  });
});

module.exports = { getDashboard };
