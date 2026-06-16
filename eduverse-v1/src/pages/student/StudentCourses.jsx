import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, CheckCircle2, Clock, Lock, Play, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { filterEntitiesByUserAccess } from '@/lib/communityFilter';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      Promise.all([base44.entities.Course.list(), base44.entities.CourseProgress.list()]).then(([co, p]) => {
        // Filter courses by user's categories and country
        const filteredCourses = filterEntitiesByUserAccess(co.filter(c => c.status === 'published' || c.status === 'draft'), user);
        setCourses(filteredCourses);
        setProgress(p);
        setLoading(false);
      });
    });
  }, []);

  const getProgress = (courseId) => progress.find(p => p.course_id === courseId);

  const filtered = courses.filter(c => {
    if (filter === 'in_progress') return getProgress(c.id) && !getProgress(c.id)?.is_completed;
    if (filter === 'completed') return getProgress(c.id)?.is_completed;
    return true;
  });

  return (
    <div className="p-8">
      <PageHeader title="My Courses" subtitle="Track your learning progress" />

      <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit mb-6">
        {[{ v: 'all', l: 'All Courses' }, { v: 'in_progress', l: 'In Progress' }, { v: 'completed', l: 'Completed' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.v ? 'bg-violet-500/20 text-violet-400' : 'text-white/40 hover:text-white/60'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course, i) => {
            const prog = getProgress(course.id);
            const pct = prog?.completion_percentage || 0;
            const done = prog?.is_completed;
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl border border-white/8 overflow-hidden hover:border-violet-500/20 transition-all group">
                <div className="h-36 relative bg-gradient-to-br from-violet-900/30 to-cyan-900/20">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-violet-500/20" />
                    </div>
                  )}
                  {done && (
                    <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                  )}
                  {course.is_paid && !prog && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                  {!done && pct > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white font-heading mb-1 truncate">{course.title}</h3>
                  <p className="text-xs text-white/30 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.total_lessons || 0}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.estimated_hours || 0}h</span>
                      {pct > 0 && !done && <span className="text-violet-400">{pct}%</span>}
                      {done && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Done</span>}
                    </div>
                    <Link to={`/student/courses/${course.id}`}>
                      <GlassButton size="sm" variant={done ? 'secondary' : 'primary-violet'}>
                        {done ? 'Review' : pct > 0 ? 'Continue' : 'Start'} <ArrowRight className="w-3 h-3" />
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <BookOpen className="w-12 h-12 text-violet-500/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No courses found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}