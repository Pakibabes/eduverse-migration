import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ModuleRow({ mod, index, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl border border-white/8 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-all">
        <span className="text-xs font-bold text-white/20 w-5">M{index + 1}</span>
        <span className="flex-1 text-sm font-medium text-white">{mod.title || `Module ${index + 1}`}</span>
        <span className="text-xs text-white/30 capitalize">{mod.type}</span>
        <button onClick={e => { e.stopPropagation(); onDelete(index); }} className="text-white/20 hover:text-rose-400 transition-colors mr-2">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/6 p-4 space-y-3">
            <input value={mod.title} onChange={e => onChange(index, { title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
              placeholder="Module title" />
            <select value={mod.type} onChange={e => onChange(index, { type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
            </select>
            <div className="flex gap-2">
              <input type="number" value={mod.duration_minutes || 0} onChange={e => onChange(index, { duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="Duration (min)" />
              <span className="text-xs text-white/30 self-center">minutes</span>
            </div>
            <textarea value={mod.content || ''} onChange={e => onChange(index, { content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-24"
              placeholder="Module content..." />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TemplateCard({ template, onEdit, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/8 p-5 hover:border-emerald-500/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white font-heading truncate">{template.name}</h3>
          <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{template.description || template.course_description || 'No description'}</p>
        </div>
        <div className="flex gap-1.5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(template)} className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(template.id)} className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/30">
        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{(template.modules || []).length} modules</span>
        {template.tags?.length > 0 && template.tags.slice(0, 2).map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">{tag}</span>
        ))}
      </div>
    </motion.div>
  );
}

function TemplateForm({ template, onSave, onClose }) {
  const [form, setForm] = useState(template || {
    name: '', description: '', course_title: '', course_description: '',
    is_paid: false, price: 0, is_public: true, tags: [], modules: []
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const addModule = () => {
    setForm(f => ({ ...f, modules: [...(f.modules || []), { title: `Module ${(f.modules?.length || 0) + 1}`, type: 'text', content: '', duration_minutes: 0, order: f.modules?.length || 0 }] }));
  };

  const updateModule = (index, data) => {
    setForm(f => ({ ...f, modules: f.modules.map((m, i) => i === index ? { ...m, ...data } : m) }));
  };

  const deleteModule = (index) => {
    setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== index) }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/20 z-10 max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{ background: 'rgba(12, 16, 36, 0.98)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <h2 className="text-lg font-bold text-white font-heading">{template?.id ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Template meta */}
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
              placeholder="Template name (e.g. 'Full Marketing Course')" />
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-16"
              placeholder="Template description..." />
          </div>

          {/* Default course info */}
          <div className="rounded-xl border border-white/8 p-4 space-y-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Default Course Info</p>
            <input value={form.course_title || ''} onChange={e => setForm({ ...form, course_title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
              placeholder="Default course title..." />
            <textarea value={form.course_description || ''} onChange={e => setForm({ ...form, course_description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-16"
              placeholder="Default course description..." />
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.tags || []).map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-rose-400"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none"
              placeholder="Type a tag and press Enter..." />
          </div>

          {/* Modules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Modules ({(form.modules || []).length})</p>
              <GlassButton size="sm" variant="secondary" onClick={addModule}><Plus className="w-3.5 h-3.5" />Add Module</GlassButton>
            </div>
            {(form.modules || []).length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-white/8">
                <BookOpen className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/25">No modules yet — add some to reuse in courses</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(form.modules || []).map((mod, i) => (
                  <ModuleRow key={i} mod={mod} index={i} onChange={updateModule} onDelete={deleteModule} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-white/8">
          <GlassButton variant="secondary" onClick={onClose}>Cancel</GlassButton>
          <GlassButton onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : <><Save className="w-4 h-4" />Save Template</>}
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}

export default function CourseTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    base44.entities.CourseTemplate.list().then(t => { setTemplates(t); setLoading(false); });
  }, []);

  const handleSave = async (form) => {
    if (form.id) {
      const updated = await base44.entities.CourseTemplate.update(form.id, form);
      setTemplates(prev => prev.map(t => t.id === form.id ? updated : t));
    } else {
      const created = await base44.entities.CourseTemplate.create(form);
      setTemplates(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.CourseTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleEdit = (template) => {
    setEditing(template);
    setShowForm(true);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Course Templates"
        subtitle="Save and reuse course structures across communities"
        action={
          <GlassButton onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" />New Template
          </GlassButton>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-2">No templates yet</p>
          <p className="text-sm text-white/20 mb-6">Create templates to quickly spin up new courses with pre-built module structures</p>
          <GlassButton onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Create First Template</GlassButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <TemplateCard key={t.id} template={t} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
          <motion.button onClick={() => { setEditing(null); setShowForm(true); }}
            className="glass rounded-2xl border border-dashed border-emerald-500/20 p-5 hover:border-emerald-500/40 hover:bg-emerald-500/4 transition-all flex flex-col items-center justify-center gap-3 min-h-[140px] group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-white/30 group-hover:text-emerald-400 transition-all">New Template</span>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showForm && <TemplateForm template={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
}