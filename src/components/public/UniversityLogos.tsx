/* University partner logos — replace with actual <img> tags once you have the files in /public/logos/ */

interface Logo {
  id: string;
  abbr: string;
  full: string;
  render: () => JSX.Element;
}

const logos: Logo[] = [
  {
    id: 'ueb',
    abbr: 'UEB',
    full: 'Universidad Estatal de Bolívar',
    render: () => (
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded flex items-center justify-center font-black text-white text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C41230 50%, #00366C 50%)' }}
        >
          U
        </div>
        <div className="leading-none">
          <div className="font-black text-sm" style={{ color: '#C41230' }}>UEB</div>
          <div className="text-[10px] text-current leading-tight opacity-70">
            UNIVERSIDAD<br />ESTATAL DE BOLÍVAR
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'uinl',
    abbr: 'UINL',
    full: 'Universidad Internacional Nueva Luz',
    render: () => (
      <div className="flex items-center gap-2">
        <div className="font-black text-2xl tracking-tighter leading-none">
          <span style={{ color: '#1A2E5A' }}>UI</span>
          <span style={{ color: '#4A90D9' }}>NL</span>
        </div>
        <div className="leading-none">
          <div className="text-[10px] opacity-70 leading-tight">
            Universidad Internacional<br />Nueva Luz
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'umayor',
    abbr: 'UMAYOR',
    full: 'Institución Universitaria Mayor de Cartagena',
    render: () => (
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: '#007F3A' }}
        >
          <span className="text-white font-black text-xl leading-none">U</span>
        </div>
        <div className="leading-none">
          <div className="font-black text-xs" style={{ color: '#007F3A' }}>MAYOR</div>
          <div className="text-[9px] opacity-70 leading-tight">
            INSTITUCIÓN UNIVERSITARIA<br />MAYOR DE CARTAGENA
          </div>
          <div
            className="text-[9px] font-bold mt-0.5"
            style={{ color: '#F0A500' }}
          >
            AVANZA HACIA LA EXCELENCIA
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'ute',
    abbr: 'UTE',
    full: 'Universidad UTE Ecuador',
    render: () => (
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded-full border-[3px] flex items-center justify-center flex-shrink-0"
          style={{ borderColor: '#006666' }}
        >
          <span className="font-black text-xs leading-none" style={{ color: '#006666' }}>
            UTE
          </span>
        </div>
        <div className="leading-none">
          <div className="font-bold text-sm" style={{ color: '#006666' }}>UNIVERSIDAD</div>
          <div className="text-[10px] opacity-70">UTE <span className="font-semibold">EC</span></div>
        </div>
      </div>
    ),
  },
  {
    id: 'cp',
    abbr: 'CP',
    full: 'Colegio de Periodistas de Bolivia',
    render: () => (
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8B4513, #CD853F)' }}
        >
          <span className="text-white font-black text-xs text-center leading-tight">CP</span>
        </div>
        <div className="leading-none">
          <div className="text-[10px] font-semibold opacity-80 leading-tight">
            COLEGIO DE<br />PERIODISTAS<br />DE BOLIVIA
          </div>
        </div>
      </div>
    ),
  },
];

interface UniversityLogosProps {
  className?: string;
  label?: string;
}

export default function UniversityLogos({
  className = '',
  label = 'Organizado y avalado por',
}: UniversityLogosProps) {
  return (
    <div className={className}>
      {label && (
        <p className="text-center text-[11px] uppercase tracking-widest mb-5 opacity-50">
          {label}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-10">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 cursor-default"
            title={logo.full}
          >
            {logo.render()}
          </div>
        ))}
      </div>
    </div>
  );
}
