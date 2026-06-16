import { base44 } from '@/api/base44Client';

export async function getUserSchoolIds(userId) {
  const schoolMembers = await base44.entities.SchoolMember.filter({
    user_id: userId,
    status: 'approved',
  });
  return schoolMembers.map(sm => sm.school_id);
}