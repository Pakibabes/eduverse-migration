import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, FileText, Loader2, CheckCircle, CalendarIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import PhoneInput from '@/components/internship/PhoneInput';

// ─── Default questions fallback ──────────────────────────────────────────────
const DEFAULT_QUESTIONS = {
  'Basic Info': [
    { id: 'first_name', label: 'First Name', type: 'text', required: true },
    { id: 'last_name', label: 'Last Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'confirm_email', label: 'Confirm Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
    { id: 'linkedin_url', label: 'LinkedIn Profile or Portfolio', type: 'text' },
    { id: 'telegram_username', label: 'Telegram Username', type: 'text' },
  ],
  'Background': [
    { id: 'applicant_type', label: 'Are you a student or a professional?', type: 'select', required: true,
      options: [{ value: 'student', label: 'Student' }, { value: 'professional', label: 'Professional' }] },
  ],
  'Education': [
    { id: 'current_school', label: 'Current School / University', type: 'text' },
    { id: 'years_in_university', label: 'Years in University', type: 'text' },
    { id: 'graduation_year', label: 'Expected Graduation Year', type: 'text' },
    { id: 'major', label: 'Major', type: 'text' },
    { id: 'education_level', label: 'Current Level of Education', type: 'text' },
    { id: 'current_employer', label: 'Current Employer (if any)', type: 'text' },
    { id: 'industry', label: 'Industry (if employed)', type: 'text' },
  ],
  'Tech Skills': [
    { id: 'dev_role', label: 'Developer Role', type: 'select',
      options: ['Frontend Developer', 'Backend Developer', 'Full Stack', 'Nothing yet'] },
    { id: 'ai_familiarity', label: 'How familiar are you with AI and machine learning?', type: 'select',
      options: ['Not familiar', 'Slightly familiar', 'Moderately familiar', 'Very familiar', 'Expert'] },
    { id: 'programming_languages', label: 'Programming languages you know (list all)', type: 'text' },
    { id: 'ai_tools_used', label: 'Have you worked with AI tools before?', type: 'select', options: ['Yes', 'No'] },
  ],
  'AI & No-Code': [
    { id: 'nocode_familiarity', label: 'Familiarity with No-Code Automation tools and CRMs', type: 'select',
      options: ['Not familiar', 'Slightly familiar', 'Moderately familiar', 'Very familiar', 'Expert'] },
    { id: 'nocode_tools', label: 'No-Code / CRM tools you know (list all)', type: 'text' },
    { id: 'ai_projects_description', label: 'Describe any AI-related projects or experience (skip if none)', type: 'textarea' },
  ],
  'Goals': [
    { id: 'internship_goals', label: 'What are you hoping to gain from this internship?', type: 'textarea' },
    { id: 'ai_fields_interest', label: 'Which AI fields interest you the most?', type: 'text' },
    { id: 'ai_career_plan', label: 'How do you plan to apply AI in your career?', type: 'textarea' },
  ],
  'Availability': [
    { id: 'weekly_hours_commitment', label: 'Hours per week you can commit', type: 'select',
      options: ['5-10 hours', '10-15 hours', '15-20 hours', '20-30 hours', '30+ hours'] },
    { id: 'available_remote', label: 'Available for remote work?', type: 'select', options: ['Yes', 'No', 'Hybrid'] },
    { id: 'scheduling_limitations', label: 'Scheduling preferences or limitations', type: 'text' },
    { id: 'preferred_start_date', label: 'Preferred start date', type: 'date' },
  ],
  'Final Steps': [
    { id: 'how_did_you_hear', label: 'How did you hear about us?', type: 'text' },
    { id: 'anything_else', label: "Anything else you'd like us to know?", type: 'textarea' },
    { id: 'submission_date', label: "Today's date", type: 'date', required: true },
    { id: 'accuracy_confirmed', label: 'I confirm that all information provided is accurate', type: 'checkbox', required: true },
  ],
};

const DEFAULT_STEPS = Object.keys(DEFAULT_QUESTIONS).map(step => ({ step, enabled: true }));

// ─── Small UI primitives ──────────────────────────────────────────────────────
const FIELD = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs text-white/50 font-medium">
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

const INPUT = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder}
    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60" />
);

