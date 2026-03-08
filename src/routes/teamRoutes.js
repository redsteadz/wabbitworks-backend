const express = require('express');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  removeTeam,
  listMembers,
  addMember,
  updateMember,
  removeMember,
} = require('../controllers/teamController');
const { createTeamSchema, updateTeamSchema, addMemberSchema, updateMemberSchema } = require('../validators/team');

const router = express.Router();

router.use(requireAuth);

router.get('/', listTeams);
router.post('/', validate(createTeamSchema), createTeam);
router.get('/:teamId', getTeam);
router.patch('/:teamId', validate(updateTeamSchema), updateTeam);
router.delete('/:teamId', removeTeam);

router.get('/:teamId/members', listMembers);
router.post('/:teamId/members', validate(addMemberSchema), addMember);
router.patch('/:teamId/members/:membershipId', validate(updateMemberSchema), updateMember);
router.delete('/:teamId/members/:membershipId', removeMember);

module.exports = router;
