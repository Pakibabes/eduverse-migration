import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Code, Sparkles, ArrowLeft, ArrowRight, CheckCircle, Plus, Edit3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const SKILL_FIELD_MAP = {
  programming: { label: 'Programming Languages', icon: Code, color: 'from-blue-500 to-cyan-500', fields: ['programming_languages'] },
  ai: { label: 'AI & Machine Learning', icon: Sparkles, color: 'from-violet-500 to-purple-500', fields: ['ai_tools_used', 'ai_familiarity'] },
  nocode: { label: 'No-Code & Automation', icon: Zap, color: 'from-amber-500 to-orange-500', fields: ['nocode_tools', 'nocode_familiarity'] },
};

const CATEGORY_SKILL_MAP = {
  'it': { label: 'IT', icon: Code, color: 'from-blue-500 to-cyan-500' },
  'programming': { label: 'Programming', icon: Code, color: 'from-blue-500 to-cyan-500' },
  'ai': { label: 'AI & Machine Learning', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
  'nocode': { label: 'No-Code & Automation', icon: Zap, color: 'from-amber-500 to-orange-500' },
};

const STEPS = [
  'Applicant Type',
  'Education',
  'Tech Skills',
  'AI & No-Code',
  'Goals',
  'Availability',
  'Confirm',
];

const FIELD = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs text-white/50 font-medium">
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

const INPUT = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60" />
);

const SELECT = ({ value, onChange, options, placeholder = 'Please Select' }) => (
  <select value={value} onChange={onChange}
    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);

const TEXTAREA = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 resize-none" />
);