const SELECT = ({ value, onChange, options, placeholder = 'Please Select' }) => (
  <select value={value ?? ''} onChange={onChange}
    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
);

const TEXTAREA = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea value={value ?? ''} onChange={onChange} placeholder={placeholder} rows={rows}
    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 resize-none" />
);

const DatePicker = ({ value, onChange, placeholder = 'Pick a date' }) => {
  const parsed = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="w-full flex items-center gap-3 bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:border-violet-500/60 transition-colors hover:border-violet-500/40">
          <CalendarIcon className="w-4 h-4 text-white/30 flex-shrink-0" />
          <span className={parsed ? 'text-white' : 'text-white/25'}>{parsed ? format(parsed, 'MMM dd, yyyy') : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={parsed}
          onSelect={date => onChange(date ? format(date, 'yyyy-MM-dd') : '')} initialFocus />
      </PopoverContent>
    </Popover>
  );
};

function StepCard({ title, subtitle, required, children }) {
  return (
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
}

function FileUploadBox({ url, fileName, uploading, onUpload, accept }) {
  if (url) return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span className="text-sm text-emerald-300 flex-1 truncate">{fileName || 'File uploaded'}</span>
      <label className="text-xs text-white/40 hover:text-white/70 cursor-pointer transition-colors">
        Replace
        <input type="file" accept={accept} onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} className="hidden" />
      </label>
    </div>
  );
  return (
    <label className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 border-dashed border-violet-500/25 hover:border-violet-500/50 cursor-pointer transition-all group">
      <div className="flex items-center gap-3">
        {uploading ? <Loader2 className="w-5 h-5 text-violet-400 animate-spin" /> : <Upload className="w-5 h-5 text-white/25 group-hover:text-violet-400 transition-colors" />}
        <div>
          <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{uploading ? 'Uploading...' : 'Drag and drop files here'}</p>
          <p className="text-xs text-white/25">Max. file size: 10.6MB</p>
        </div>
      </div>
      <span className="px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold">BROWSE FILES</span>
      <input type="file" accept={accept} onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} className="hidden" disabled={uploading} />
    </label>
  );
}

