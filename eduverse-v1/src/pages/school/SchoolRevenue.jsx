import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, Users, CreditCard, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const mockMonthly = [
  { month: 'Jan', revenue: 1200 }, { month: 'Feb', revenue: 1800 }, { month: 'Mar', revenue: 2400 },
  { month: 'Apr', revenue: 1900 }, { month: 'May', revenue: 3200 }, { month: 'Jun', revenue: 2800 },
];

export default function SchoolRevenue() {
  const [communities, setCommunities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([base44.entities.Community.list(), base44.entities.CommunityMember.list()]).then(([c, m]) => {
      setCommunities(c);
      setMembers(m);
      setLoading(false);
    });
  }, []);

  const paidComms = communities.filter(c => c.is_paid);
  const paidMembers = members.filter(m => m.payment_status === 'paid');
  const estRevenue = paidComms.reduce((acc, c) => acc + (c.price * members.filter(m => m.community_id === c.id && m.payment_status === 'paid').length), 0);

  return (
    <div className="p-8">
      <PageHeader title="Revenue" subtitle="Monetization overview and analytics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Est. Revenue" value={`$${estRevenue.toLocaleString()}`} icon={DollarSign} color="emerald" />
        <StatCard label="Paid Members" value={paidMembers.length} icon={Users} color="cyan" />
        <StatCard label="Paid Communities" value={paidComms.length} icon={CreditCard} color="violet" />
        <StatCard label="Avg. per Member" value={paidMembers.length ? `$${(estRevenue / paidMembers.length).toFixed(0)}` : '$0'} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
          <h2 className="text-base font-semibold text-white font-heading mb-6">Revenue Trend</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMonthly} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'rgba(12,16,36,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={v => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="rgba(52,211,153,0.7)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-400/80">Live payments require Stripe integration. Connect Stripe in Settings to accept real payments.</p>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/8 p-6">
          <h2 className="text-sm font-semibold text-white font-heading mb-4">Paid Communities</h2>
          {paidComms.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">No paid communities yet</p>
          ) : (
            <div className="space-y-3">
              {paidComms.map(comm => {
                const commPaidMembers = members.filter(m => m.community_id === comm.id && m.payment_status === 'paid');
                const commRevenue = comm.price * commPaidMembers.length;
                return (
                  <div key={comm.id} className="p-3 rounded-xl bg-white/4 border border-white/6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white truncate">{comm.name}</p>
                      <span className="text-xs font-bold text-emerald-400">${commRevenue}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/30">
                      <span>{commPaidMembers.length} paid members</span>
                      <span>${comm.price}/{comm.billing_type?.replace('_', '-')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}