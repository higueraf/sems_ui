import { useQuery } from '@tanstack/react-query';
import { ChevronDown, CalendarClock } from 'lucide-react';
import { eventsApi } from '../../api/events.api';

interface EventPickerProps {
  value: string | undefined;
  onChange: (eventId: string) => void;
  className?: string;
}

/**
 * Selector de evento para vistas administrativas que por defecto muestran
 * solo el evento activo (Postulaciones, Certificados, etc.). Permite al
 * administrador consultar la información histórica de ediciones anteriores
 * sin depender de cuál evento esté marcado como "activo" en un momento dado.
 */
export default function EventPicker({ value, onChange, className }: EventPickerProps) {
  const { data: events } = useQuery({ queryKey: ['events-all'], queryFn: eventsApi.getAll });

  const sorted = [...(events ?? [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return (
    <div className={`relative ${className ?? ''}`}>
      <CalendarClock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="form-input pl-9 pr-8 py-2.5 text-sm appearance-none font-medium min-w-[220px]"
        title="Evento"
      >
        {sorted.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name}{ev.isActive ? ' · Activo' : ''}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
