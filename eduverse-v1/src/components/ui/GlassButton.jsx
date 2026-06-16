import { motion } from 'framer-motion';

export default function GlassButton({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) {
  const variants = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20',
    'primary-violet': 'bg-violet-500 hover:bg-violet-400 text-white font-semibold shadow-lg shadow-violet-500/20',
    secondary: 'glass border border-white/10 text-white/70 hover:text-white hover:bg-white/8',
    ghost: 'text-white/50 hover:text-white hover:bg-white/5',
    danger: 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-2.5 text-sm rounded-xl',
  };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium transition-all duration-150 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </motion.button>
  );
}