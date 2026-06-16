import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Target, Rocket } from 'lucide-react';

const FEATURE_ICONS = {
  0: Sparkles,
  1: Zap,
  2: Target,
  3: Rocket,
};

export default function CategoryLandingPagePreview({ config, category }) {
  if (!config) return null;

  const primaryColor = config.color_scheme || '#22c55e';
  const rgb = parseInt(primaryColor.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10"
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl"
        style={{
          background: `radial-gradient(circle at 20% 50%, rgba(${r},${g},${b},0.4), transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-20 blur-3xl"
        style={{
          background: `radial-gradient(circle at 80% 80%, rgba(${r},${g},${b},0.2), transparent 50%)`,
        }}
      />

      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40" />

      {/* Hero Image if provided */}
      {config.hero_image_url && (
        <div className="absolute inset-0 opacity-40">
          <img
            src={config.hero_image_url}
            alt="Hero"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12 min-h-96 flex flex-col justify-between">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="inline-block mb-4">
            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white border"
              style={{
                background: `rgba(${r},${g},${b},0.15)`,
                borderColor: `rgba(${r},${g},${b},0.4)`,
              }}
            >
              {category?.name || 'Program'}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight font-heading">
            {config.headline || 'Transform Your Future'}
          </h1>

          {config.subheadline && (
            <p className="text-lg text-white/70 mb-4">{config.subheadline}</p>
          )}

          <p className="text-white/60 text-lg leading-relaxed max-w-xl">
            {config.description || 'Join our program and unlock your potential'}
          </p>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: `linear-gradient(135deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.7))`,
            }}
            className="mt-8 px-8 py-4 rounded-xl text-white font-bold text-lg flex items-center gap-2 hover:shadow-lg transition-all shadow-md"
          >
            {config.cta_text || 'Get Started'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        {config.features?.filter(f => f).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {config.features.map((feature, i) => {
               if (!feature) return null;
               const Icon = FEATURE_ICONS[i] || Sparkles;
               const featureDetail = config.feature_details?.[i];
               return (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 + i * 0.1 }}
                   style={{
                     border: `1px solid rgba(${r},${g},${b},0.3)`,
                     background: `rgba(${r},${g},${b},0.08)`,
                   }}
                   className="p-4 rounded-xl backdrop-blur-sm hover:shadow-lg transition-all"
                 >
                   <Icon
                     className="w-5 h-5 mb-2"
                     style={{ color: `rgb(${r},${g},${b})` }}
                   />
                   <p className="text-white font-semibold text-sm">{feature}</p>
                   {featureDetail?.description && (
                     <p className="text-white/50 text-xs mt-2 leading-relaxed">{featureDetail.description}</p>
                   )}
                 </motion.div>
               );
             })}
          </motion.div>
        )}
      </div>

      {/* Decorative elements */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `rgb(${r},${g},${b})` }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `rgb(${r},${g},${b})` }}
      />
    </motion.div>
  );
}