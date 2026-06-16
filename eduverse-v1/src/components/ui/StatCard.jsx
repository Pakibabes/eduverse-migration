import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, color = 'emerald', trend, sub }) {
  const colors = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'shadow-violet-500/10' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
  };
  const c = colors[color] || colors.emerald;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border ${c.border} p-5 glass`}
      style={{ boxShadow: `0 4px 24px rgba(0,0,0,0.2)` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold font-heading text-white">{value}</p>
          {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
        )}
      </div>
      {/* Decorative glow */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${c.bg} rounded-full blur-2xl opacity-40`} />
    </motion.div>
  );
}