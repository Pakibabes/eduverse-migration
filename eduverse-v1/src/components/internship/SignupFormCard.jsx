import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Lock, ArrowRight, ArrowLeft, Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/70">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', disabled, accentRgb }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
      onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, accentRgb }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all appearance-none"
      onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function FileUpload({ label, required, fieldName, fileState, setFileState, uploading, setUploading, accentRgb, accentHex }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(fieldName, true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFileState(fieldName, { url: result.file_url, name: file.name });
      toast.success(`${label} uploaded`);
    } catch {
      toast.error(`Failed to upload ${label}`);
    }
    setUploading(fieldName, false);
  };

  const uploaded = fileState[fieldName];
  const isUploading = uploading[fieldName];

  return (
    <Field label={label} required={required}>
      <label
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
        style={{
          background: uploaded ? `rgba(${accentRgb}, 0.08)` : 'rgba(0,0,0,0.3)',
          borderColor: uploaded ? `rgba(${accentRgb}, 0.4)` : 'rgba(255,255,255,0.1)',
        }}
      >
        <input type="file" className="hidden" onChange={handleFile} disabled={isUploading} />
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        ) : uploaded ? (
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: accentHex }} />
        ) : (
          <Upload className="w-4 h-4 text-white/30 flex-shrink-0" />
        )}
        <span className="text-sm truncate" style={{ color: uploaded ? accentHex : 'rgba(255,255,255,0.35)' }}>
          {isUploading ? 'Uploading...' : uploaded ? uploaded.name : `Upload ${label}`}
        </span>
      </label>
    </Field>
  );
}

