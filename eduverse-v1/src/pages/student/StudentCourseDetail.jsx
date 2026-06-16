import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Play, FileText, HelpCircle, CheckCircle2, ChevronLeft,
  Clock, Loader2, ArrowLeft, Trophy, XCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// ─── Lesson type icon ─────────────────────────────────────────────────────────
function LessonIcon({ type, size = 'w-4 h-4' }) {
  if (type === 'video') return <Play className={`${size} flex-shrink-0`} />;
  if (type === 'quiz') return <HelpCircle className={`${size} flex-shrink-0`} />;
  return <FileText className={`${size} flex-shrink-0`} />;
}

// ─── Video frame ──────────────────────────────────────────────────────────────
function VideoFrame({ url, title }) {
  if (!url) return (
    <div className="w-full aspect-video rounded-2xl bg-black/40 border border-white/8 flex flex-col items-center justify-center gap-3">
      <Play className="w-12 h-12 text-violet-500/30" />
      <p className="text-white/30 text-sm">No video URL set</p>
    </div>
  );

  // Embed YouTube / Vimeo; fallback to <video>
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (ytMatch) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/8">
        <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} title={title}
          className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (vimeoMatch) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/8">
        <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} title={title}
          className="w-full h-full" allowFullScreen />
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/8 bg-black">
      <video src={url} controls className="w-full h-full" title={title} />
    </div>
  );
}

