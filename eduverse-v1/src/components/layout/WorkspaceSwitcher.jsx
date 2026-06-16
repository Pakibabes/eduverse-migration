import { useState, useRef, useEffect } from 'react';
import { ChevronDown, GraduationCap, School, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const workspaces = [
  {
    id: 'admin',
    label: 'Admin Dashboard',
    sub: 'Platform control center',
    icon: ShieldCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  {
    id: 'school',
    label: 'School Dashboard',
    sub: 'Instructor workspace',
    icon: School,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  {
    id: 'student',
    label: 'Education Dashboard',
    sub: 'Education workspace',
    icon: GraduationCap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
  },
];

export default function WorkspaceSwitcher({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const currentWs = workspaces.find(w => w.id === current) || workspaces[0];
  const Icon = currentWs.icon;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative px-3 py-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${currentWs.bg} ${currentWs.border} hover:opacity-90`}
      >
        <div className={`w-8 h-8 rounded-lg ${currentWs.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${currentWs.color}`} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-white truncate">{currentWs.label}</p>
          <p className="text-[10px] text-white/40 truncate">{currentWs.sub}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-3 right-3 top-full mt-2 z-50 rounded-xl border border-white/10 overflow-hidden"
            style={{ background: 'rgba(15, 20, 40, 0.97)', backdropFilter: 'blur(20px)' }}
          >
            <div className="p-1.5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 py-1.5">Switch workspace</p>
              {workspaces.map(ws => {
                const WsIcon = ws.icon;
                const isActive = ws.id === current;
                return (
                  <button
                    key={ws.id}
                    onClick={() => { onChange(ws.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${isActive ? ws.bg : 'hover:bg-white/5'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ws.bg}`}>
                      <WsIcon className={`w-3.5 h-3.5 ${ws.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>{ws.label}</p>
                      <p className="text-[10px] text-white/30">{ws.sub}</p>
                    </div>
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${ws.dot}`} />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-white/5 p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-white/30">
                <ArrowLeftRight className="w-3 h-3" />
                <span className="text-[10px]">Everyone can switch (demo mode)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}