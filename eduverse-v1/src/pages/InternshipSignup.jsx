import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, Zap, Star, Target, Rocket } from 'lucide-react';
import SignupFormCard from '@/components/internship/SignupFormCard';

const FEATURE_ICONS = [Zap, Star, Target, Rocket];

function hexToRgb(hex) {
  const clean = (hex || '22c55e').replace('#', '');
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export default function InternshipSignup() {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const isPreview = searchParams.get('preview') === 'true';
  const previewCategoryId = searchParams.get('categoryId');

  const [state, setState] = useState({ loading: true, error: null, category: null, internship: null, inviteLink: null });

  useEffect(() => {
    const load = async () => {
      // ── PREVIEW MODE ──────────────────────────────────────────────────────
      if (isPreview) {
        if (previewCategoryId) {
          try {
            const cat = await base44.entities.CareerCategory.get(previewCategoryId);
            setState({ loading: false, error: null, category: cat, internship: null, inviteLink: null });
          } catch {
            setState({ loading: false, error: null, category: null, internship: null, inviteLink: null });
          }
        } else {
          // No categoryId — show generic preview
          setState({ loading: false, error: null, category: null, internship: null, inviteLink: null });
        }
        return;
      }

      // Legacy PREVIEW_CODE passthrough (from brochure admin preview)
      if (inviteCode === 'PREVIEW_CODE') {
        setState({ loading: false, error: null, category: null, internship: null, inviteLink: null });
        return;
      }

      // ── PRODUCTION MODE ───────────────────────────────────────────────────
      if (!inviteCode) {
        setState({ loading: false, error: 'No invite code provided. Please use the link you received.', category: null, internship: null, inviteLink: null });
        return;
      }

      try {
        const links = await base44.entities.InviteLink.filter({ code: inviteCode, is_active: true });
        if (links.length === 0) {
          setState({ loading: false, error: 'This invite link is invalid or has expired.', category: null, internship: null, inviteLink: null });
          return;
        }

        const link = links[0];
        let category = null;
        let internship = null;

        if (link.category_id) {
          try { category = await base44.entities.CareerCategory.get(link.category_id); } catch {}
        }
        if (link.internship_id) {
          try { internship = await base44.entities.Internship.get(link.internship_id); } catch {}
        }

        setState({ loading: false, error: null, category, internship, inviteLink: link });
      } catch {
        setState({ loading: false, error: 'Failed to load invite details. Please try again.', category: null, internship: null, inviteLink: null });
      }
    };
    load();
  }, [inviteCode, isPreview, previewCategoryId]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white font-heading mb-2">Invalid Invite Link</h2>
          <p className="text-sm text-white/55 leading-relaxed">{state.error}</p>
        </div>
      </div>
    );
  }

  const { category, internship, inviteLink } = state;
  const config = category?.landing_config || {};
  const accentHex = config.color_scheme || '#22c55e';
  const { r, g, b } = hexToRgb(accentHex);
  const accentRgb = `${r}, ${g}, ${b}`;

  const headline = config.headline || (category ? `Join the ${category.name} Program` : 'Launch Your Career');
  const subheadline = config.subheadline || (internship?.title) || 'Hands-on internship experience for the next generation';
  const description = config.description || 'Gain real-world skills, build your network, and work on meaningful projects that matter.';
  const features = (config.features || []).filter(Boolean);
  const ctaText = config.cta_text || 'Submit Application';

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">

      {/* ── LEFT: Branding Panel ─────────────────────────────────────────── */}
      <div
        className="relative lg:w-[45%] flex flex-col justify-center px-8 py-14 lg:px-14 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.16) 0%, rgba(${accentRgb}, 0.03) 100%)`,
          borderRight: `1px solid rgba(${accentRgb}, 0.12)`,
        }}
      >
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ background: accentHex, transform: 'translate(-50%, -50%)' }} />
        <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-10"
          style={{ background: accentHex, transform: 'translate(40%, 40%)' }} />

        <div className="relative z-10 max-w-md">
          {/* Preview banner */}
          {(isPreview || inviteCode === 'PREVIEW_CODE') && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 bg-amber-500/15 text-amber-400 border border-amber-500/25">
              👁 Preview Mode
            </div>
          )}

          {/* Category badge */}
          {category && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: `rgba(${accentRgb}, 0.12)`, color: accentHex, border: `1px solid rgba(${accentRgb}, 0.3)` }}>
              {category.name}
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white font-heading leading-tight mb-3">
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="text-base font-semibold mb-4" style={{ color: accentHex }}>
            {subheadline}
          </p>

          {/* Description */}
          <p className="text-white/55 text-sm leading-relaxed mb-8">
            {description}
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(features.length > 0 ? features : ['Hands-on Experience', 'Career Mentorship', 'Network Access', 'Certified Completion'])
              .map((feature, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                const detail = config.feature_details?.[i]?.description;
                return (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: `rgba(${accentRgb}, 0.07)`, border: `1px solid rgba(${accentRgb}, 0.13)` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `rgba(${accentRgb}, 0.18)` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: accentHex }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{feature}</p>
                      {detail && <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{detail}</p>}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Internship details card */}
          {internship && (
            <div className="mt-6 p-4 rounded-xl border" style={{ background: `rgba(${accentRgb}, 0.06)`, borderColor: `rgba(${accentRgb}, 0.15)` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accentHex }}>Internship Details</p>
              <p className="text-sm font-bold text-white">{internship.title}</p>
              {internship.company_name && <p className="text-xs text-white/50 mt-0.5">{internship.company_name}</p>}
              {internship.description && <p className="text-xs text-white/40 mt-2 line-clamp-3">{internship.description}</p>}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/40">
                {internship.location_type && <span className="capitalize">{internship.location_type}</span>}
                {internship.duration_weeks && <span>{internship.duration_weeks}w duration</span>}
                {internship.application_deadline && <span>Deadline: {internship.application_deadline}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Registration Form ─────────────────────────────────────── */}
      <div className="lg:w-[55%] flex items-start justify-center px-6 py-12 lg:px-14 overflow-y-auto">
        <div className="w-full max-w-lg">
          <SignupFormCard
            inviteLink={inviteLink}
            internship={internship}
            accentHex={accentHex}
            accentRgb={accentRgb}
            ctaText={ctaText}
            isPreview={isPreview || inviteCode === 'PREVIEW_CODE'}
          />
        </div>
      </div>
    </div>
  );
}