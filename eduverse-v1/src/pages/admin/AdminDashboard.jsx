import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Users, BookOpen, Globe, DollarSign, TrendingUp, Shield, Settings, ArrowRight, Lock, Activity, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [communities, setCommunities] = useState([]);
  const [members, setMembers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Community.list(),
      base44.entities.CommunityMember.list(),
      base44.entities.Course.list(),
    ]).then(([c, m, co]) => {
      setCommunities(c);
      setMembers(m);
      setCourses(co);
      setLoading(false);
    });
  }, []);

  const totalRevenue = communities
    .filter(c => c.is_paid)
    .reduce((sum, c) => sum + (c.price || 0) * members.filter(m => m.community_id === c.id && m.payment_status === 'paid').length, 0);

  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const activeCommunities = communities.filter(c => c.status === 'active').length;

  const handleDeleteCommunity = async (commId) => {
    if (!window.confirm('Delete this community? This action cannot be undone.')) return;
    await base44.entities.Community.delete(commId);
    setCommunities(prev => prev.filter(c => c.id !== commId));
  };

  const adminActions = [
    { label: 'Manage Communities', sub: 'Create, edit, and archive communities', icon: Globe, path: '/school/communities', color: 'emerald', badge: activeCommunities },
    { label: 'Manage Courses', sub: 'Build and publish course content', icon: BookOpen, path: '/admin/courses', color: 'cyan', badge: publishedCourses },
    { label: 'Manage Members', sub: 'Access control and roles', icon: Users, path: '/admin/members', color: 'violet', badge: members.length },
    { label: 'Revenue & Billing', sub: 'Track payments and earnings', icon: DollarSign, path: '/school/revenue', color: 'amber', badge: null },
    { label: 'Settings', sub: 'Platform configuration', icon: Settings, path: '/school/settings', color: 'teal', badge: null },
  ];

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', badge: 'bg-violet-500/20 text-violet-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', badge: 'bg-cyan-500/20 text-cyan-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', badge: 'bg-rose-500/20 text-rose-400' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', badge: 'bg-teal-500/20 text-teal-400' },
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Admin Control Center"
        subtitle="Full platform oversight — manage school, student, and community settings"
      />

      {/* Platform Overview */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Platform Overview</h2>
        <div className="glass rounded-2xl border border-white/8 p-6">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-white/40">Total Communities</p>
              <p className="text-2xl font-bold text-white">{communities.length}</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1"><Activity className="w-3 h-3" />{activeCommunities} active</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/40">Total Members</p>
              <p className="text-2xl font-bold text-white">{members.length}</p>
              <p className="text-xs text-white/30">Platform users</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/40">Published Courses</p>
              <p className="text-2xl font-bold text-white">{publishedCourses}</p>
              <p className="text-xs text-white/30">{courses.length} total</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/40">Est. Revenue</p>
              <p className="text-2xl font-bold text-amber-400">${totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-white/30">From paid communities</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/40">Health Status</p>
              <p className="text-2xl font-bold text-emerald-400">✓ Good</p>
              <p className="text-xs text-white/30">All systems operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/school">
          <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl border border-emerald-500/20 p-5 cursor-pointer hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white font-heading">School Dashboard</p>
                <p className="text-xs text-white/40">Instructor & content workspace</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 ml-auto transition-all" />
            </div>
            <div className="flex gap-4 text-xs text-white/40">
              <span>{activeCommunities} communities</span>
              <span>{publishedCourses} courses</span>
            </div>
          </motion.div>
        </Link>
        <Link to="/student">
          <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl border border-violet-500/20 p-5 cursor-pointer hover:border-violet-500/40 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white font-heading">Student Dashboard</p>
                <p className="text-xs text-white/40">Learner experience workspace</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 ml-auto transition-all" />
            </div>
            <div className="flex gap-4 text-xs text-white/40">
              <span>{members.length} enrolled members</span>
              <span>{courses.length} courses available</span>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Communities" value={loading ? '—' : communities.length} icon={Globe} color="emerald" />
        <StatCard label="Total Members" value={loading ? '—' : members.length} icon={Users} color="violet" />
        <StatCard label="Published Courses" value={loading ? '—' : publishedCourses} icon={BookOpen} color="cyan" />
        <StatCard label="Est. Revenue" value={loading ? '—' : `$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="amber" />
      </div>

      {/* Admin Quick Actions */}
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {adminActions.map((action, i) => {
          const c = colorMap[action.color] || colorMap.emerald;
          const Icon = action.icon;
          return (
            <motion.div key={action.path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={action.path}>
                <div className={`glass rounded-2xl border ${c.border} p-5 hover:bg-white/4 transition-all group cursor-pointer`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${c.text}`} />
                    </div>
                    {action.badge !== null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{action.badge}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white mb-0.5 font-heading">{action.label}</p>
                  <p className="text-xs text-white/35">{action.sub}</p>
                  <div className={`flex items-center gap-1 mt-3 text-xs ${c.text} opacity-0 group-hover:opacity-100 transition-all`}>
                    <span>Go to {action.label.split(' ')[0]}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Community Overview */}
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">All Communities</h2>
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-white/4 animate-pulse" />)}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Community</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Members</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Revenue</th>
                <th className="text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {communities.map((comm, i) => {
                const commMembers = members.filter(m => m.community_id === comm.id);
                const revenue = comm.is_paid ? (comm.price || 0) * commMembers.filter(m => m.payment_status === 'paid').length : 0;
                return (
                  <tr key={comm.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-all">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">◈</div>
                        <span className="text-sm text-white font-medium">{comm.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        {comm.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {comm.is_private ? 'Private' : 'Public'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white/60">{comm.member_count || commMembers.length}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${comm.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-white/30'}`}>
                        {comm.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white/60">
                      {comm.is_paid ? <span className="text-amber-400">${revenue}</span> : <span className="text-white/20">Free</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteCommunity(comm.id)}
                        className="p-1.5 text-white/40 hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}