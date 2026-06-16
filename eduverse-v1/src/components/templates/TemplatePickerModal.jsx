import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, BookOpen, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';

export default function TemplatePickerModal({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.CourseTemplate.list().then(t => { setTemplates(t); setLoading(false); });
  }, []);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl rounded-2xl border border-emerald-500/20 z-10 max-h-[80vh] overflow-hidden flex flex-col"
        style={{ background: 'rgba(12, 16, 36, 0.98)' }}>

        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-base font-bold text-white font-heading">Use a Template</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 border-b border-white/8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/40"
              placeholder="Search templates..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">{templates.length === 0 ? 'No templates saved yet' : 'No templates match your search'}</p>
            </div>
          ) : filtered.map(t => (
            <button key={t.id} onClick={() => onSelect(t)}
              className="w-full text-left p-4 rounded-xl border border-white/8 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{t.description || t.course_description || 'No description'}</p>
                <p className="text-xs text-emerald-400/60 mt-1">{(t.modules || []).length} modules</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-2.5" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}