// ─── Dynamic question renderer ────────────────────────────────────────────────
function DynamicQuestion({ question, value, onChange }) {
  const { label, type, required, options } = question;

  const renderInput = () => {
    switch (type) {
      case 'tel':
        return <PhoneInput value={value ?? ''} onChange={onChange} />;
      case 'date':
        return <DatePicker value={value ?? ''} onChange={onChange} />;
      case 'textarea':
        return <TEXTAREA value={value} onChange={e => onChange(e.target.value)} />;
      case 'select':
        return <SELECT value={value} onChange={e => onChange(e.target.value)} options={options || []} />;
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/20 bg-black/20 cursor-pointer">
            <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
              className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-white/70">Yes</span>
          </label>
        );
      default:
        return <INPUT type={type} value={value} onChange={e => onChange(e.target.value)} />;
    }
  };

  return <FIELD label={label} required={required}>{renderInput()}</FIELD>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ITApplicationWizard({ internshipId, currentUser, internship, onSubmitted }) {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSteps, setActiveSteps] = useState(DEFAULT_STEPS);
  const [questionMap, setQuestionMap] = useState(DEFAULT_QUESTIONS);

  // custom_answers stores all dynamic field values keyed by question id
  const [custom_answers, setCustomAnswers] = useState(() => {
    const initial = {};
    DEFAULT_STEPS.forEach(({ step: stepName }) => {
      (DEFAULT_QUESTIONS[stepName] || []).forEach(q => {
        if (q.id === 'first_name') initial[q.id] = currentUser?.full_name?.split(' ')[0] || '';
        else if (q.id === 'last_name') initial[q.id] = currentUser?.full_name?.split(' ').slice(1).join(' ') || '';
        else if (q.id === 'email' || q.id === 'confirm_email') initial[q.id] = currentUser?.email || '';
        else if (q.id === 'submission_date') initial[q.id] = format(new Date(), 'MM-dd-yyyy');
        else if (q.id === 'applicant_type') initial[q.id] = 'student';
        else if (q.type === 'checkbox') initial[q.id] = false;
        else initial[q.id] = '';
      });
    });
    return initial;
  });

  // File state separate from custom_answers
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [samplesUrl, setSamplesUrl] = useState('');
  const [samplesName, setSamplesName] = useState('');

  // Load category landing_config to get dynamic form_steps / form_questions
  useEffect(() => {
    const load = async () => {
      if (!internship?.career_category_id) return;
      try {
        const category = await base44.entities.CareerCategory.get(internship.career_category_id);
        const config = category?.landing_config;
        if (!config) return;

        // Merge enabled steps from config
        if (config.form_steps?.length) {
          const enabled = config.form_steps.filter(s => s.enabled);
          if (enabled.length > 0) setActiveSteps(enabled);
        }

        // Merge custom questions per step (config.form_questions is { stepName: [questions] })
        if (config.form_questions && typeof config.form_questions === 'object') {
          setQuestionMap(prev => {
            const merged = { ...prev };
            Object.entries(config.form_questions).forEach(([stepName, qs]) => {
              if (Array.isArray(qs) && qs.length > 0) merged[stepName] = qs;
            });
            return merged;
          });
          // Init custom_answers for any new question ids
          setCustomAnswers(prev => {
            const next = { ...prev };
            Object.values(config.form_questions).forEach(qs => {
              (qs || []).forEach(q => {
                if (!(q.id in next)) next[q.id] = q.type === 'checkbox' ? false : '';
              });
            });
            return next;
          });
        }
      } catch {
        // Silently fall back to defaults
      }
    };
    load();
  }, [internship?.career_category_id]);

  const setAnswer = (id, val) => setCustomAnswers(prev => ({ ...prev, [id]: val }));

  const handleFileUpload = async (file, setUrl, setName) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrl(file_url);
    setName(file.name);
    setUploading(false);
    toast.success('File uploaded');
  };

  const handleSubmit = async () => {
    if (!custom_answers.accuracy_confirmed) {
      toast.error('Please confirm that all information is accurate');
      return;
    }
    setSubmitting(true);

    const interviewLinks = await base44.entities.InternshipInterviewLink.filter({ internship_id: internshipId });
    const matched = interviewLinks.find(l => l.career_category_id === internship?.career_category_id)
      || interviewLinks[0];

    const app = await base44.entities.InternshipApplication.create({
      internship_id: internshipId,
      student_id: currentUser.id,
      student_name: [custom_answers.first_name, custom_answers.last_name].filter(Boolean).join(' ') || currentUser.full_name,
      student_email: custom_answers.email || currentUser.email,
      first_name: custom_answers.first_name || '',
      last_name: custom_answers.last_name || '',
      phone: custom_answers.phone || '',
      linkedin_url: custom_answers.linkedin_url || '',
      telegram_username: custom_answers.telegram_username || '',
      applicant_type: custom_answers.applicant_type || 'student',
      current_school: custom_answers.current_school || '',
      years_in_university: custom_answers.years_in_university || '',
      graduation_year: custom_answers.graduation_year || '',
      major: custom_answers.major || '',
      education_level: custom_answers.education_level || '',
      current_employer: custom_answers.current_employer || '',
      industry: custom_answers.industry || '',
      dev_role: custom_answers.dev_role || '',
      ai_familiarity: custom_answers.ai_familiarity || '',
      programming_languages: custom_answers.programming_languages || '',
      ai_tools_used: custom_answers.ai_tools_used || '',
      nocode_familiarity: custom_answers.nocode_familiarity || '',
      nocode_tools: custom_answers.nocode_tools || '',
      ai_projects_description: custom_answers.ai_projects_description || '',
      internship_goals: custom_answers.internship_goals || '',
      ai_fields_interest: custom_answers.ai_fields_interest || '',
      ai_career_plan: custom_answers.ai_career_plan || '',
      weekly_hours_commitment: custom_answers.weekly_hours_commitment || '',
      available_remote: custom_answers.available_remote || '',
      scheduling_limitations: custom_answers.scheduling_limitations || '',
      preferred_start_date: custom_answers.preferred_start_date || '',
      anything_else: custom_answers.anything_else || '',
      how_did_you_hear: custom_answers.how_did_you_hear || '',
      submission_date: custom_answers.submission_date || format(new Date(), 'MM-dd-yyyy'),
      accuracy_confirmed: custom_answers.accuracy_confirmed || false,
      resume_url: resumeUrl,
      resume_file_name: resumeName,
      project_samples_url: samplesUrl,
      project_samples_file_name: samplesName,
      status: matched ? 'pending_interview' : 'applied',
      interview_url: matched?.wedge_interview_url || '',
      applied_date: format(new Date(), 'yyyy-MM-dd'),
      custom_answers,
    });

    await base44.entities.Internship.update(internshipId, {
      applicant_count: (internship?.applicant_count || 0) + 1,
    });

    setSubmitting(false);
    toast.success('Application submitted!');
    onSubmitted(app);
  };

  const prev = () => setStep(s => Math.max(0, s - 1));
  const next = () => setStep(s => Math.min(activeSteps.length - 1, s + 1));

  const currentStepName = activeSteps[step]?.step;
  const questions = questionMap[currentStepName] || [];

  // Special: Final Steps includes file uploads inline
  const isFinalStep = currentStepName === 'Final Steps';

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-2">
        {activeSteps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
            {i === step && <span className="text-[9px] text-violet-400 font-semibold">{s.step}</span>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-4">

          <StepCard title={currentStepName}>
            {questions.map(q => (
              <DynamicQuestion
                key={q.id}
                question={q}
                value={custom_answers[q.id]}
                onChange={val => setAnswer(q.id, val)}
              />
            ))}

            {/* Email match validation inline */}
            {currentStepName === 'Basic Info' && custom_answers.confirm_email && custom_answers.confirm_email !== custom_answers.email && (
              <p className="text-xs text-rose-400 -mt-2">Emails do not match</p>
            )}

            {/* File uploads injected into Final Steps */}
            {isFinalStep && (
              <div className="space-y-4 pt-2 border-t border-white/8">
                <FIELD label="Upload Resume (PDF or DOC)">
                  <FileUploadBox url={resumeUrl} fileName={resumeName} uploading={uploading}
                    onUpload={file => handleFileUpload(file, setResumeUrl, setResumeName)} accept=".pdf,.doc,.docx" />
                </FIELD>
                <FIELD label="Upload AI project samples or code (optional)">
                  <FileUploadBox url={samplesUrl} fileName={samplesName} uploading={uploading}
                    onUpload={file => handleFileUpload(file, setSamplesUrl, setSamplesName)} accept=".pdf,.doc,.docx,.zip,.py,.js,.ts" />
                </FIELD>
              </div>
            )}
          </StepCard>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        {step > 0 && (
          <button onClick={prev}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/50 text-sm hover:text-white/80 transition-all">
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
        )}
        {step < activeSteps.length - 1 ? (
          <button onClick={next}
            disabled={currentStepName === 'Basic Info' && custom_answers.confirm_email !== custom_answers.email}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all disabled:opacity-40">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !custom_answers.accuracy_confirmed}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <CheckCircle className="w-4 h-4" />}
            Submit Application
          </button>
        )}
      </div>
    </div>
  );
}