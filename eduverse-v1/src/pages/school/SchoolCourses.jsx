import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Plus, Search, BookOpen, Clock, Users, Lock, Globe, Zap, ArrowRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function AIAssistPanel({ onResult, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert course designer. Given this topic: "${prompt}", generate a structured course outline with:
1. A course title
2. A compelling description (2-3 sentences)
3. 5-7 modules/lessons with titles and brief descriptions
4. Estimated total hours

Respond in JSON format: { title, description, modules: [{title, description, duration_minutes}], total_hours }`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          modules: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, duration_minutes: { type: 'number' } } } },
          total_hours: { type: 'number' }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-2xl border border-violet-500/20 p-6 z-10 max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{ background: 'rgba(12, 16, 36, 0.98)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-heading">AI Course Builder</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Describe your course topic</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full bg-white/5 border border-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 resize-none h-24"
            placeholder="e.g. 'AI Content Creation for Social Media Marketers' or 'Python for Beginners with hands-on projects'"
          />
        </div>

        <GlassButton variant="primary-violet" onClick={handleGenerate} disabled={loading} className="w-full justify-center mb-6">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating outline...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Course Outline</>
          )}
        </GlassButton>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-xl bg-violet-500/8 border border-violet-500/15">
              <h3 className="font-semibold text-white font-heading mb-1">{result.title}</h3>
              <p className="text-sm text-white/50">{result.description}</p>
              <p className="text-xs text-violet-400 mt-2">⏱ ~{result.total_hours} hours estimated</p>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Generated Modules</p>
              <div className="space-y-2">
                {result.modules?.map((mod, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/4 border border-white/6">
                    <span className="text-xs font-bold text-violet-400/60 w-5 flex-shrink-0">M{i+1}</span>
                    <div>
                      <p className="text-sm font-medium text-white/80">{mod.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">{mod.description} · {mod.duration_minutes}min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <GlassButton onClick={() => { onResult(result); onClose(); }} className="w-full justify-center">
              Use This Outline →
            </GlassButton>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function SchoolCourses() {
  const [courses, setCourses] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([base44.entities.Course.list(), base44.entities.Community.list()]).then(([co, c]) => {
      setCourses(co);
      setCommunities(c);
      setLoading(false);
    });
  }, []);

  const handleAIResult = async (outline) => {
    const course = await base44.entities.Course.create({
      title: outline.title,
      description: outline.description,
      status: 'draft',
      total_lessons: outline.modules?.length || 0,
      estimated_hours: outline.total_hours || 0,
      is_public: true,
    });
    setCourses(prev => [course, ...prev]);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all courses? This cannot be undone.')) return;
    await base44.functions.invoke('deleteAllCourses', {});
    setCourses([]);
  };

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const statusColor = { draft: 'text-amber-400 bg-amber-500/10', published: 'text-emerald-400 bg-emerald-500/10', archived: 'text-white/30 bg-white/5' };

  return (
    <div className="p-8">
      <PageHeader
        title="Courses"
        subtitle="Build and manage your course library"
        action={
          <div className="flex gap-2">
            {courses.length > 0 && <GlassButton variant="danger" onClick={handleDeleteAll}>Delete All</GlassButton>}
            <GlassButton variant="secondary" onClick={() => setShowAI(true)}>
              <Sparkles className="w-4 h-4 text-violet-400" /> AI Assist
            </GlassButton>
            <Link to="/admin/courses/builder">
              <GlassButton><Plus className="w-4 h-4" />New Course</GlassButton>
            </Link>
          </div>
        }
      />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="glass w-full border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-emerald-500/50 transition-all hover:border-white/12"
            placeholder="Search courses..." />
        </div>
        <div className="glass flex gap-1 p-1 rounded-xl border border-white/8 hover:border-white/12 transition-all">
           {['all', 'draft', 'published', 'archived'].map(f => (
             <button key={f} onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'}`}>
               {f}
             </button>
           ))}
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl border border-white/8 overflow-hidden hover:border-emerald-500/20 transition-all group">
              <div className="h-36 bg-gradient-to-br from-emerald-900/30 to-slate-900/50 relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-emerald-500/20" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[course.status] || statusColor.draft}`}>
                    {course.status}
                  </span>
                </div>
                {course.is_linked && (
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">Linked</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white font-heading mb-1 truncate">{course.title}</h3>
                <p className="text-xs text-white/30 mb-3 line-clamp-2">{course.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.total_lessons || 0} lessons</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.estimated_hours || 0}h</span>
                    {course.is_paid && <span className="text-amber-400">${course.price}</span>}
                  </div>
                  <Link to={`/admin/courses/builder/${course.id}`}>
                    <GlassButton size="sm" variant="secondary">Edit <ArrowRight className="w-3 h-3" /></GlassButton>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          <motion.button onClick={() => setShowAI(true)}
            className="glass rounded-2xl border border-dashed border-violet-500/20 p-5 hover:border-violet-500/40 hover:bg-violet-500/4 transition-all flex flex-col items-center justify-center gap-3 min-h-[220px] group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm text-white/30 group-hover:text-violet-400 transition-all">Create with AI</span>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showAI && <AIAssistPanel onResult={handleAIResult} onClose={() => setShowAI(false)} />}
      </AnimatePresence>
    </div>
  );
}