// ─── Quiz pane ────────────────────────────────────────────────────────────────
function QuizPane({ quiz, onPassed }) {
  const questions = quiz?.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSubmit = async () => {
    let earned = 0;
    let total = 0;
    questions.forEach(q => {
      const pts = q.points || 10;
      total += pts;
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const correct = (q.correct_answer || '').trim().toLowerCase();
      if (userAns === correct) earned += pts;
    });
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    setScore(pct);
    setSubmitted(true);
    if (pct >= (quiz.passing_score || 70)) onPassed(pct, quiz);
  };

  if (submitted) {
    const passed = score >= (quiz.passing_score || 70);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center py-16 space-y-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${passed ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
          {passed
            ? <Trophy className="w-10 h-10 text-emerald-400" />
            : <XCircle className="w-10 h-10 text-rose-400" />}
        </div>
        <h3 className="text-2xl font-bold text-white font-heading">{passed ? 'Quiz Passed!' : 'Not Passed'}</h3>
        <p className="text-4xl font-bold" style={{ color: passed ? '#34d399' : '#f87171' }}>{score}%</p>
        <p className="text-white/50 text-sm">Passing score: {quiz.passing_score || 70}%</p>
        {!passed && (
          <button onClick={() => { setAnswers({}); setSubmitted(false); setScore(0); }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/30 transition-all">
            Try Again
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white font-heading">{quiz.title}</h2>
      {questions.map((q, i) => (
        <div key={q.id || i} className="glass rounded-xl border border-white/8 p-5 space-y-3">
          <p className="text-sm font-semibold text-white">
            <span className="text-violet-400 mr-2">Q{i + 1}.</span>{q.question}
          </p>
          {q.type === 'multiple_choice' && (
            <div className="space-y-2">
              {(q.options || []).map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  answers[q.id] === opt
                    ? 'bg-violet-500/15 border-violet-500/40 text-white'
                    : 'bg-black/20 border-white/8 text-white/60 hover:border-white/15 hover:text-white/80'
                }`}>
                  <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                    onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="hidden" />
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: answers[q.id] === opt ? 'rgb(139,92,246)' : 'rgba(255,255,255,0.15)' }}>
                    {answers[q.id] === opt && <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                  </span>
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'true_false' && (
            <div className="flex gap-3">
              {['True', 'False'].map(opt => (
                <label key={opt} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                  answers[q.id] === opt ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-black/20 border-white/8 text-white/50 hover:border-white/15'
                }`}>
                  <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                    onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="hidden" />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {q.type === 'short_answer' && (
            <input type="text" value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Your answer..."
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50" />
          )}
        </div>
      ))}
      <button onClick={handleSubmit} disabled={questions.length === 0}
        className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-violet-500/20">
        Submit Quiz
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentCourseDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [markingDone, setMarkingDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [user, course, lessonList, quizList, progressList] = await Promise.all([
        base44.auth.me(),
        base44.entities.Course.get(id),
        base44.entities.Lesson.filter({ course_id: id }),
        base44.entities.Quiz.filter({ course_id: id }),
        base44.entities.CourseProgress.filter({ course_id: id }),
      ]);
      const sorted = lessonList.sort((a, b) => (a.order || 0) - (b.order || 0));
      const prog = progressList.find(p => p.user_id === user.id) || null;

      setCourse(course);
      setLessons(sorted);
      setQuizzes(quizList);
      setProgress(prog);
      setCurrentUser(user);
      setActiveLesson(sorted[0] || null);
      setLoading(false);
    };
    load();
  }, [id]);

  const completedIds = progress?.completed_lesson_ids || [];
  const isLessonDone = (lessonId) => completedIds.includes(lessonId);

  const getQuizForLesson = (lessonId) => quizzes.find(q => q.lesson_id === lessonId);

  const markLessonComplete = async (lessonId) => {
    if (!currentUser || isLessonDone(lessonId) || markingDone) return;
    setMarkingDone(true);

    const newCompleted = [...completedIds, lessonId];
    const pct = lessons.length > 0 ? Math.round((newCompleted.length / lessons.length) * 100) : 0;
    const allDone = newCompleted.length >= lessons.length;

    let updated;
    if (progress) {
      updated = await base44.entities.CourseProgress.update(progress.id, {
        completed_lesson_ids: newCompleted,
        completion_percentage: pct,
        is_completed: allDone,
        ...(allDone ? { completed_date: format(new Date(), 'yyyy-MM-dd') } : {}),
      });
    } else {
      updated = await base44.entities.CourseProgress.create({
        user_id: currentUser.id,
        course_id: id,
        completed_lesson_ids: newCompleted,
        completion_percentage: pct,
        is_completed: allDone,
        ...(allDone ? { completed_date: format(new Date(), 'yyyy-MM-dd') } : {}),
      });
    }
    setProgress(updated);
    setMarkingDone(false);
  };

  const handleQuizPassed = async (score, quiz) => {
    // Save quiz score to progress
    const quizScores = [...(progress?.quiz_scores || []).filter(s => s.quiz_id !== quiz.id), {
      quiz_id: quiz.id,
      score,
      passed: true,
      points_earned: quiz.points_reward || 0,
    }];

    let updated;
    if (progress) {
      updated = await base44.entities.CourseProgress.update(progress.id, { quiz_scores: quizScores });
    } else {
      updated = await base44.entities.CourseProgress.create({
        user_id: currentUser.id,
        course_id: id,
        completed_lesson_ids: [],
        completion_percentage: 0,
        is_completed: false,
        quiz_scores: quizScores,
      });
    }
    setProgress(updated);
    // Auto-complete the lesson after passing quiz
    if (activeLesson) markLessonComplete(activeLesson.id);
  };

  const goToNext = () => {
    const idx = lessons.findIndex(l => l.id === activeLesson?.id);
    if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
  };

  const goToPrev = () => {
    const idx = lessons.findIndex(l => l.id === activeLesson?.id);
    if (idx > 0) setActiveLesson(lessons[idx - 1]);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="p-8 text-center text-white/40">Course not found.</div>
  );

  const pct = progress?.completion_percentage || 0;
  const isDone = progress?.is_completed;
  const activeIdx = lessons.findIndex(l => l.id === activeLesson?.id);
  const quizForActive = activeLesson?.type === 'quiz' ? getQuizForLesson(activeLesson.id) : null;

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-white/8 bg-background/80 backdrop-blur sticky top-0 z-10">
        <Link to="/student/courses" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Courses
        </Link>
        <div className="flex-1 mx-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-sm font-semibold text-white truncate">{course.title}</h1>
            <span className="text-xs text-white/40 ml-4 flex-shrink-0">{pct}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
        {isDone && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-r border-white/8 overflow-y-auto scrollbar-thin">
          <div className="p-4">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">
              {lessons.length} lessons
            </p>
            <div className="space-y-1">
              {lessons.map((lesson, i) => {
                const done = isLessonDone(lesson.id);
                const active = activeLesson?.id === lesson.id;
                return (
                  <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all group ${
                      active
                        ? 'bg-violet-500/15 border border-violet-500/30'
                        : 'hover:bg-white/4 border border-transparent'
                    }`}>
                    {/* Status dot */}
                    <div className="mt-0.5 flex-shrink-0">
                      {done
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-violet-400' : 'border-white/20'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-violet-400' : 'bg-transparent'}`} />
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${active ? 'text-violet-300' : done ? 'text-white/50' : 'text-white/70'}`}>
                        {i + 1}. {lesson.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <LessonIcon type={lesson.type} size="w-3 h-3" />
                        <span className="text-[10px] text-white/30 capitalize">{lesson.type || 'text'}</span>
                        {lesson.duration_minutes > 0 && (
                          <span className="text-[10px] text-white/25 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{lesson.duration_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {lessons.length === 0 && (
                <p className="text-xs text-white/25 text-center py-8">No lessons yet</p>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main viewer ────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {!activeLesson ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BookOpen className="w-12 h-12 text-violet-500/20 mb-3" />
              <p className="text-white/30">Select a lesson to begin</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeLesson.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }} className="max-w-3xl mx-auto space-y-6">

                {/* Lesson header */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LessonIcon type={activeLesson.type} size="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-violet-400 font-semibold capitalize">{activeLesson.type || 'text'} lesson</span>
                    {activeLesson.duration_minutes > 0 && (
                      <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" />{activeLesson.duration_minutes} min</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white font-heading">{activeLesson.title}</h2>
                </div>

                {/* Video */}
                {activeLesson.type === 'video' && (
                  <VideoFrame url={activeLesson.video_url} title={activeLesson.title} />
                )}

                {/* Text content */}
                {activeLesson.type !== 'quiz' && activeLesson.content && (
                  <div className="glass rounded-2xl border border-white/8 p-6">
                    <div className="prose prose-sm prose-invert max-w-none text-white/75 leading-relaxed whitespace-pre-wrap text-sm">
                      {activeLesson.content}
                    </div>
                  </div>
                )}

                {/* Quiz */}
                {activeLesson.type === 'quiz' && quizForActive && (
                  <QuizPane quiz={quizForActive} onPassed={handleQuizPassed} />
                )}
                {activeLesson.type === 'quiz' && !quizForActive && (
                  <div className="glass rounded-2xl border border-white/8 p-8 text-center">
                    <HelpCircle className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No quiz configured for this lesson</p>
                  </div>
                )}

                {/* Mark complete / nav */}
                <div className="flex items-center justify-between pt-4 border-t border-white/8">
                  <button onClick={goToPrev} disabled={activeIdx === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/80 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-3">
                    {activeLesson.type !== 'quiz' && !isLessonDone(activeLesson.id) && (
                      <button onClick={() => markLessonComplete(activeLesson.id)} disabled={markingDone}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-40 transition-all">
                        {markingDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Mark Complete
                      </button>
                    )}
                    {isLessonDone(activeLesson.id) && (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </span>
                    )}
                  </div>

                  <button onClick={goToNext} disabled={activeIdx === lessons.length - 1}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/80 disabled:opacity-30 transition-all">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}