export default function SignupFormCard({ inviteLink, internship, accentHex, accentRgb, ctaText, isPreview }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1
  const [reg, setReg] = useState({ fullName: '', email: '', password: '', confirmPassword: '', applicantType: 'student' });

  // Step 2 - shared
  const [profile, setProfile] = useState({
    phone: '', linkedin_url: '', how_did_you_hear: '', anything_else: '',
    // student
    current_school: '', major: '', years_in_university: '', graduation_year: '',
    internship_required: '', weekly_hours_commitment: '', preferred_start_date: '',
    // professional
    current_employer: '', dev_role: '', industry: '', internship_goals: '', ai_career_plan: '',
  });

  const [files, setFiles] = useState({});
  const [uploading, setUploadingState] = useState({});

  const setFileState = (key, val) => setFiles(prev => ({ ...prev, [key]: val }));
  const setUploading = (key, val) => setUploadingState(prev => ({ ...prev, [key]: val }));

  const p = (key) => (val) => setProfile(prev => ({ ...prev, [key]: val }));
  const r = (key) => (val) => setReg(prev => ({ ...prev, [key]: val }));

  const validateStep1 = () => {
    if (!reg.fullName.trim()) { toast.error('Full name is required'); return false; }
    if (!reg.email.trim()) { toast.error('Email is required'); return false; }
    if (reg.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    if (reg.password !== reg.confirmPassword) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!files.resume) { toast.error('Resume/CV is required'); return false; }
    if (reg.applicantType === 'student' && !profile.current_school.trim()) { toast.error('School name is required'); return false; }
    if (reg.applicantType === 'professional' && !profile.current_employer.trim()) { toast.error('Current company is required'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (isPreview) { toast.success('Preview mode — no data submitted'); setDone(true); return; }

    setSubmitting(true);
    try {
      await base44.auth.register({ email: reg.email, password: reg.password });

      const nameParts = reg.fullName.trim().split(' ');
      await base44.entities.InternshipApplication.create({
        internship_id: internship?.id || inviteLink?.internship_id || '',
        student_id: reg.email, // placeholder until user ID is available post-verify
        student_name: reg.fullName,
        student_email: reg.email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        applicant_type: reg.applicantType,
        phone: profile.phone,
        linkedin_url: profile.linkedin_url,
        how_did_you_hear: profile.how_did_you_hear,
        anything_else: profile.anything_else,
        preferred_start_date: profile.preferred_start_date,
        weekly_hours_commitment: profile.weekly_hours_commitment,
        resume_url: files.resume?.url || '',
        resume_file_name: files.resume?.name || '',
        project_samples_url: files.portfolio?.url || '',
        project_samples_file_name: files.portfolio?.name || '',
        // student fields
        current_school: profile.current_school,
        major: profile.major,
        years_in_university: profile.years_in_university,
        graduation_year: profile.graduation_year,
        // professional fields
        current_employer: profile.current_employer,
        dev_role: profile.dev_role,
        industry: profile.industry,
        internship_goals: profile.internship_goals,
        ai_career_plan: profile.ai_career_plan,
        status: 'applied',
        applied_date: new Date().toISOString().slice(0, 10),
        submission_date: new Date().toISOString(),
        accuracy_confirmed: true,
      });

      setDone(true);
    } catch (err) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: `rgba(${accentRgb}, 0.15)` }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: accentHex }} />
        </div>
        <h2 className="text-2xl font-bold text-white font-heading mb-3">Application Submitted!</h2>
        <p className="text-white/55 text-sm max-w-xs">
          {isPreview
            ? 'This was a preview submission. No data was saved.'
            : 'Check your email to verify your account. We\'ll be in touch shortly.'}
        </p>
      </div>
    );
  }

  const btnStyle = {
    background: accentHex,
    color: '#000',
    boxShadow: `0 4px 24px rgba(${accentRgb}, 0.3)`,
  };

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={step >= s
                ? { background: accentHex, color: '#000' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
            >
              {s}
            </div>
            {s < 2 && <div className="h-px w-8 bg-white/10" />}
          </div>
        ))}
        <span className="ml-2 text-xs text-white/40">
          {step === 1 ? 'Account Details' : 'Profile'}
        </span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">Create Your Account</h2>
            <p className="text-sm text-white/50 mt-1">Start your application in seconds</p>
          </div>

          <Field label="Full Name" required>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" value={reg.fullName} onChange={e => r('fullName')(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </Field>

          <Field label="Email Address" required>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="email" value={reg.email} onChange={e => r('email')(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Password" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="password" value={reg.password} onChange={e => r('password')(e.target.value)}
                  placeholder="Min 8 chars"
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
                  onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </Field>
            <Field label="Confirm Password" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="password" value={reg.confirmPassword} onChange={e => r('confirmPassword')(e.target.value)}
                  placeholder="Repeat"
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
                  onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </Field>
          </div>

          <Field label="I am applying as" required>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'professional'].map(type => (
                <button key={type} type="button" onClick={() => r('applicantType')(type)}
                  className="py-3 rounded-xl text-sm font-semibold capitalize transition-all border"
                  style={reg.applicantType === type
                    ? { background: `rgba(${accentRgb}, 0.15)`, borderColor: `rgba(${accentRgb}, 0.5)`, color: accentHex }
                    : { background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}
                >
                  {type === 'student' ? '🎓 Student' : '💼 Professional'}
                </button>
              ))}
            </div>
          </Field>

          <button onClick={() => { if (validateStep1()) setStep(2); }}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2"
            style={btnStyle}>
            Next: Profile <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-white/40 pt-2">
            Already have an account?{' '}
            <a href="/login" className="font-medium hover:opacity-80 transition-opacity" style={{ color: accentHex }}>Log in</a>
          </p>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">Your Profile</h2>
            <p className="text-sm text-white/50 mt-1">
              {reg.applicantType === 'student' ? 'Tell us about your academic background' : 'Tell us about your professional background'}
            </p>
          </div>

          {/* Student fields */}
          {reg.applicantType === 'student' && (
            <>
              <Field label="School / University" required>
                <TextInput value={profile.current_school} onChange={p('current_school')} placeholder="e.g. MIT" accentRgb={accentRgb} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Degree / Major">
                  <TextInput value={profile.major} onChange={p('major')} placeholder="e.g. Computer Science" accentRgb={accentRgb} />
                </Field>
                <Field label="Year Level">
                  <SelectInput value={profile.years_in_university} onChange={p('years_in_university')} accentRgb={accentRgb}
                    placeholder="Select year"
                    options={[{value:'1',label:'1st Year'},{value:'2',label:'2nd Year'},{value:'3',label:'3rd Year'},{value:'4',label:'4th Year'},{value:'5+',label:'5th Year+'}]} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expected Graduation">
                  <TextInput value={profile.graduation_year} onChange={p('graduation_year')} placeholder="e.g. 2026" accentRgb={accentRgb} />
                </Field>
                <Field label="Preferred Start Date">
                  <TextInput value={profile.preferred_start_date} onChange={p('preferred_start_date')} type="date" placeholder="" accentRgb={accentRgb} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Internship Required?">
                  <SelectInput value={profile.internship_required} onChange={p('internship_required')} accentRgb={accentRgb}
                    placeholder="Select"
                    options={[{value:'yes',label:'Yes — school requirement'},{value:'no',label:'No — voluntary'}]} />
                </Field>
                <Field label="Required Hours">
                  <TextInput value={profile.weekly_hours_commitment} onChange={p('weekly_hours_commitment')} placeholder="e.g. 120" accentRgb={accentRgb} />
                </Field>
              </div>
            </>
          )}

          {/* Professional fields */}
          {reg.applicantType === 'professional' && (
            <>
              <Field label="Current Company" required>
                <TextInput value={profile.current_employer} onChange={p('current_employer')} placeholder="e.g. Google" accentRgb={accentRgb} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current Position">
                  <TextInput value={profile.dev_role} onChange={p('dev_role')} placeholder="e.g. Software Engineer" accentRgb={accentRgb} />
                </Field>
                <Field label="Industry">
                  <TextInput value={profile.industry} onChange={p('industry')} placeholder="e.g. FinTech" accentRgb={accentRgb} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Years of Experience">
                  <SelectInput value={profile.years_in_university} onChange={p('years_in_university')} accentRgb={accentRgb}
                    placeholder="Select"
                    options={[{value:'0-1',label:'0–1 years'},{value:'2-3',label:'2–3 years'},{value:'4-5',label:'4–5 years'},{value:'6-10',label:'6–10 years'},{value:'10+',label:'10+ years'}]} />
                </Field>
                <Field label="Desired Start Date">
                  <TextInput value={profile.preferred_start_date} onChange={p('preferred_start_date')} type="date" placeholder="" accentRgb={accentRgb} />
                </Field>
              </div>
              <Field label="Career Goals">
                <textarea value={profile.internship_goals} onChange={e => p('internship_goals')(e.target.value)}
                  placeholder="What do you hope to achieve?"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none resize-none h-20 transition-all"
                  onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </Field>
            </>
          )}

          {/* File uploads */}
          <div className="pt-2 border-t border-white/8 space-y-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Documents</p>
            <FileUpload label="Resume / CV" required fieldName="resume" fileState={files} setFileState={setFileState} uploading={uploading} setUploading={setUploading} accentRgb={accentRgb} accentHex={accentHex} />
            {reg.applicantType === 'student' && (
              <>
                <FileUpload label="Endorsement Letter" fieldName="endorsement" fileState={files} setFileState={setFileState} uploading={uploading} setUploading={setUploading} accentRgb={accentRgb} accentHex={accentHex} />
                <FileUpload label="Transcript" fieldName="transcript" fileState={files} setFileState={setFileState} uploading={uploading} setUploading={setUploading} accentRgb={accentRgb} accentHex={accentHex} />
              </>
            )}
            {reg.applicantType === 'professional' && (
              <>
                <FileUpload label="Portfolio" fieldName="portfolio" fileState={files} setFileState={setFileState} uploading={uploading} setUploading={setUploading} accentRgb={accentRgb} accentHex={accentHex} />
                <FileUpload label="Certifications" fieldName="certifications" fileState={files} setFileState={setFileState} uploading={uploading} setUploading={setUploading} accentRgb={accentRgb} accentHex={accentHex} />
              </>
            )}
          </div>

          {/* Optional links */}
          <div className="pt-2 border-t border-white/8 space-y-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Optional Links</p>
            <Field label="LinkedIn Profile">
              <TextInput value={profile.linkedin_url} onChange={p('linkedin_url')} placeholder="https://linkedin.com/in/..." accentRgb={accentRgb} />
            </Field>
            <Field label="How did you hear about us?">
              <SelectInput value={profile.how_did_you_hear} onChange={p('how_did_you_hear')} accentRgb={accentRgb}
                placeholder="Select source"
                options={[{value:'social_media',label:'Social Media'},{value:'friend',label:'Friend/Referral'},{value:'school',label:'School/University'},{value:'job_board',label:'Job Board'},{value:'event',label:'Event'},{value:'other',label:'Other'}]} />
            </Field>
            <Field label="Additional Notes">
              <textarea value={profile.anything_else} onChange={e => p('anything_else')(e.target.value)}
                placeholder="Anything else you'd like us to know?"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none resize-none h-16 transition-all"
                onFocus={e => e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white/80 text-sm font-medium transition-all hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              style={btnStyle}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>{ctaText || 'Submit Application'}<ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}