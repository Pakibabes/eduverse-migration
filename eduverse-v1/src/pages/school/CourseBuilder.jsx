import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import GlassButton from '@/components/ui/GlassButton';
import { Plus, Trash2, Sparkles, Save, ArrowLeft, BookOpen, Globe, Lock, DollarSign, Eye, EyeOff, ChevronDown, ChevronUp, X, Check, LayoutTemplate } from 'lucide-react';
import { AnimatePresence as AP2 } from 'framer-motion';
import TemplatePickerModal from '@/components/templates/TemplatePickerModal';
import { motion, AnimatePresence } from 'framer-motion';

function LessonItem({ lesson, index, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl border border-white/8 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-all">
        <span className="text-xs font-bold text-white/20 w-5">L{index + 1}</span>
        <span className="flex-1 text-sm font-medium text-white">{lesson.title || `Lesson ${index + 1}`}</span>
        <span className="text-xs text-white/30 capitalize">{lesson.type}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }} className="text-white/20 hover:text-rose-400 transition-colors mr-2">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/6 p-4 space-y-3">
            <input value={lesson.title} onChange={e => onUpdate(lesson.id, { title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
              placeholder="Lesson title" />
            <select value={lesson.type} onChange={e => onUpdate(lesson.id, { type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
            </select>
            <textarea value={lesson.content || ''} onChange={e => onUpdate(lesson.id, { content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-28"
              placeholder="Lesson content..." />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState({ title: '', description: '', status: 'draft', is_public: true, is_paid: false, price: 0 });
  const [lessons, setLessons] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedComms, setSelectedComms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [categories, setCategories] = useState([]);
  const [schools, setSchools] = useState([]);
  const countries = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];

  useEffect(() => {
    Promise.all([
      base44.entities.Community.list(),
      base44.entities.CareerCategory.list(),
      base44.entities.School.list(),
    ]).then(([c, cats, sch]) => {
      setCommunities(c);
      setCategories(cats.filter(cat => cat.status === 'active'));
      setSchools(sch);
    });
    if (id) {
      Promise.all([base44.entities.Course.get(id), base44.entities.Lesson.filter({ course_id: id })]).then(([c, l]) => {
        if (c) { setCourse(c); setSelectedComms(c.community_ids || []); }
        setLessons(l.sort((a, b) => (a.order || 0) - (b.order || 0)));
      });
    }
  }, [id]);

  const addLesson = async () => {
    const lesson = await base44.entities.Lesson.create({ course_id: id || 'temp', title: `Lesson ${lessons.length + 1}`, type: 'text', order: lessons.length });
    setLessons(prev => [...prev, lesson]);
  };

  const updateLesson = (lessonId, data) => {
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, ...data } : l));
  };

  const deleteLesson = async (lessonId) => {
    await base44.entities.Lesson.delete(lessonId);
    setLessons(prev => prev.filter(l => l.id !== lessonId));
  };

  const generateLessons = async () => {
    if (!aiTopic) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a structured course outline for: "${aiTopic}". Create 5-6 lessons with titles and detailed content for each lesson.`,
      response_json_schema: {
        type: 'object',
        properties: {
          lessons: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, type: { type: 'string' } } } }
        }
      }
    });
    const courseId = id || 'temp';
    const newLessons = await Promise.all((res.lessons || []).map((l, i) =>
      base44.entities.Lesson.create({ course_id: courseId, title: l.title, content: l.content, type: l.type || 'text', order: lessons.length + i })
    ));
    setLessons(prev => [...prev, ...newLessons]);
    setAiTopic('');
    setAiLoading(false);
  };

  const applyTemplate = (template) => {
    setCourse(prev => ({
      ...prev,
      title: template.course_title || prev.title,
      description: template.course_description || prev.description,
      is_paid: template.is_paid ?? prev.is_paid,
      price: template.price ?? prev.price,
      is_public: template.is_public ?? prev.is_public,
    }));
    // Convert template modules to lessons (staged locally, saved on Save)
    const newLessons = (template.modules || []).map((m, i) => ({
      id: `temp-${Date.now()}-${i}`,
      title: m.title,
      type: m.type || 'text',
      content: m.content || '',
      duration_minutes: m.duration_minutes || 0,
      order: lessons.length + i,
      course_id: id || 'temp',
    }));
    setLessons(prev => [...prev, ...newLessons]);
    setShowTemplatePicker(false);
  };

  const saveAsTemplate = async () => {
    setSavingTemplate(true);
    const name = prompt('Template name:', course.title || 'New Template');
    if (name) {
      await base44.entities.CourseTemplate.create({
        name,
        description: `Template from: ${course.title}`,
        course_title: course.title,
        course_description: course.description,
        is_paid: course.is_paid,
        price: course.price,
        is_public: course.is_public,
        modules: lessons.map((l, i) => ({
          title: l.title,
          type: l.type,
          content: l.content || '',
          duration_minutes: l.duration_minutes || 0,
          order: i,
        })),
      });
    }
    setSavingTemplate(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const data = { ...course, community_ids: selectedComms, total_lessons: lessons.length };
    if (id) {
      await base44.entities.Course.update(id, data);
      await Promise.all(lessons.map(l => base44.entities.Lesson.update(l.id, l)));
    } else {
      const created = await base44.entities.Course.create(data);
      await Promise.all(lessons.map(l => base44.entities.Lesson.update(l.id, { course_id: created.id })));
    }
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-heading text-white">{id ? 'Edit Course' : 'New Course'}</h1>
          <p className="text-sm text-white/40">Build your course content</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <GlassButton variant="secondary" onClick={() => setShowTemplatePicker(true)}>
            <LayoutTemplate className="w-4 h-4" />Use Template
          </GlassButton>
          <GlassButton variant="secondary" onClick={saveAsTemplate} disabled={savingTemplate}>
            <Save className="w-4 h-4" />{savingTemplate ? 'Saving...' : 'Save as Template'}
          </GlassButton>
          <GlassButton variant={course.status === 'published' ? 'secondary' : 'primary'} onClick={() => setCourse(prev => ({ ...prev, status: prev.status === 'published' ? 'draft' : 'published' }))}>
            {course.status === 'published' ? <><EyeOff className="w-4 h-4" />Unpublish</> : <><Eye className="w-4 h-4" />Publish</>}
          </GlassButton>
          <GlassButton onClick={handleSave} disabled={loading}>
            {saved ? <><Check className="w-4 h-4 text-emerald-400" />Saved!</> : <><Save className="w-4 h-4" />Save</>}
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Course info */}
          <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white font-heading">Course Details</h2>
            <input value={course.title} onChange={e => setCourse({...course, title: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-semibold text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 font-heading"
              placeholder="Course title..." />
            <textarea value={course.description || ''} onChange={e => setCourse({...course, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-24"
              placeholder="Course description..." />
          </div>

          {/* AI Lesson Generator */}
          <div className="glass rounded-2xl border border-violet-500/15 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white font-heading">AI Lesson Generator</h2>
            </div>
            <div className="flex gap-2">
              <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                className="flex-1 bg-white/5 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50"
                placeholder="Describe a topic to generate lessons automatically..." />
              <GlassButton variant="primary-violet" onClick={generateLessons} disabled={aiLoading || !aiTopic}>
                {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </GlassButton>
            </div>
          </div>

          {/* Lessons */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white font-heading">Lessons ({lessons.length})</h2>
              <GlassButton size="sm" variant="secondary" onClick={addLesson}><Plus className="w-3.5 h-3.5" />Add Lesson</GlassButton>
            </div>
            {lessons.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-10 h-10 text-emerald-500/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm mb-3">No lessons yet</p>
                <div className="flex gap-2 justify-center">
                  <GlassButton size="sm" onClick={addLesson}><Plus className="w-3.5 h-3.5" />Add Lesson</GlassButton>
                  <GlassButton size="sm" variant="secondary" onClick={() => setAiTopic('Introduction to this course')}>
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />Generate with AI
                  </GlassButton>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, i) => (
                  <LessonItem key={lesson.id} lesson={lesson} index={i} onUpdate={updateLesson} onDelete={deleteLesson} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-4">
          {/* Visibility */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Visibility</h3>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: true, l: 'Public', icon: Globe }, { v: false, l: 'Private', icon: Lock }].map(opt => (
                <button key={String(opt.v)} onClick={() => setCourse({...course, is_public: opt.v})}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${course.is_public === opt.v ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  <opt.icon className="w-3.5 h-3.5" />{opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Monetization */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Monetization</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/70 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-amber-400" />Paid Course</span>
              <button onClick={() => setCourse({...course, is_paid: !course.is_paid})}
                className={`w-10 h-5 rounded-full transition-all relative ${course.is_paid ? 'bg-emerald-500' : 'bg-white/15'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${course.is_paid ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {course.is_paid && (
              <input type="number" value={course.price} onChange={e => setCourse({...course, price: parseFloat(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="Price ($)" />
            )}
          </div>

          {/* Communities */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Assign to Communities</h3>
            <div className="space-y-1.5">
              {communities.map(c => (
                <label key={c.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/4 cursor-pointer transition-all">
                  <input type="checkbox" checked={selectedComms.includes(c.id)}
                    onChange={e => setSelectedComms(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))}
                    className="w-3.5 h-3.5 rounded accent-emerald-500" />
                  <span className="text-sm text-white/60">{c.name}</span>
                </label>
              ))}
              {communities.length === 0 && <p className="text-xs text-white/25">No communities yet</p>}
            </div>
          </div>

          {/* Access Control */}
          <div className="glass rounded-2xl border border-white/8 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Access Control</h3>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Category <span className="text-white/20">(optional)</span></label>
              <select value={course.category_id || ''} onChange={e => setCourse({...course, category_id: e.target.value || null})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Country <span className="text-white/20">(optional)</span></label>
              <select value={course.country || ''} onChange={e => setCourse({...course, country: e.target.value || null})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                <option value="">Select country...</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">School <span className="text-white/20">(optional)</span></label>
              <select value={course.school_id || ''} onChange={e => setCourse({...course, school_id: e.target.value || null})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                <option value="">Select school...</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Type */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Type</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/6 hover:bg-white/3 transition-all">
                <div>
                  <span className="text-sm text-white/70">Enrollment Course</span>
                  {course.is_enrollment && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">Enrollment</span>}
                </div>
                <button onClick={() => setCourse({...course, is_enrollment: !course.is_enrollment, is_onboarding: course.is_enrollment ? course.is_onboarding : false})}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${course.is_enrollment ? 'bg-amber-500' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${course.is_enrollment ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/6 hover:bg-white/3 transition-all">
                <div>
                  <span className="text-sm text-white/70">Onboarding Course</span>
                  {course.is_onboarding && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">Onboarding</span>}
                </div>
                <button onClick={() => setCourse({...course, is_onboarding: !course.is_onboarding, is_enrollment: course.is_onboarding ? course.is_enrollment : false})}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${course.is_onboarding ? 'bg-emerald-500' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${course.is_onboarding ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-2">Tag this course for use in internship workflows</p>
          </div>

          {/* Status */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Status</h3>
            <div className="space-y-1.5">
              {['draft', 'published', 'archived'].map(s => (
                <button key={s} onClick={() => setCourse({...course, status: s})}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm capitalize transition-all text-left ${course.status === s ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400' : 'border-white/6 text-white/40 hover:border-white/15'}`}>
                  {course.status === s && <Check className="w-3.5 h-3.5" />}
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTemplatePicker && <TemplatePickerModal onSelect={applyTemplate} onClose={() => setShowTemplatePicker(false)} />}
      </AnimatePresence>
    </div>
  );
}