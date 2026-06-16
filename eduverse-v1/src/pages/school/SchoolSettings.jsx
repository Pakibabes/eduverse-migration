import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Settings, CreditCard, Bell, Shield, Globe, Lock } from 'lucide-react';

export default function SchoolSettings() {
  return (
    <div className="p-8">
      <PageHeader title="Settings" subtitle="Platform configuration and integrations" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[
            { icon: Globe, label: 'Platform Name', sub: 'Customize your platform branding', input: true, value: 'EduVerse' },
            { icon: Bell, label: 'Notification Preferences', sub: 'Control when members get notified', toggle: true },
            { icon: Shield, label: 'Default Privacy', sub: 'New communities are private by default', toggle: true, on: true },
          ].map(item => (
            <div key={item.label} className="glass rounded-2xl border border-white/8 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
                  </div>
                </div>
                {item.toggle && (
                  <div className={`w-10 h-5 rounded-full relative ${item.on ? 'bg-emerald-500' : 'bg-white/15'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.on ? 'left-5' : 'left-0.5'}`} />
                  </div>
                )}
                {item.input && <GlassButton size="sm" variant="secondary">Edit</GlassButton>}
              </div>
            </div>
          ))}

          <div className="glass rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Stripe Payments</p>
                <p className="text-xs text-white/40 mt-0.5 mb-3">Connect Stripe to accept real payments for paid communities and courses</p>
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-400">Requires Stripe account — connect after initial setup</span>
                </div>
              </div>
              <GlassButton size="sm" variant="secondary">Connect</GlassButton>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/8 p-5 h-fit">
          <h3 className="text-sm font-semibold text-white font-heading mb-4">Platform Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Plan', value: 'Pro' },
              { label: 'Storage', value: '2.4 GB / 10 GB' },
              { label: 'API Calls', value: '12,450 / mo' },
            ].map(s => (
              <div key={s.label} className="flex justify-between">
                <span className="text-xs text-white/30">{s.label}</span>
                <span className="text-xs text-white/70">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}