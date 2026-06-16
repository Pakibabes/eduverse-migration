import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Copy, Trash2, Eye, X, Calendar, PowerCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { toast } from 'sonner';

export default function AdminInviteLinks() {
  const [inviteLinks, setInviteLinks] = useState([]);
  const [schools, setSchools] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignupsModal, setShowSignupsModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    school_id: '',
    category_id: '',
    role: 'student',
    country: '',
    require_approval: false,
    max_uses: '',
    expires_at: '',
    description: '',
  });

  useEffect(() => {
    Promise.all([
      base44.entities.InviteLink.list(),
      base44.entities.School.list(),
      base44.entities.SchoolMember.list(),
      base44.entities.CareerCategory.list(),
      base44.auth.me(),
    ]).then(([links, s, m, cats, u]) => {
      setInviteLinks(links);
      setSchools(s);
      setMembers(m);
      setCategories(cats.filter(c => c.status === 'active'));
      setCurrentUser(u);
      setLoading(false);
    });
  }, []);

  const generateCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}-${random}`;
  };

  const handleCreateLink = async () => {
    if (!formData.school_id && !formData.category_id) {
      toast.error('Select at least a school or category');
      return;
    }

    const link = await base44.entities.InviteLink.create({
      code: generateCode(),
      school_id: formData.school_id || null,
      category_id: formData.category_id || null,
      role: formData.role,
      country: formData.country || null,
      require_approval: formData.require_approval,
      created_by_id: currentUser?.id,
      is_active: true,
      use_count: 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      expires_at: formData.expires_at || null,
      description: formData.description,
    });

    setInviteLinks(prev => [...prev, link]);
    setFormData({ school_id: '', category_id: '', role: 'student', country: '', require_approval: false, max_uses: '', expires_at: '', description: '' });
    setShowCreateModal(false);
    toast.success('Invite link created');
  };

  const handleToggleActive = async (link) => {
    await base44.entities.InviteLink.update(link.id, { is_active: !link.is_active });
    setInviteLinks(prev =>
      prev.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l)
    );
  };

  const handleDeleteLink = async (linkId) => {
    await base44.entities.InviteLink.delete(linkId);
    setInviteLinks(prev => prev.filter(l => l.id !== linkId));
    toast.success('Link deleted');
  };

  const handleCopyLink = (code) => {
    const url = `${window.location.origin}/register?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const getSchoolName = (schoolId) => schools.find(s => s.id === schoolId)?.name || 'N/A';
  const getCategoryName = (categoryId) => categories.find(c => c.id === categoryId)?.name || 'N/A';

  const countries = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];

  const getSignupsForLink = (linkCode) => {
    // This would be populated via a function that tracks signups per invite code
    // For now, showing mock count
    return 0;
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Invite Links</h1>
          <p className="text-sm text-white/40 mt-1">Create and manage registration invite codes</p>
        </div>
        <GlassButton variant="primary-violet" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Create Link
        </GlassButton>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />)}</div>
      ) : inviteLinks.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-white/40">No invite links yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-3 px-4 font-semibold text-white/60">Code</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">School</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Uses</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Expires</th>
                <th className="text-left py-3 px-4 font-semibold text-white/60">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inviteLinks.map(link => (
                <motion.tr
                  key={link.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/6 hover:bg-white/4 transition-colors"
                >
                  <td className="py-3 px-4">
                    <code className="text-xs font-mono bg-white/8 px-2 py-1 rounded text-violet-300">{link.code}</code>
                  </td>
                  <td className="py-3 px-4 text-white/70">{getSchoolName(link.school_id) || '—'}</td>
                  <td className="py-3 px-4 text-white/70">{getCategoryName(link.category_id) || '—'}</td>
                  <td className="py-3 px-4">
                   <span className="text-xs font-semibold px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">{link.role || 'student'}</span>
                  </td>
                  <td className="py-3 px-4 text-white/70">
                    {link.use_count}/{link.max_uses || '∞'}
                  </td>
                  <td className="py-3 px-4 text-white/70">
                    {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      link.is_active
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyLink(link.code)}
                        className="p-1.5 text-white/40 hover:text-violet-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedLink(link); setShowSignupsModal(true); }}
                        className="p-1.5 text-white/40 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                        title="View signups"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(link)}
                        className={`p-1.5 transition-colors rounded-lg hover:bg-white/5 ${link.is_active ? 'text-orange-400' : 'text-white/40'}`}
                        title={link.is_active ? 'Disable' : 'Enable'}
                      >
                        <PowerCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
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

      {/* Create link modal */}
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
                <h2 className="text-lg font-bold text-white font-heading mb-4">Create Invite Link</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60">School (optional)</label>
                    <select
                      value={formData.school_id}
                      onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Select a school...</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Category (optional)</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Select a category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
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
                    <label className="text-xs font-semibold text-white/60">Country (optional)</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    >
                      <option value="">Select a country...</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                   <label className="text-xs font-semibold text-white/60">Max Uses (optional)</label>
                    <input
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      placeholder="Leave empty for unlimited"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Expires (optional)</label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., IT training for CIT school"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      className="w-full mt-1.5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/30 transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
                    <div>
                      <span className="text-sm text-white/70">Require Approval</span>
                      <p className="text-xs text-white/40 mt-1">Users must be approved before joining</p>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, require_approval: !formData.require_approval})}
                      className={`w-10 h-5 rounded-full transition-all duration-200 relative ${formData.require_approval ? 'bg-emerald-500' : 'bg-white/15'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${formData.require_approval ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <GlassButton variant="primary-violet" onClick={handleCreateLink} className="flex-1">
                    Create
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Signups modal */}
      <AnimatePresence>
        {showSignupsModal && selectedLink && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowSignupsModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(10,14,32,0.95)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white font-heading">Signups via {selectedLink.code}</h2>
                  <button onClick={() => setShowSignupsModal(false)} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center py-8">
                  <p className="text-white/40">Signup tracking feature coming soon</p>
                  <p className="text-xs text-white/20 mt-2">{selectedLink.use_count || 0} signups recorded</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}