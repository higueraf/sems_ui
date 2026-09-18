import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Country } from '../../types';

interface CountrySelectProps {
  countries?: Country[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function CountrySelect({
  countries, value, onChange, placeholder = 'Seleccione...', disabled, error, className = '',
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = countries?.find((c) => c.id === value);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`form-input w-full flex items-center justify-between gap-2 text-left disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${error ? 'border-red-400' : ''}`}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {selected ? (
            <>
              <span className="text-base leading-none flex-shrink-0">{selected.flagEmoji || '🏳️'}</span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-gray-400">
              <Globe size={14} />
              {placeholder}
            </span>
          )}
        </span>
        <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {countries?.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => { onChange(c.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-50 ${
                c.id === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-base leading-none flex-shrink-0">{c.flagEmoji || '🏳️'}</span>
              <span className="truncate">{c.name}</span>
            </button>
          ))}
          {!countries?.length && <p className="px-3 py-2 text-xs text-gray-400">Sin países disponibles</p>}
        </div>
      )}
    </div>
  );
}
