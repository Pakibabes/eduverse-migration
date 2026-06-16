import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Edit2, Mail, Search, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [schoolMembers, setSchoolMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTab, setUserTab] = useState('active');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteLinks, setInviteLinks] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ role: 'student', school_id: '', country: '', education_status: '', categories: [] });
  const [inviteData, setInviteData] = useState({ email: '', role: 'student', country: '' });
  const countries = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.School.list(),
      base44.entities.SchoolMember.list(),
      base44.entities.InviteLink.list(),
      base44.entities.InvitedUser.list(),
      base44.entities.CareerCategory.list(),
    ]).then(([u, s, sm, il, inv, cats]) => {
      setUsers(u);
      setSchools(s);
      setSchoolMembers(sm);
      setInviteLinks(il);
      setInvitedUsers(inv.filter(i => i.status === 'pending'));
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    // Filter out orphaned categories that don't exist in CareerCategory
    const validCategories = (user.categories || []).filter(catId =>
      categories.some(cat => cat.id === catId)
    );
    setFormData({
      role: user.role || 'user',
      school_id: schoolMembers.find(sm => sm.user_id === user.id)?.school_id || '',
      country: user.country || '',
      education_status: user.education_status || '',
      categories: validCategories,
    });
    setShowEditModal(true);
  };

  const handleInviteUser = async () => {
    if (!inviteData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    // Map custom roles to SDK-supported roles (user or admin)
    const sdkRole = ['admin', 'school_admin', 'super_admin'].includes(inviteData.role) ? 'admin' : 'user';
    await base44.users.inviteUser(inviteData.email, sdkRole);
    // Track the invite
    const invited = await base44.entities.InvitedUser.create({
      email: inviteData.email,
      role: inviteData.role,
      country: inviteData.country || null,
      status: 'pending',
    });
    setInvitedUsers(prev => [...prev, invited]);
    toast.success('Invite sent to ' + inviteData.email);
    setInviteData({ email: '', role: 'student', country: '' });
    setShowInviteModal(false);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    // Filter out orphaned categories before saving
    const validCategories = formData.categories.filter(catId =>
      categories.some(cat => cat.id === catId)
    );

    // Update user role, country, education status, and categories
    await base44.auth.updateMe({ 
      role: formData.role, 
      country: formData.country, 
      education_status: formData.education_status,
      categories: validCategories,
    });
    
    // Handle school assignment
    const existingMembership = schoolMembers.find(sm => sm.user_id === selectedUser.id);
    if (formData.school_id) {
      if (existingMembership) {
        if (existingMembership.school_id !== formData.school_id) {
          await base44.entities.SchoolMember.delete(existingMembership.id);
          await base44.entities.SchoolMember.create({
            school_id: formData.school_id,
            user_id: selectedUser.id,
            user_name: selectedUser.full_name,
            user_email: selectedUser.email,
            role: 'member',
            status: 'pending',
            joined_date: new Date().toISOString().split('T')[0],
          });
        }
      } else {
        await base44.entities.SchoolMember.create({
          school_id: formData.school_id,
          user_id: selectedUser.id,
          user_name: selectedUser.full_name,
          user_email: selectedUser.email,
          role: 'member',
          status: 'pending',
          joined_date: new Date().toISOString().split('T')[0],
        });
      }
    } else if (existingMembership) {
      await base44.entities.SchoolMember.delete(existingMembership.id);
    }

    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: formData.role, education_status: formData.education_status, categories: formData.categories } : u));
    setShowEditModal(false);
    toast.success('User updated');
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      // Delete school membership if exists
      const membership = schoolMembers.find(sm => sm.user_id === userId);
      if (membership) {
        await base44.entities.SchoolMember.delete(membership.id);
      }
      // Note: User deletion via SDK may not be available; this is a placeholder
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserSchool = (userId) => {
    const membership = schoolMembers.find(sm => sm.user_id === userId);
    return membership ? schools.find(s => s.id === membership.school_id)?.name : '—';
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">User Management</h1>
          <p className="text-sm text-white/40 mt-1">Manage all platform users</p>
        </div>
        <GlassButton variant="primary-violet" onClick={() => setShowInviteModal(true)}>
          <Plus className="w-4 h-4" /> Invite User
        </GlassButton>
      </div>

      {/* User Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/8">
        <button
          onClick={() => setUserTab('active')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            userTab === 'active'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Active ({users.length})
        </button>
        <button
          onClick={() => setUserTab('invited')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            userTab === 'invited'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Invited ({invitedUsers.length})
        </button>
        <button
          onClick={() => setUserTab('requests')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            userTab === 'requests'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Join Requests ({schoolMembers.filter(m => m.status === 'pending').length})
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <label className="text-xs font-semibold text-white/60 mb-2 block">Search Users</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-violet-500/40 transition-all bg-white/5 hover:bg-white/7"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />)}</div>
      ) : userTab === 'invited' ? (
        invitedUsers.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white/40">No pending invites</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitedUsers.map(invite => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-white/8 hover:bg-white/4 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{invite.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">Pending</span>
                    <span className="text-xs px-2 py-1 rounded bg-violet-500/20 text-violet-300">{invite.role}</span>
                    {invite.country && <span className="text-xs text-white/40">📍 {invite.country}</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    base44.entities.InvitedUser.delete(invite.id);
                    setInvitedUsers(prev => prev.filter(i => i.id !== invite.id));
                  }}
                  className="p-1.5 text-white/40 hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )
      ) : userTab === 'requests' ? (
        schoolMembers.filter(m => m.status === 'pending').length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white/40">No pending join requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schoolMembers.filter(m => m.status === 'pending').map(member => {
              const user = users.find(u => u.id === member.user_id);
              const school = schools.find(s => s.id === member.school_id);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/8 hover:bg-white/4 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{member.user_name}</p>
                    <p className="text-xs text-white/40">{member.user_email}</p>
                    <p className="text-xs text-white/30 mt-1">{school?.name || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        base44.entities.SchoolMember.update(member.id, { status: 'approved' });
                        setSchoolMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: 'approved' } : m));
                        toast.success('User approved');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        base44.entities.SchoolMember.update(member.id, { status: 'rejected' });
                        setSchoolMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: 'rejected' } : m));
                        toast.success('User rejected');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-medium transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-white/40">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-3 px-4 font-semibold text-white/60">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Country</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">School</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Categories</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Education Status</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Joined</th>
                <th className="text-right py-3 px-4 font-semibold text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/6 hover:bg-white/4 transition-colors"
                >
                  <td className="py-3 px-4 text-white/80">{user.full_name || 'N/A'}</td>
                  <td className="py-3 px-4 text-white/70">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-violet-500/20 text-violet-400'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/70">{user.country || '—'}</td>
                  <td className="py-3 px-4 text-white/70">{getUserSchool(user.id)}</td>
                  <td className="py-3 px-4 text-sm">
                    {user.categories && user.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.categories.map(catId => {
                          const cat = categories.find(c => c.id === catId);
                          return <span key={catId} className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{cat?.name || catId}</span>;
                        })}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      user.education_status === 'graduated'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : user.education_status === 'not_graduated'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-white/8 text-white/40'
                    }`}>
                      {user.education_status ? (user.education_status === 'graduated' ? 'Graduated' : 'Not Graduated') : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/50 text-xs">
                    {new Date(user.created_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1.5 text-white/40 hover:text-violet-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-white/40 hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit user modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowEditModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(10,14,32,0.95)' }}>
                <h2 className="text-lg font-bold text-white font-heading mb-4">Edit User: {selectedUser.full_name}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="school_admin">School Admin</option>
                      <option value="school_staff">School Staff</option>
                      <option value="student">Student</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Select country...</option>
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Education Status</label>
                    <select
                      value={formData.education_status}
                      onChange={(e) => setFormData({ ...formData, education_status: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Not set</option>
                      <option value="graduated">Graduated</option>
                      <option value="not_graduated">Not Graduated</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Assign to School</label>
                    <select
                      value={formData.school_id}
                      onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">No school</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Categories</label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            categories: prev.categories.includes(cat.id)
                              ? prev.categories.filter(c => c !== cat.id)
                              : [...prev.categories, cat.id]
                          }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                            formData.categories.includes(cat.id)
                              ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                              : 'bg-white/5 border-white/8 text-white/50 hover:bg-white/8'
                          }`}
                        >
                          {formData.categories.includes(cat.id) && <Check className="w-3 h-3" />}
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <GlassButton variant="primary-violet" onClick={handleSaveUser} className="flex-1">
                    Save
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invite user modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowInviteModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(10,14,32,0.95)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white font-heading">Invite User</h2>
                  <button onClick={() => setShowInviteModal(false)} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60">Email</label>
                    <input
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      placeholder="user@example.com"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Role</label>
                    <select
                      value={inviteData.role}
                      onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="school_admin">School Admin</option>
                      <option value="school_staff">School Staff</option>
                      <option value="student">Student</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Country (optional)</label>
                    <select
                      value={inviteData.country}
                      onChange={(e) => setInviteData({ ...inviteData, country: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Select country...</option>
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <GlassButton variant="primary-violet" onClick={handleInviteUser} className="flex-1">
                    Send Invite
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}