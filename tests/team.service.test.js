const teamService = require('../src/modules/teams/team.service');
const TeamModel = require('../src/modules/teams/team.model');
const membershipService = require('../src/modules/memberships/membership.service');
const ApiError = require('../src/utils/ApiError');
const { MEMBERSHIP_ROLE } = require('../src/utils/constants');

// Mock dependencies
jest.mock('../src/modules/teams/team.model');
jest.mock('../src/modules/memberships/membership.service');

describe('Team Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a team and add creator as owner', async () => {
      const teamData = { name: 'Test Team', description: 'A test team' };
      const userId = 1;
      const createdTeam = { id: 1, ...teamData, created_by: userId };

      TeamModel.create.mockResolvedValue(createdTeam);
      membershipService.create.mockResolvedValue();

      const result = await teamService.create(teamData, userId);

      expect(TeamModel.create).toHaveBeenCalledWith({
        ...teamData,
        created_by: userId,
      });
      expect(membershipService.create).toHaveBeenCalledWith({
        user_id: userId,
        team_id: createdTeam.id,
        role: MEMBERSHIP_ROLE.OWNER,
      });
      expect(result).toEqual(createdTeam);
    });
  });

  describe('findById', () => {
    it('should return team if found', async () => {
      const teamId = 1;
      const team = { id: teamId, name: 'Test Team' };

      TeamModel.findByIdWithCreator.mockResolvedValue(team);

      const result = await teamService.findById(teamId);

      expect(TeamModel.findByIdWithCreator).toHaveBeenCalledWith(teamId);
      expect(result).toEqual(team);
    });

    it('should throw error if team not found', async () => {
      const teamId = 1;
      TeamModel.findByIdWithCreator.mockResolvedValue(null);

      await expect(teamService.findById(teamId)).rejects.toThrow(ApiError);
    });
  });

  describe('findByIdWithCounts', () => {
    it('should return team with member and task counts', async () => {
      const teamId = 1;
      const team = { id: teamId, name: 'Test Team' };
      const memberCount = 5;
      const taskCount = 10;

      TeamModel.findByIdWithCreator.mockResolvedValue(team);
      TeamModel.getMemberCount.mockResolvedValue(memberCount);
      TeamModel.getTaskCount.mockResolvedValue(taskCount);

      const result = await teamService.findByIdWithCounts(teamId);

      expect(result).toEqual({
        ...team,
        member_count: memberCount,
        task_count: taskCount,
      });
    });
  });

});