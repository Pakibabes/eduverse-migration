import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import GlassButton from '@/components/ui/GlassButton';
import { ArrowLeft, Save, Check, Users, Globe, Lock, DollarSign, FileText, Eye, Video, Tag, X, Check as CheckIcon, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = ['Settings', 'About Page'];

export default function CommunityEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('Settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [categories, setCategories] = useState([]);
  const [schools, setSchools] = useState([]);
  const countries = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];

  useEffect(() => {
    Promise.all([
      base44.entities.Community.get(id),
      base44.entities.CommunityMember.filter({ community_id: id }),
      base44.entities.CareerCategory.list(),
      base44.entities.School.list(),
    ]).then(([c, m, cats, sch]) => {
      if (c) setCommunity(c);
      setMembers(m);
      setCategories(cats.filter(cat => cat.status === 'active'));
      setSchools(sch);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const updateData = {
      ...community,
      category_ids: community.category_ids || []
    };
    await base44.entities.Community.update(id, updateData);
    setCommunity(updateData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !community.tags?.includes(t)) {
      setCommunity(prev => ({ ...prev, tags: [...(prev.tags || []), t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setCommunity(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this community? This action cannot be undone.')) return;
    await base44.entities.Community.delete(id);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse mb-6" />
        <div className="h-64 bg-white/4 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!community) {
    return <div className="p-8 text-white/40">Community not found.</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-heading text-white">{community.name}</h1>
          <p className="text-sm text-white/40">Edit community settings & about page</p>
        </div>
        <GlassButton onClick={handleSave} disabled={saving}>
          {saved ? <><Check className="w-4 h-4 text-emerald-400" />Saved!</> : <><Save className="w-4 h-4" />Save</>}
        </GlassButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-white/8 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-white/35 hover:text-white/60'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {tab === 'Settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic info */}
            <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Basic Info</h2>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Community Name</label>
                <input value={community.name} onChange={e => setCommunity(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Short Description</label>
                <textarea value={community.description || ''} onChange={e => setCommunity(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-20"
                  placeholder="Brief description shown in listings..." />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Logo URL</label>
                <input value={community.logo_url || ''} onChange={e => setCommunity(p => ({ ...p, logo_url: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Cover Image URL</label>
                <input value={community.cover_url || ''} onChange={e => setCommunity(p => ({ ...p, cover_url: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                  placeholder="https://..." />
              </div>
            </div>

            {/* Tags */}
            <div className="glass rounded-2xl border border-white/8 p-6">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {(community.tags || []).map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Add a tag..." />
                <GlassButton size="sm" variant="secondary" onClick={addTag}>Add</GlassButton>
              </div>
            </div>
          </div>

          {/* Sidebar settings */}
          <div className="space-y-4">
            {/* Privacy */}
            <div className="glass rounded-2xl border border-white/8 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Privacy</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: false, l: 'Public', icon: Globe }, { v: true, l: 'Private', icon: Lock }].map(opt => (
                  <button key={String(opt.v)} onClick={() => setCommunity(p => ({ ...p, is_private: opt.v }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${community.is_private === opt.v ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    <opt.icon className="w-3.5 h-3.5" />{opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Monetization */}
            <div className="glass rounded-2xl border border-white/8 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Monetization</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/70 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-amber-400" />Paid</span>
                <button onClick={() => setCommunity(p => ({ ...p, is_paid: !p.is_paid }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${community.is_paid ? 'bg-emerald-500' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${community.is_paid ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {community.is_paid && (
                <div className="space-y-2">
                  <input type="number" value={community.price || 0} onChange={e => setCommunity(p => ({ ...p, price: parseFloat(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    placeholder="Price ($)" />
                  <select value={community.billing_type || 'monthly'} onChange={e => setCommunity(p => ({ ...p, billing_type: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="one_time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>

            {/* Access Control */}
            <div className="glass rounded-2xl border border-white/8 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Access Control</h3>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Categories <span className="text-white/20">(select multiple)</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCommunity(prev => ({
                        ...prev,
                        category_ids: (prev.category_ids || []).includes(cat.id)
                          ? (prev.category_ids || []).filter(c => c !== cat.id)
                          : [...(prev.category_ids || []), cat.id]
                      }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        (community.category_ids || []).includes(cat.id)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/5 border-white/8 text-white/50 hover:bg-white/8'
                      }`}
                    >
                      {(community.category_ids || []).includes(cat.id) && <Check className="w-3 h-3" />}
                      {cat.name}
                    </button>
                  ))}
                </div>
                {categories.length === 0 && <p className="text-xs text-white/25 py-2">No categories available</p>}
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Country <span className="text-white/20">(optional)</span></label>
                <select value={community.country || ''} onChange={e => setCommunity(p => ({ ...p, country: e.target.value || null }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                  <option value="">Select country...</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">School <span className="text-white/20">(optional)</span></label>
                <select value={community.school_id || ''} onChange={e => setCommunity(p => ({ ...p, school_id: e.target.value || null }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                  <option value="">Select school...</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="glass rounded-2xl border border-white/8 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/50">
                  <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />Members</span>
                  <span className="font-semibold text-white">{members.length}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-2xl border border-rose-500/20 p-5 bg-rose-500/5">
              <h3 className="text-xs font-semibold text-rose-400/60 uppercase tracking-wider mb-3">Danger Zone</h3>
              <GlassButton variant="danger" onClick={handleDelete} className="w-full justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Community
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* About Page Tab */}
      {tab === 'About Page' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Tagline */}
            <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Hero Section</h2>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Tagline <span className="text-white/20">(shown under community name)</span></label>
                <input value={community.about_tagline || ''} onChange={e => setCommunity(p => ({ ...p, about_tagline: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. Learn AI, build your portfolio, earn opportunities..." />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block flex items-center gap-1.5"><Video className="w-3 h-3" />Intro Video URL <span className="text-white/20">(YouTube embed or direct)</span></label>
                <input value={community.intro_video_url || ''} onChange={e => setCommunity(p => ({ ...p, intro_video_url: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                  placeholder="https://youtube.com/embed/... or direct video URL" />
              </div>
            </div>

            {/* About Content */}
            <div className="glass rounded-2xl border border-white/8 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />About Content
                </h2>
                <button onClick={() => setPreview(!preview)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
                  <Eye className="w-3 h-3" />{preview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <div className="min-h-[200px] text-sm text-white/70 leading-relaxed whitespace-pre-wrap rounded-xl bg-white/3 p-4">
                  {community.about_content || <span className="text-white/20 italic">No content yet...</span>}
                </div>
              ) : (
                <textarea
                  value={community.about_content || ''}
                  onChange={e => setCommunity(p => ({ ...p, about_content: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none min-h-[300px] leading-relaxed font-mono"
                  placeholder={`Write your about page content here...\n\nYou can use plain text or emojis:\n🚀 Our mission\n💼 What members get\n🎯 Who this is for`}
                />
              )}
              <p className="text-xs text-white/20 mt-2">Tip: Use emojis and line breaks for rich formatting</p>
            </div>
          </div>

          {/* Live preview card */}
          <div className="space-y-4">
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              {/* Mini cover */}
              <div className="h-24 relative overflow-hidden"
                style={{ background: community.cover_url ? `url(${community.cover_url}) center/cover` : 'linear-gradient(135deg, rgba(52,211,153,0.4), rgba(16,185,129,0.15))' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg border border-emerald-500/20 -mt-7 shadow-lg">
                    {community.logo_url ? <img src={community.logo_url} className="w-full h-full rounded-xl object-cover" alt="" /> : '◈'}
                  </div>
                  <div className="mt-1">
                    <p className="text-sm font-bold text-white font-heading">{community.name}</p>
                  </div>
                </div>
                {community.about_tagline && (
                  <p className="text-xs text-white/50 leading-relaxed mb-3">{community.about_tagline}</p>
                )}
                <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-white/6">
                  <div>
                    <p className="text-base font-bold text-white">{members.length}</p>
                    <p className="text-[10px] text-white/30">Members</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">0</p>
                    <p className="text-[10px] text-white/30">Online</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">1</p>
                    <p className="text-[10px] text-white/30">Admin</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
                  {community.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  <span>{community.is_private ? 'Private' : 'Public'}</span>
                  {community.is_paid && <span className="ml-auto text-amber-400 font-semibold">${community.price}/{community.billing_type === 'monthly' ? 'mo' : community.billing_type === 'yearly' ? 'yr' : 'once'}</span>}
                </div>
              </div>
            </div>
            <p className="text-xs text-white/25 text-center">Preview of community card shown to invited users</p>
          </div>
        </div>
      )}
    </div>
  );
}