import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, GraduationCap, Search, PenLine } from 'lucide-react';
import { University } from '../../types';
import { getFileUrl } from '../../utils';

export const OTHER_UNIVERSITY_VALUE = '__other__';

interface UniversitySelectProps {
  universities?: University[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabledPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  allowOther?: boolean;
  className?: string;
}

function UniversityLogo({ university, size = 18 }: { university?: University; size?: number }) {
  if (university?.logoUrl) {
    return (
      <img
        src={getFileUrl(university.logoUrl)}
        alt={university.name}
        style={{ width: size, height: size }}
        className="object-contain rounded bg-white border border-gray-200 flex-shrink-0"
      />
    );
  }
  return <GraduationCap size={size} className="text-gray-300 flex-shrink-0" />;
}

export default function UniversitySelect({
  universities, value, onChange, placeholder = 'Seleccione...', disabledPlaceholder = 'Seleccione primero el país',
  disabled, error, allowOther = true, className = '',
}: UniversitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = value === OTHER_UNIVERSITY_VALUE
    ? null
    : universities?.find((u) => u.id === value);
  const isOther = value === OTHER_UNIVERSITY_VALUE;

  const filtered = useMemo(() => {
    if (!query.trim()) return universities ?? [];
    const q = query.trim().toLowerCase();
    return (universities ?? []).filter((u) => u.name.toLowerCase().includes(q));
  }, [universities, query]);

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

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setQuery('');
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
          {isOther ? (
            <>
              <PenLine size={16} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">Otra (no aparece en la lista)</span>
            </>
          ) : selected ? (
            <>
              <UniversityLogo university={selected} />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-gray-400 truncate">{disabled ? disabledPlaceholder : placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar universidad..."
              className="w-full text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => { onChange(u.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-50 ${
                  u.id === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                }`}
              >
                <UniversityLogo university={u} />
                <span className="truncate">{u.name}</span>
              </button>
            ))}
            {!filtered.length && (
              <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
            )}
            {allowOther && (
              <button
                type="button"
                onClick={() => { onChange(OTHER_UNIVERSITY_VALUE); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left border-t border-gray-100 hover:bg-gray-50 ${
                  isOther ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-500'
                }`}
              >
                <PenLine size={16} className="flex-shrink-0" />
                <span className="truncate">Otra (no aparece en la lista)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
