import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import QRCode from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BROCHURE_DESIGNS = {
  'Hero Band': HeroBandBrochure,
  'Editorial Light': EditorialLightBrochure,
  'Blueprint Tech': BlueprintTechBrochure,
};

function HeroBandBrochure({ internshipTitle, schoolName, qrUrl, logoUrl }) {
  return (
    <div style={{ width: '595px', height: '842px', background: '#ffffff', color: '#1a1a1a', fontFamily: "'Hanken Grotesk', sans-serif", position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'start', gap: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', borderRadius: '4px' }} />
            )}
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.05em', color: '#1a1a1a', lineHeight: '1', textAlign: 'center' }}>{schoolName || 'METAWATT'}</span>
          </div>
          <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#94a3b8', textAlign: 'right' }}>AI INTERNSHIP</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.15', margin: '0 0 14px', color: '#000' }}>
          Don't just watch the<br />future arrive. <span style={{ color: '#06b6d4' }}>Build it.</span>
        </h1>
        <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.6', margin: 0 }}>
          {internshipTitle || 'A hands-on internship in AI-powered software development and automation — work on real projects, build a portfolio, and fast-track your career.'}
        </p>
      </div>

      {/* Features */}
      <div style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
        {[
          { num: '01', title: 'AI coding & automation', desc: 'Master the tools that automate the repetitive — and build what comes next.' },
          { num: '02', title: 'Real-world software projects', desc: 'Ship hands-on work that employers actually want to see, not just a transcript.' },
          { num: '03', title: 'AI-enhanced creation', desc: 'Learn to create with AI, not be replaced by it — and shape where industries go.' },
          { num: '04', title: 'A path into the AI agency space', desc: 'Step into the field companies are hiring for right now, with people already in it.' },
        ].map((item) => (
          <div key={item.num} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#0ea5e9', fontWeight: '700', fontSize: '13px', minWidth: '24px' }}>{item.num}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>{item.title}</h3>
                <p style={{ fontSize: '11px', color: '#666', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with CTA */}
      <div style={{ background: '#000', padding: '18px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>Apply now — spots are limited.</p>
          <p style={{ fontSize: '10px', color: '#a0aec0', margin: 0 }}>Scan to apply</p>
        </div>
        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed #666' }}>
          {qrUrl ? (
            <QRCode value={qrUrl} size={60} level="H" />
          ) : (
            <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '9px', textAlign: 'center' }}>QR CODE</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorialLightBrochure({ internshipTitle, schoolName, qrUrl, logoUrl }) {
  return (
    <div style={{ width: '595px', minHeight: '842px', background: '#fafaf8', color: '#111', fontFamily: "'Hanken Grotesk', sans-serif", position: 'relative' }}>
      {/* Top accent line */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #111, #555)' }} />
      
      {/* Header */}
      <div style={{ padding: '32px 40px 28px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          ) : null}
          <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#888', margin: 0, fontWeight: '500' }}>INTERNSHIP PROGRAM</p>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '400', lineHeight: '1.2', margin: '0', color: '#111', letterSpacing: '-0.01em' }}>
          {schoolName || 'Metawatt'}<br />
          <em style={{ fontStyle: 'italic', fontSize: '20px' }}>Internship</em>
        </h1>
      </div>

      {/* Main content */}
      <div style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '14px', fontWeight: '400', lineHeight: '1.5', color: '#333', marginBottom: '20px', letterSpacing: '-0.01em' }}>
          {internshipTitle || 'Earn and learn AI-powered software development while working on real-world projects that matter.'}
        </p>

        {/* Two columns - compact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#888', marginBottom: '10px', fontWeight: '500' }}>WHAT YOU'LL LEARN</p>
            {['AI coding', 'Real projects', 'AI-enhanced creation', 'Agency work'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '1px', background: '#111', flexShrink: 0 }} />
                <p style={{ fontSize: '10px', color: '#333', margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#888', marginBottom: '10px', fontWeight: '500' }}>YOU'LL GAIN</p>
            {['Portfolio work', 'Connections', 'Compensation', 'Certificate'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '1px', background: '#111', flexShrink: 0 }} />
                <p style={{ fontSize: '10px', color: '#333', margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QR Section */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: '500' }}>APPLY NOW</p>
            <p style={{ fontSize: '11px', color: '#111', margin: 0 }}>Scan to apply</p>
          </div>
          <div style={{ padding: '6px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            {qrUrl ? (
              <QRCode value={qrUrl} size={60} level="H" />
            ) : (
              <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '9px', textAlign: 'center' }}>QR</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function BlueprintTechBrochure({ internshipTitle, schoolName, qrUrl, logoUrl }) {
  return (
    <div style={{ width: '595px', height: '842px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2847 50%, #162d4a 100%)', color: 'white', fontFamily: "'Hanken Grotesk', sans-serif", position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>


      {/* Header */}
      <div style={{ padding: '28px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'start', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #0ea5e9, #ec4899)', borderRadius: '4px' }} />
            )}
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.05em', color: 'white', lineHeight: '1', textAlign: 'center' }}>{schoolName || 'METAWATT'}</span>
          </div>
          <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#0ea5e9', margin: 0 }}>FUTURE-READY</span>
        </div>

        <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#0ea5e9', marginBottom: '14px', fontWeight: '600' }}>
          AN INNOVATION PROGRAM
        </div>

        <h1 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 16px', color: 'white' }}>
          The future favors<br />those who <span style={{ color: '#0ea5e9' }}>build it.</span>
        </h1>

        <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
          {internshipTitle || 'A forward-thinking technology company helping the next generation build the skills, mindset, and momentum to lead in a fast-changing world.'}
        </p>
      </div>

      {/* Features with bullet points */}
      <div style={{ padding: '0 32px', flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        {[
          { title: 'Think like a builder', desc: 'Turn ideas into things that ship — and learn the craft of making them real.' },
          { title: 'Work on what\'s next', desc: 'Hands-on projects at the edge of where forward-looking industries are heading.' },
          { title: 'Skills that compound', desc: 'Master the durable fundamentals that keep you ahead as the tools keep changing.' },
          { title: 'A network that opens doors', desc: 'Grow alongside mentors and a community of people building the future.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
            <div style={{ width: '8px', height: '8px', background: 'linear-gradient(135deg, #ec4899, #0ea5e9)', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>{item.title}</h3>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section with border */}
      <div style={{ margin: '16px 24px 20px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>Start building your future.</p>
          <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>Scan to learn more</p>
        </div>
        <div style={{ padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(14, 165, 233, 0.4)', borderRadius: '6px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {qrUrl ? (
            <QRCode value={qrUrl} size={52} level="H" bgColor="transparent" fgColor="#0ea5e9" />
          ) : (
            <div style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', fontSize: '8px', textAlign: 'center' }}>QR</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrochurePreviewModal({ isOpen, onClose, brochure, qrUrl, linkCode }) {
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen || !brochure) return null;

  const internshipTitle = brochure?.template_design?.content || null;
  const schoolName = brochure?.template_design?.title || null;
  const logoUrl = brochure?.template_design?.logo_url || null;

  // Pick design based on brochure category or name
  let BrochureComponent = HeroBandBrochure;
  const name = (brochure?.name || '').toLowerCase();
  const category = (brochure?.category || '').toLowerCase();
  if (name.includes('editorial') || name.includes('light') || category === 'minimal') {
    BrochureComponent = EditorialLightBrochure;
  } else if (name.includes('blueprint') || name.includes('tech') || category === 'corporate') {
    BrochureComponent = BlueprintTechBrochure;
  }

  const handleDownloadPNG = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        allowTaint: true,
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `internship-brochure-${linkCode || 'download'}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
    }
    setDownloading(false);
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [595, 842],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 595, 842);
      pdf.save(`internship-brochure-${linkCode || 'download'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
    setDownloading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/8 bg-card sticky top-0 z-10">
              <div>
                <p className="text-sm font-semibold text-white">{brochure?.name || 'Brochure Preview'}</p>
                <p className="text-xs text-white/40">Preview your internship brochure</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPNG}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all disabled:opacity-40"
                >
                  <Download className="w-3 h-3" />
                  {downloading ? 'Generating...' : 'Download PNG'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-xs font-medium transition-all disabled:opacity-40"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Brochure preview */}
            <div className="p-6 flex justify-center overflow-auto max-h-[calc(90vh-140px)]">
              <div
                ref={previewRef}
                style={{ width: '595px', height: '842px', flexShrink: 0 }}
              >
                <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                  <BrochureComponent
                    internshipTitle={internshipTitle}
                    schoolName={schoolName}
                    qrUrl={qrUrl}
                    logoUrl={logoUrl}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}