const StepCard = ({ title, subtitle, required, children }) => (
  <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-white font-heading">
        {title} {required && <span className="text-rose-400">*</span>}
      </h3>
      {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default function SkillsSection() {
  const [skills, setSkills] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasApplications, setHasApplications] = useState(false);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [requestingSkill, setRequestingSkill] = useState(false);
  const [applyingForCategory, setApplyingForCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  
  const [form, setForm] = useState({
    applicant_type: 'student',
    current_school: '',
    years_in_university: '',
    graduation_year: '',
    major: '',
    education_level: '',
    dev_role: '',
    ai_familiarity: '',
    programming_languages: '',
    ai_tools_used: '',
    nocode_familiarity: '',
    nocode_tools: '',
    ai_projects_description: '',
    internship_goals: '',
    ai_fields_interest: '',
    ai_career_plan: '',
    weekly_hours_commitment: '',
    available_remote: '',
    scheduling_limitations: '',
    accuracy_confirmed: false
  });

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await base44.auth.me();
        const fullUser = await base44.entities.User.get(currentUser?.id);
        setUser(fullUser);
        
        const [apps, profile, categories] = await Promise.all([
          base44.entities.InternshipApplication.filter({ student_id: currentUser?.id }),
          base44.entities.UserProfile.filter({ user_id: currentUser?.id }),
          base44.entities.CareerCategory.filter({ status: 'active' })
        ]);
        
        setAllCategories(categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        setHasApplications(apps.length > 0);
        setUserProfile(profile[0] || null);
        
        const extracted = {};
        
        apps.forEach(app => {
          Object.entries(SKILL_FIELD_MAP).forEach(([key, fieldConfig]) => {
            if (!extracted[key]) extracted[key] = new Set();
            fieldConfig.fields.forEach(field => {
              const value = app[field];
              if (value && typeof value === 'string') {
                value.split(/[,;]/).forEach(v => {
                  const trimmed = v.trim();
                  if (trimmed) extracted[key].add(trimmed);
                });
              }
            });
          });
        });

        Object.keys(extracted).forEach(k => {
          extracted[k] = Array.from(extracted[k]);
        });
        
        setSkills(extracted);
        setLoading(false);
      } catch (err) {
        console.error('SkillsSection user load error:', err);
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const prev = () => setStep(s => Math.max(0, s - 1));
  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const isStudent = form.applicant_type === 'student';

  const handleSubmit = async () => {
    if (!form.accuracy_confirmed) { toast.error('Please confirm accuracy'); return; }
    setSubmitting(true);

    try {
      if (userProfile) {
        await base44.entities.UserProfile.update(userProfile.id, {
          ...userProfile,
          education_level: form.education_level,
          major: form.major,
          school_name: form.current_school,
          graduation_year: form.graduation_year
        });
      } else {
        await base44.entities.UserProfile.create({
          user_id: user.id,
          education_level: form.education_level,
          major: form.major,
          school_name: form.current_school,
          graduation_year: form.graduation_year
        });
      }
      toast.success('Skills profile saved!');
      setEditing(false);
      setStep(0);
      // Reset form but keep viewing the category
      if (!viewingCategory) {
        // If not in popup, close everything
      }
    } catch (err) {
      toast.error('Failed to save');
    }
    setSubmitting(false);
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <StepCard title="Are you a student or a professional?" required>
          <SELECT value={form.applicant_type} onChange={e => set('applicant_type', e.target.value)}
            placeholder="Please Select"
            options={[{ value: 'student', label: 'Student' }, { value: 'professional', label: 'Professional' }]} />
        </StepCard>
      );

      case 1: return isStudent ? (
        <StepCard title="Education & Background" subtitle="Answer questions below">
          <FIELD label="Current School?"><INPUT value={form.current_school} onChange={e => set('current_school', e.target.value)} placeholder="" /></FIELD>
          <FIELD label="How many years have you been in university?"><INPUT value={form.years_in_university} onChange={e => set('years_in_university', e.target.value)} placeholder="" /></FIELD>
          <FIELD label="What is your Expected Graduation Year?"><INPUT value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="" /></FIELD>
          <FIELD label="What is your Major?"><INPUT value={form.major} onChange={e => set('major', e.target.value)} placeholder="" /></FIELD>
        </StepCard>
      ) : (
        <StepCard title="Employment, Education & Background" subtitle="Answer questions below">
          <FIELD label="What is your Current Level of Education?"><INPUT value={form.education_level} onChange={e => set('education_level', e.target.value)} placeholder="" /></FIELD>
          <FIELD label="What is your Major?"><INPUT value={form.major} onChange={e => set('major', e.target.value)} placeholder="" /></FIELD>
        </StepCard>
      );

      case 2: return (
        <>
          <StepCard title="Are you mainly a Frontend developer, backend developer, Full Stack, or nothing yet?" required>
            <SELECT value={form.dev_role} onChange={e => set('dev_role', e.target.value)}
              options={['Frontend Developer', 'Backend Developer', 'Full Stack', 'Nothing yet']} />
          </StepCard>
          <StepCard title="AI & Technical Skills" subtitle="Answer questions below">
            <FIELD label="How familiar are you with AI and machine learning?">
              <SELECT value={form.ai_familiarity} onChange={e => set('ai_familiarity', e.target.value)}
                options={['Not familiar', 'Slightly familiar', 'Moderately familiar', 'Very familiar', 'Expert']} />
            </FIELD>
            <FIELD label="What programming languages do you know?">
              <INPUT value={form.programming_languages} onChange={e => set('programming_languages', e.target.value)} placeholder="e.g. Python, JavaScript, Java..." />
            </FIELD>
            <FIELD label="Have you worked with AI tools before?">
              <SELECT value={form.ai_tools_used} onChange={e => set('ai_tools_used', e.target.value)}
                options={['Yes', 'No']} />
            </FIELD>
          </StepCard>
        </>
      );

      case 3: return (
        <>
          <StepCard title="No-Code Tools & CRM's" subtitle="Answer questions below">
            <FIELD label="How familiar are you with No-Code Automation tools and CRMs?">
              <SELECT value={form.nocode_familiarity} onChange={e => set('nocode_familiarity', e.target.value)}
                options={['Not familiar', 'Slightly familiar', 'Moderately familiar', 'Very familiar', 'Expert']} />
            </FIELD>
            <FIELD label="What No-Code Automation tools and CRMs are you familiar with?">
              <INPUT value={form.nocode_tools} onChange={e => set('nocode_tools', e.target.value)} placeholder="e.g. Zapier, HubSpot, Airtable..." />
            </FIELD>
          </StepCard>
          <StepCard title="Describe any AI-related projects or experience you have (skip if none)">
            <TEXTAREA value={form.ai_projects_description} onChange={e => set('ai_projects_description', e.target.value)} rows={5} />
          </StepCard>
        </>
      );

      case 4: return (
        <StepCard title="Internship Goals & Interests" subtitle="Answer questions below">
          <FIELD label="What are you hoping to gain from this AI internship?">
            <INPUT value={form.internship_goals} onChange={e => set('internship_goals', e.target.value)} placeholder="" />
          </FIELD>
          <FIELD label="Which AI fields interest you the most?">
            <SELECT value={form.ai_fields_interest} onChange={e => set('ai_fields_interest', e.target.value)}
              options={['Machine Learning', 'Natural Language Processing', 'Computer Vision', 'Data Science', 'AI Automation', 'Robotics', 'Other']} />
          </FIELD>
          <FIELD label="How do you plan to apply AI in your career?">
            <INPUT value={form.ai_career_plan} onChange={e => set('ai_career_plan', e.target.value)} placeholder="" />
          </FIELD>
        </StepCard>
      );

      case 5: return (
        <StepCard title="Availability & Commitment" required>
          <div className="grid grid-cols-2 gap-4">
            <FIELD label="How many hours per week can you commit?">
              <SELECT value={form.weekly_hours_commitment} onChange={e => set('weekly_hours_commitment', e.target.value)}
                options={['5-10 hours', '10-15 hours', '15-20 hours', '20-30 hours', '30+ hours']} />
            </FIELD>
            <FIELD label="Are you available for remote work?">
              <SELECT value={form.available_remote} onChange={e => set('available_remote', e.target.value)}
                options={['Yes', 'No', 'Hybrid']} />
            </FIELD>
          </div>
          <FIELD label="Do you have any scheduling preferences or limitations?">
            <INPUT value={form.scheduling_limitations} onChange={e => set('scheduling_limitations', e.target.value)} placeholder="" />
          </FIELD>
        </StepCard>
      );

      case 6: return (
        <StepCard title="I confirm that all information provided is accurate" required>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/20 bg-black/20 cursor-pointer">
            <input type="checkbox" checked={form.accuracy_confirmed} onChange={e => set('accuracy_confirmed', e.target.checked)}
              className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-white/70">Yes</span>
          </label>
        </StepCard>
      );

      default: return null;
    }
  };

  if (loading) {
    return <div className="glass rounded-2xl border border-white/8 p-6 h-32 animate-pulse" />;
  }

  if (viewingCategory) {
    const category = allCategories.find(c => c.id === viewingCategory);
    if (!category) return null;
    
    const handleEditInPopup = () => {
      setEditing(true);
      setStep(0);
    };

    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setViewingCategory(null); setEditing(false); }} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] rounded-2xl border border-white/10 p-8 space-y-6 flex flex-col overflow-y-auto" style={{ background: 'rgba(10,14,32,0.98)' }}>
            {!editing && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white font-heading">{category?.name}</h3>
                        <p className="text-xs text-white/40 mt-0.5">Update your expertise</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setViewingCategory(null)} className="text-white/30 hover:text-white/60 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {!editing ? (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Current Skills</p>
                  {(skills[viewingCategory] || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(skills[viewingCategory] || []).map((skill, i) => (
                        <motion.span key={skill} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                          className="inline-block px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-white/4 border border-white/8 text-center">
                      <p className="text-xs text-white/40">No skills recorded yet</p>
                    </div>
                  )}
                </div>

                <button onClick={handleEditInPopup}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20">
                  <Edit3 className="w-4 h-4" /> Update Skills
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-1 mb-4">
                  {STEPS.map((label, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
                      {i === step && <span className="text-[9px] text-violet-400 font-semibold">{label}</span>}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-3 pt-2">
                  {step > 0 && (
                    <button onClick={prev}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/50 text-sm hover:text-white/80 transition-all">
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button onClick={next} disabled={step === 0 && !form.applicant_type}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all disabled:opacity-40">
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={async () => {
                      await handleSubmit();
                      setEditing(false);
                    }} disabled={submitting || !form.accuracy_confirmed}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm disabled:opacity-40 transition-all">
                      <CheckCircle className="w-4 h-4" /> Submit & Save
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </>
    );
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
              {i === step && <span className="text-[9px] text-violet-400 font-semibold">{label}</span>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <button onClick={prev}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/50 text-sm hover:text-white/80 transition-all">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} disabled={step === 0 && !form.applicant_type}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all disabled:opacity-40">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !form.accuracy_confirmed}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm disabled:opacity-40 transition-all">
              <CheckCircle className="w-4 h-4" /> Submit Profile
            </button>
          )}
        </div>
      </div>
    );
  }

  const userCategories = user?.categories || [];
  const userCategoryIds = new Set(userCategories.map(c => typeof c === 'string' ? c : c.id));
  
  const availableCategories = allCategories.filter(cat => userCategoryIds.has(cat.id));
  const unassignedCategories = allCategories.filter(cat => !userCategoryIds.has(cat.id));

  const handleAddSkill = async (categoryId) => {
    const newCategories = [...userCategories, categoryId];
    try {
      await base44.auth.updateMe({ categories: newCategories });
      setUser(u => ({ ...u, categories: newCategories }));
      setRequestingSkill(false);
      toast.success('Skill category added!');
    } catch (err) {
      toast.error('Failed to add skill');
    }
  };

  if (applyingForCategory) {
    const category = allCategories.find(c => c.id === applyingForCategory);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setApplyingForCategory(null)}
            className="flex items-center gap-1 text-white/40 hover:text-white/60 text-xs transition-all">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <span className="text-xs text-white/40">Apply for skill</span>
        </div>

        <div className="glass rounded-2xl border border-white/8 p-6 mb-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-violet-500/15 flex items-center justify-center mx-auto mb-3">
            <Code className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white font-heading">{category?.name}</h3>
          <p className="text-xs text-white/40 mt-2">Complete the steps below to apply for this skill category</p>
        </div>

        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
              {i === step && <span className="text-[9px] text-violet-400 font-semibold">{label}</span>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <button onClick={prev}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/50 text-sm hover:text-white/80 transition-all">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} disabled={step === 0 && !form.applicant_type}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all disabled:opacity-40">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !form.accuracy_confirmed}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm disabled:opacity-40 transition-all">
              <CheckCircle className="w-4 h-4" /> Submit Application
            </button>
          )}
        </div>
      </div>
    );
  }

  if (requestingSkill) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setRequestingSkill(false)} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-white/8 p-8 max-w-2xl w-full space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white font-heading">Explore Skills</h3>
              <p className="text-sm text-white/40 mt-1">Add new skill categories or view existing ones</p>
              <button onClick={() => setRequestingSkill(false)} className="text-white/40 hover:text-white/60 text-lg absolute top-6 right-6">✕</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allCategories.map(category => {
                const isAssigned = userCategoryIds.has(category.id);
                return (
                  <motion.button key={category.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!isAssigned) {
                        setApplyingForCategory(category.id);
                        setRequestingSkill(false);
                        setStep(0);
                        setForm({
                          applicant_type: 'student',
                          current_school: '',
                          years_in_university: '',
                          graduation_year: '',
                          major: '',
                          education_level: '',
                          dev_role: '',
                          ai_familiarity: '',
                          programming_languages: '',
                          ai_tools_used: '',
                          nocode_familiarity: '',
                          nocode_tools: '',
                          ai_projects_description: '',
                          internship_goals: '',
                          ai_fields_interest: '',
                          ai_career_plan: '',
                          weekly_hours_commitment: '',
                          available_remote: '',
                          scheduling_limitations: '',
                          accuracy_confirmed: false
                        });
                      }
                    }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${isAssigned ? 'border-emerald-500/30 bg-emerald-500/10 cursor-default' : 'border-white/10 bg-white/4 hover:bg-white/8 cursor-pointer'}`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isAssigned ? 'bg-emerald-500/20' : 'bg-violet-500/15'}`}>
                      <Code className={`w-6 h-6 ${isAssigned ? 'text-emerald-400' : 'text-violet-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{category.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{isAssigned ? 'Added' : 'Not added'}</p>
                    </div>
                    {!isAssigned && <Plus className="w-4 h-4 text-white/40 mt-1" />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/8 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">Skills & Expertise</h3>
          <p className="text-xs text-white/40 mt-0.5">{availableCategories.length} {availableCategories.length === 1 ? 'category' : 'categories'} assigned</p>
        </div>
        <button onClick={() => setRequestingSkill(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/30 transition-all flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      
      {availableCategories.length === 0 ? (
        <motion.div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
          <Sparkles className="w-5 h-5 text-white/30 mx-auto mb-2" />
          <p className="text-xs text-white/40">No skills added yet</p>
          <p className="text-[10px] text-white/25 mt-1">Explore categories to get started</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {availableCategories.map((category, i) => (
            <motion.button key={category.id} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              onClick={() => setViewingCategory(category.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-transparent border border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/15 transition-all group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{category.name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}