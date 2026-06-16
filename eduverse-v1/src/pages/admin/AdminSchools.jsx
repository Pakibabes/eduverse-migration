import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Users, ChevronRight, X, Upload, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { toast } from 'sonner';

export default function AdminSchools() {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', logo_url: '', country: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [memberTab, setMemberTab] = useState('pending');
  const [detailTab, setDetailTab] = useState('members');
  const countries = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];

  useEffect(() => {
    Promise.all([
      base44.entities.School.list(),
      base44.entities.User.list(),
      base44.entities.SchoolMember.list(),
      base44.auth.me(),
    ]).then(([s, u, m, cu]) => {
      setSchools(s);
      setUsers(u);
      setMembers(m);
      setCurrentUser(cu);
      setLoading(false);
    });
  }, []);

  const handleCreateSchool = async () => {
    if (!formData.name.trim()) return;
    const school = await base44.entities.School.create({
      name: formData.name,
      description: formData.description,
      logo_url: formData.logo_url,
      country: formData.country,
      admin_id: currentUser?.id,
      member_count: 0,
      status: 'active',
    });
    setSchools(prev => [...prev, school]);
    setFormData({ name: '', description: '', logo_url: '', country: '' });
    setShowCreateModal(false);
  };

  const handleDeleteSchool = async (schoolId) => {
    await base44.entities.School.delete(schoolId);
    setSchools(prev => prev.filter(s => s.id !== schoolId));
  };

  const handleSelectSchool = (school) => {
    setSelectedSchool(school);
    setEditingSchool({ ...school });
  };

  const handleBackToList = () => {
    setSelectedSchool(null);
    setEditingSchool(null);
  };

  const handleUpdateSchool = async () => {
    if (!editingSchool.name.trim()) {
      toast.error('School name is required');
      return;
    }
    await base44.entities.School.update(editingSchool.id, {
      name: editingSchool.name,
      description: editingSchool.description,
      logo_url: editingSchool.logo_url,
      country: editingSchool.country,
    });
    setSchools(prev => prev.map(s => s.id === editingSchool.id ? editingSchool : s));
    setSelectedSchool(editingSchool);
    toast.success('School updated');
  };

  const handleAddMember = async (userId, userName, userEmail) => {
    const schoolMember = await base44.entities.SchoolMember.create({
      school_id: selectedSchool.id,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      role: 'member',
      status: 'pending',
      joined_date: new Date().toISOString().split('T')[0],
    });
    setMembers(prev => [...prev, schoolMember]);
    toast.success(`${userName} pending approval`);
  };

  const handleApproveMember = async (memberId) => {
    await base44.entities.SchoolMember.update(memberId, { status: 'approved' });
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'approved' } : m));
    toast.success('Member approved');
  };

  const handleRejectMember = async (memberId) => {
    await base44.entities.SchoolMember.delete(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast.success('Member rejected');
  };

  const handleRemoveMember = async (memberId) => {
    await base44.entities.SchoolMember.delete(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    const member = members.find(m => m.id === memberId);
    await base44.entities.SchoolMember.update(memberId, { role: newRole });
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };

  const schoolMembers = selectedSchool
    ? members.filter(m => m.school_id === selectedSchool.id)
    : [];

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, logo_url: res.file_url }));
    setUploading(false);
  };

  const handleDetailLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    setEditingSchool(prev => ({ ...prev, logo_url: res.file_url }));
    setUploading(false);
  };

  return (
    <div className="p-8">
      {!selectedSchool ? (
        <>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">Schools</h1>
              <p className="text-sm text-white/40 mt-1">Manage schools and their members</p>
            </div>
            <GlassButton variant="primary-violet" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" /> Create School
            </GlassButton>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {schools.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Users className="w-10 h-10 text-violet-500/20 mx-auto mb-3" />
                  <p className="text-white/40">No schools yet — create one to get started</p>
                </div>
              ) : (
                schools.map(school => (
                  <motion.div
                    key={school.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl border border-white/8 hover:border-violet-500/30 transition-all flex items-center gap-4 cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    onClick={() => handleSelectSchool(school)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center text-lg font-bold text-violet-400 flex-shrink-0">
                      {school.logo_url ? <img src={school.logo_url} className="w-full h-full rounded-xl object-cover" alt="" /> : school.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white">{school.name}</h3>
                      <p className="text-xs text-white/40 mt-1 line-clamp-1">{school.description || 'No description'}</p>
                      {school.country && <p className="text-xs text-white/30 mt-1">📍 {school.country}</p>}
                      <p className="text-xs text-white/25 mt-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {schoolMembers.length} members
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={handleBackToList} className="mb-6 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Schools
          </button>

          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setDetailTab('members')}
                className={`text-sm font-semibold pb-3 px-4 transition-colors ${detailTab === 'members' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-white/40 hover:text-white/60'}`}
              >
                Members & Students
              </button>
              <button
                onClick={() => setDetailTab('edit')}
                className={`text-sm font-semibold pb-3 px-4 transition-colors ${detailTab === 'edit' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-white/40 hover:text-white/60'}`}
              >
                Edit School Info
              </button>
              <button
                onClick={() => setDetailTab('onboarding')}
                className={`text-sm font-semibold pb-3 px-4 transition-colors ${detailTab === 'onboarding' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-white/40 hover:text-white/60'}`}
              >
                Onboarding Courses
              </button>
            </div>

            {/* Members Tab */}
            {detailTab === 'members' && (
              <div className="rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="text-2xl font-bold text-white font-heading mb-6">{editingSchool?.name}</h2>
                <div className="flex gap-2 mb-6 border-b border-white/10">
                  <button
                    onClick={() => setMemberTab('students')}
                    className={`text-sm font-semibold pb-3 px-4 transition-colors ${memberTab === 'students' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Students ({schoolMembers.filter(m => users.find(u => u.id === m.user_id && u.role === 'student')).length})
                  </button>
                  <button
                    onClick={() => setMemberTab('staff')}
                    className={`text-sm font-semibold pb-3 px-4 transition-colors ${memberTab === 'staff' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Staff ({schoolMembers.filter(m => {
                      const user = users.find(u => u.id === m.user_id);
                      return user && (user.role === 'school_admin' || user.role === 'school_staff');
                    }).length})
                  </button>
                  <button
                    onClick={() => setMemberTab('pending')}
                    className={`text-sm font-semibold pb-3 px-4 transition-colors ${memberTab === 'pending' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Pending Users ({schoolMembers.filter(m => m.school_id === selectedSchool.id && m.status === 'pending').length})
                  </button>
                </div>
                <div className="space-y-2">
                  {memberTab === 'students' ? (
                    (() => {
                      const studentMembers = schoolMembers.filter(m => 
                        users.find(u => u.id === m.user_id && u.role === 'student') &&
                        m.status === 'approved'
                      );
                      return studentMembers.length === 0 ? (
                        <p className="text-sm text-white/25 text-center py-8">No approved students yet</p>
                      ) : (
                        studentMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/4 text-sm group hover:bg-white/6 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
                            {member.user_name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80">{member.user_name}</p>
                            <p className="text-xs text-white/40">{member.user_email}</p>
                            <div className="flex gap-2 mt-1 text-xs">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{member.role}</span>
                              {member.joined_date && <span className="text-white/30">Joined {new Date(member.joined_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleRemoveMember(member.id)} className="text-white/20 hover:text-rose-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                      );
                    })()
                  ) : memberTab === 'staff' ? (
                    (() => {
                      const staffMembers = schoolMembers.filter(m => {
                        const user = users.find(u => u.id === m.user_id);
                        return user && (user.role === 'school_admin' || user.role === 'school_staff') && m.status === 'approved';
                      });
                      return staffMembers.length === 0 ? (
                        <p className="text-sm text-white/25 text-center py-8">No approved staff yet</p>
                      ) : (
                        staffMembers.map(member => (
                          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/4 text-sm group hover:bg-white/6 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
                              {member.user_name?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white/80">{member.user_name}</p>
                              <p className="text-xs text-white/40">{member.user_email}</p>
                              <div className="flex gap-2 mt-1 text-xs">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{users.find(u => u.id === member.user_id)?.role}</span>
                                {member.joined_date && <span className="text-white/30">Joined {new Date(member.joined_date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            <button onClick={() => handleRemoveMember(member.id)} className="text-white/20 hover:text-rose-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      );
                    })()
                  ) : (
                    (() => {
                      const pendingUsers = schoolMembers.filter(m => m.school_id === selectedSchool.id && m.status === 'pending');
                      return pendingUsers.length === 0 ? (
                        <p className="text-sm text-white/25 text-center py-8">No pending approvals</p>
                      ) : (
                        pendingUsers.map(member => (
                          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/4 text-sm group hover:bg-white/6 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-300 flex-shrink-0">
                              {member.user_name?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white/80">{member.user_name}</p>
                              <p className="text-xs text-white/40">{member.user_email}</p>
                              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">Pending</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => handleApproveMember(member.id)}
                                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectMember(member.id)}
                                className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-medium transition-colors"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        ))
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {/* Edit Tab */}
            {detailTab === 'edit' && (
              <div className="rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="text-2xl font-bold text-white font-heading mb-6">School Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60">School Name</label>
                    <input
                      type="text"
                      value={editingSchool?.name || ''}
                      onChange={(e) => setEditingSchool({...editingSchool, name: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Description</label>
                    <textarea
                      value={editingSchool?.description || ''}
                      onChange={(e) => setEditingSchool({...editingSchool, description: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all resize-none h-24"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Logo</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/8 text-sm text-white/60 hover:text-white/80 cursor-pointer transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                        <input type="file" accept="image/*" onChange={handleDetailLogoUpload} disabled={uploading} className="hidden" />
                      </label>
                      {editingSchool?.logo_url && (
                        <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={editingSchool.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Country</label>
                    <select
                      value={editingSchool?.country || ''}
                      onChange={(e) => setEditingSchool({...editingSchool, country: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Select country...</option>
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleUpdateSchool}
                    className="w-full px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors mt-6"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Onboarding Courses Tab */}
            {detailTab === 'onboarding' && (
              <div className="rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="text-2xl font-bold text-white font-heading mb-6">Map Onboarding Courses</h2>
                <p className="text-sm text-white/50 mb-4">Select a course for each career category to automatically assign it when internships are started.</p>
                {/* Placeholder for onboarding mapping component - to be implemented */}
                <div className="space-y-3">
                  <p className="text-sm text-white/30 italic">Onboarding course mapping coming soon</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Create school modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(10,14,32,0.95)' }}>
                <h2 className="text-lg font-bold text-white font-heading mb-4">Create School</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60">School Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., CIT School"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="School description..."
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/30 transition-all resize-none h-24"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Logo</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/8 text-sm text-white/60 hover:text-white/80 cursor-pointer transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
                      </label>
                      {formData.logo_url && (
                        <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
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
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <GlassButton variant="primary-violet" onClick={handleCreateSchool} className="flex-1">
                    Create
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