import { Link } from 'react-router-dom';
import { BookOpen, Clock, Play, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CourseProgressCard({ course, progress, iconColor, accentColor }) {
  if (!course) return null;

  const pct = progress?.completion_percentage || 0;
  const isDone = progress?.is_completed;

  const accentBg = accentColor === 'violet' ? 'from-violet-500 to-purple-400' : 'from-amber-400 to-orange-400';
  const accentBorder = accentColor === 'violet' ? 'border-violet-500/20' : 'border-amber-500/20';
  const btnBg = accentColor === 'violet'
    ? 'bg-violet-500 hover:bg-violet-400 shadow-violet-500/20'
    : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20';

  return (
    <div className={`glass rounded-2xl border overflow-hidden ${accentBorder} transition-all`}>
      {/* Thumbnail */}
      <div className="h-40 relative bg-gradient-to-br from-black/60 to-black/30">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-14 h-14 text-white/10" />
          </div>
        )}
        {isDone && (
          <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        )}
        {/* Progress overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
          <div className={`h-full bg-gradient-to-r ${accentBg} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading mb-1">{course.title}</h3>
          {course.description && (
            <p className="text-xs text-white/45 line-clamp-2 leading-relaxed">{course.description}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-white/35">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {course.total_lessons || 0} lessons
          </span>
          {course.estimated_hours > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {course.estimated_hours}h
            </span>
          )}
          <span className="ml-auto font-semibold" style={{ color: accentColor === 'violet' ? '#a78bfa' : '#fbbf24' }}>
            {pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${accentBg} transition-all`}
            style={{ width: `${pct}%` }} />
        </div>

        {/* Action */}
        <Link to={`/student/courses/${course.id}`}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm transition-all shadow-lg ${btnBg}`}>
          {isDone ? 'Review' : pct > 0 ? 'Continue' : 'Start'}
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>
    </div>
  );
}