const teamService = require('./team.service');
const membershipService = require('../memberships/membership.service');
const catchAsync = require('../../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const team = await teamService.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Team created', data: { team } });
});

const getAll = catchAsync(async (req, res) => {
  const teams = await teamService.findByUser(req.user.id);
  res.json({ success: true, data: { teams } });
});

const getById = catchAsync(async (req, res) => {
  const team = await teamService.findByIdWithCounts(req.params.id);
  res.json({ success: true, data: { team } });
});

const update = catchAsync(async (req, res) => {
  const team = await teamService.update(req.params.id, req.body, req.user.id);
  res.json({ success: true, message: 'Team updated', data: { team } });
});

const remove = catchAsync(async (req, res) => {
  await teamService.remove(req.params.id, req.user.id);
  res.json({ success: true, message: 'Team deleted' });
});

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};