import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react';

const DEFAULT_QUESTIONS = {
  'Basic Info': [
    { id: 'first_name', label: 'First Name', type: 'text', required: true },
    { id: 'last_name', label: 'Last Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'confirm_email', label: 'Confirm Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
    { id: 'linkedin', label: 'LinkedIn Profile or Portfolio', type: 'text', required: false },
    { id: 'telegram', label: 'Telegram Username', type: 'text', required: false },
  ],
  'Background': [
    { id: 'applicant_type', label: 'Are you a student or a professional?', type: 'select', options: ['Student', 'Professional'], required: true },
    { id: 'current_employer', label: 'Current Employer (if professional)', type: 'text', required: false },
    { id: 'industry', label: 'Industry', type: 'text', required: false },
  ],
  'Education': [
    { id: 'current_school', label: 'Current School?', type: 'text', required: false },
    { id: 'years_in_university', label: 'How many years have you been in university?', type: 'text', required: false },
    { id: 'graduation_year', label: 'What is your Expected Graduation Year?', type: 'text', required: false },
    { id: 'major', label: 'What is your Major?', type: 'text', required: false },
    { id: 'education_level', label: 'Education Level', type: 'select', options: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD'], required: false },
  ],
  'Tech Skills': [
    { id: 'dev_role', label: 'What is your development role?', type: 'text', required: false },
    { id: 'programming_languages', label: 'Programming Languages', type: 'textarea', required: false },
    { id: 'ai_familiarity', label: 'How familiar are you with AI?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'], required: false },
    { id: 'ai_tools_used', label: 'AI Tools You\'ve Used', type: 'textarea', required: false },
  ],
  'AI & No-Code': [
    { id: 'nocode_familiarity', label: 'No-Code Platform Familiarity', type: 'select', options: ['None', 'Some', 'Experienced'], required: false },
    { id: 'nocode_tools', label: 'No-Code Tools You\'ve Used', type: 'textarea', required: false },
    { id: 'ai_projects_description', label: 'Describe your AI/No-Code Projects', type: 'textarea', required: false },
  ],
  'Goals': [
    { id: 'internship_goals', label: 'What are your internship goals?', type: 'textarea', required: false },
    { id: 'ai_fields_interest', label: 'AI Fields of Interest', type: 'textarea', required: false },
    { id: 'ai_career_plan', label: 'Your AI Career Plan', type: 'textarea', required: false },
  ],
  'Availability': [
    { id: 'weekly_hours_commitment', label: 'Weekly Hours Commitment', type: 'text', required: false },
    { id: 'available_remote', label: 'Available for Remote Work?', type: 'select', options: ['Yes', 'No'], required: false },
    { id: 'scheduling_limitations', label: 'Scheduling Limitations', type: 'textarea', required: false },
    { id: 'preferred_start_date', label: 'Preferred Start Date', type: 'date', required: false },
  ],
  'Final Steps': [
    { id: 'anything_else', label: 'Anything Else You\'d Like to Share?', type: 'textarea', required: false },
    { id: 'how_did_you_hear', label: 'How did you hear about us?', type: 'text', required: false },
  ],
};

export default function CategoryFormEditor({ categoryFormData, setCategoryFormData, categoryName }) {
  const [expandedStep, setExpandedStep] = useState('Basic Info');
  const [editingQuestion, setEditingQuestion] = useState(null);

  const questions = categoryFormData.form_questions || DEFAULT_QUESTIONS;

  const handleUpdateQuestion = (step, questionId, updates) => {
    const newQuestions = { ...questions };
    const questionIndex = newQuestions[step].findIndex(q => q.id === questionId);
    if (questionIndex >= 0) {
      newQuestions[step][questionIndex] = { ...newQuestions[step][questionIndex], ...updates };
      setCategoryFormData({ ...categoryFormData, form_questions: newQuestions });
    }
  };

  const handleAddQuestion = (step) => {
    const newQuestions = { ...questions };
    newQuestions[step] = [
      ...newQuestions[step],
      { id: `custom_${Date.now()}`, label: 'New Question', type: 'text', required: false },
    ];
    setCategoryFormData({ ...categoryFormData, form_questions: newQuestions });
  };

  const handleDeleteQuestion = (step, questionId) => {
    const newQuestions = { ...questions };
    newQuestions[step] = newQuestions[step].filter(q => q.id !== questionId);
    setCategoryFormData({ ...categoryFormData, form_questions: newQuestions });
  };

  const enabledSteps = categoryFormData.form_steps.filter(s => s.enabled);

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 mb-4">Edit form questions for each step</p>
      {enabledSteps.map(step => (
        <motion.div key={step.step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-white/8 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-all"
          >
            <span className="text-sm font-semibold text-white">{step.step}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{questions[step.step]?.length || 0} questions</span>
              <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expandedStep === step.step ? 'rotate-180' : ''}`} />
            </div>
          </button>

          <AnimatePresence>
            {expandedStep === step.step && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/8 p-4 bg-black/20 space-y-3"
              >
                {questions[step.step]?.map((question, idx) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-white/8 rounded-lg p-4 bg-white/3"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-white/50 block mb-1.5">Question Label</label>
                        <input
                          type="text"
                          value={question.label}
                          onChange={e => handleUpdateQuestion(step.step, question.id, { label: e.target.value })}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-white/50 block mb-1.5">Type</label>
                          <select
                            value={question.type}
                            onChange={e => handleUpdateQuestion(step.step, question.id, { type: e.target.value })}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Dropdown</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-white/50 block mb-1.5">Required?</label>
                          <label className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg cursor-pointer hover:border-white/20 transition-all">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={e => handleUpdateQuestion(step.step, question.id, { required: e.target.checked })}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-white/70">Yes</span>
                          </label>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => handleDeleteQuestion(step.step, question.id)}
                            className="w-full px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {question.type === 'select' && (
                        <div>
                          <label className="text-xs text-white/50 block mb-1.5">Options (comma-separated)</label>
                          <input
                            type="text"
                            value={(question.options || []).join(', ')}
                            onChange={e => handleUpdateQuestion(step.step, question.id, { options: e.target.value.split(',').map(o => o.trim()) })}
                            placeholder="Option 1, Option 2, Option 3"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={() => handleAddQuestion(step.step)}
                  className="w-full px-4 py-2.5 rounded-lg border border-dashed border-emerald-500/40 hover:border-emerald-500/60 text-emerald-400 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Add Question
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}