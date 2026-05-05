const membershipService = require('../src/modules/memberships/membership.service');
const MembershipModel = require('../src/modules/memberships/membership.model');
const userService = require('../src/modules/users/user.service');
const ApiError = require('../src/utils/ApiError');
const { MEMBERSHIP_ROLE, MEMBERSHIP_STATUS } = require('../src/utils/constants');

// Mock dependencies
jest.mock('../src/modules/memberships/membership.model');
jest.mock('../src/modules/users/user.service');

describe('Membership Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new membership if none exists', async () => {
      const membershipData = { user_id: 1, team_id: 1, role: MEMBERSHIP_ROLE.MEMBER };
      const createdMembership = { id: 1, ...membershipData, status: MEMBERSHIP_STATUS.ACTIVE };

      MembershipModel.findByUserAndTeam.mockResolvedValue(null);
      MembershipModel.create.mockResolvedValue(createdMembership);

      const result = await membershipService.create(membershipData);

      expect(MembershipModel.findByUserAndTeam).toHaveBeenCalledWith(membershipData.user_id, membershipData.team_id);
      expect(MembershipModel.create).toHaveBeenCalledWith(membershipData);
      expect(result).toEqual(createdMembership);
    });

    it('should reactivate inactive membership', async () => {
      const membershipData = { user_id: 1, team_id: 1, role: MEMBERSHIP_ROLE.ADMIN };
      const existingMembership = { id: 1, user_id: 1, team_id: 1, status: MEMBERSHIP_STATUS.INACTIVE };
      const updatedMembership = { ...existingMembership, status: MEMBERSHIP_STATUS.ACTIVE, role: MEMBERSHIP_ROLE.ADMIN };

      MembershipModel.findByUserAndTeam.mockResolvedValue(existingMembership);
      MembershipModel.update.mockResolvedValue(updatedMembership);

      const result = await membershipService.create(membershipData);

      expect(MembershipModel.update).toHaveBeenCalledWith(existingMembership.id, {
        status: MEMBERSHIP_STATUS.ACTIVE,
        role: membershipData.role,
      });
      expect(result).toEqual(updatedMembership);
    });

    it('should throw error if active membership already exists', async () => {
      const membershipData = { user_id: 1, team_id: 1, role: MEMBERSHIP_ROLE.MEMBER };
      const existingMembership = { id: 1, user_id: 1, team_id: 1, status: MEMBERSHIP_STATUS.ACTIVE };

      MembershipModel.findByUserAndTeam.mockResolvedValue(existingMembership);

      await expect(membershipService.create(membershipData)).rejects.toThrow(ApiError);
    });

    it('should use default role if not provided when reactivating', async () => {
      const membershipData = { user_id: 1, team_id: 1 };
      const existingMembership = { id: 1, user_id: 1, team_id: 1, status: MEMBERSHIP_STATUS.INACTIVE };
      const updatedMembership = { ...existingMembership, status: MEMBERSHIP_STATUS.ACTIVE, role: MEMBERSHIP_ROLE.MEMBER };

      MembershipModel.findByUserAndTeam.mockResolvedValue(existingMembership);
      MembershipModel.update.mockResolvedValue(updatedMembership);

      const result = await membershipService.create(membershipData);

      expect(MembershipModel.update).toHaveBeenCalledWith(existingMembership.id, {
        status: MEMBERSHIP_STATUS.ACTIVE,
        role: MEMBERSHIP_ROLE.MEMBER,
      });
    });
  });

  describe('findByUserAndTeam', () => {
    it('should return membership', async () => {
      const userId = 1;
      const teamId = 1;
      const membership = { id: 1, user_id: userId, team_id: teamId, role: MEMBERSHIP_ROLE.MEMBER };

      MembershipModel.findByUserAndTeam.mockResolvedValue(membership);

      const result = await membershipService.findByUserAndTeam(userId, teamId);

      expect(MembershipModel.findByUserAndTeam).toHaveBeenCalledWith(userId, teamId);
      expect(result).toEqual(membership);
    });
  });

});