import { useQuery } from '@tanstack/react-query';
import { Globe, Mail, Building2, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { eventsApi } from '../../api/events.api';
import { organizersApi } from '../../api/index';
import { Organizer, OrganizerMember } from '../../types';
import { ORGANIZER_ROLE_LABELS, getFileUrl } from '../../utils';
import { useTheme } from '../../hooks/useTheme';

// ─── Etiquetas de rol de miembro ─────────────────────────────────────────────
const MEMBER_ROLE_LABELS: Record<string, string> = {
  rector:       'Rector/a',
  vice_rector:  'Vicerrector/a',
  dean:         'Decano/a',
  director:     'Director/a',
  researcher:   'Investigador/a',
  coordinator:  'Coordinador/a',
  speaker:      'Conferencista',
  panelist:     'Panelista',
  committee:    'Comité Organizador',
  contact:      'Contacto',
  other:        'Colaborador/a',
};

const PERSON_ROLE_LABELS: Record<string, string> = {
  organizing_committee: 'Comité Organizador',
  scientific_committee: 'Comité Científico',
  keynote_speaker:      'Conferencista',
  contact:              'Contacto',
  co_organizer:         'Co-organizador/a',
};

// ─── Sección con título ───────────────────────────────────────────────────────
function Section({
  title, children, heading, divider,
}: {
  title: string;
  children: ReactNode;
  heading: string;
  divider: string;
}) {
  return (
    <section>
      <h2 className={`font-heading font-bold text-2xl mb-2 ${heading}`}>{title}</h2>
      <div className={`w-12 h-1 rounded-full mb-8 ${divider}`} />
      {children}
    </section>
  );
}

// ─── Tarjeta de institución ───────────────────────────────────────────────────
function InstitutionCard({ org, isDark }: { org: Organizer; isDark: boolean }) {
  const card       = isDark ? 'bg-gray-800 border-white/10'  : 'bg-white border-gray-100';
  const nameClr    = isDark ? 'text-gray-100'                : 'text-gray-900';
  const textMut    = isDark ? 'text-gray-400'                : 'text-gray-500';
  const green      = isDark ? 'text-primary-400'             : 'text-primary-600';
  const borderLine = isDark ? 'border-white/10'              : 'border-gray-100';
  const avatarBg   = isDark ? 'bg-primary-900/50 text-primary-300' : 'bg-primary-50 text-primary-600';
  const roleBadge  = org.role === 'host'
    ? (isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700')
    : (isDark ? 'bg-gray-700 text-gray-300'       : 'bg-gray-100 text-gray-600');

  return (
    <div className={`${card} rounded-xl shadow-sm border p-5 flex flex-col hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-4 mb-3">
        {/* Logo */}
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0
          border ${borderLine} ${org.logoUrl ? 'bg-white p-1.5' : avatarBg}`}>
          {org.logoUrl ? (
            <img
              src={getFileUrl(org.logoUrl)}
              alt={org.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <Building2 size={26} className="opacity-50" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-heading font-bold text-sm leading-tight mb-1 ${nameClr}`}>
            {org.name}
          </h3>
          {org.shortName && (
            <p className={`text-sm font-bold ${green}`}>{org.shortName}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {org.country && (
              <span className="text-sm" title={org.country.name}>{org.country.flagEmoji}</span>
            )}
            <span className={`badge text-xs ${roleBadge}`}>
              {ORGANIZER_ROLE_LABELS[org.role] || org.role}
            </span>
          </div>
        </div>
      </div>

      {(org.description || org.bio) && (
        <p className={`text-xs leading-relaxed mb-3 ${textMut}`}>{org.description || org.bio}</p>
      )}

      {org.website && (
        <a
          href={org.website}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 text-xs mt-auto hover:underline ${green}`}
        >
          <Globe size={12} /> Sitio web
        </a>
      )}
    </div>
  );
}

// ─── Tarjeta de persona (type=person en organizers OR OrganizerMember) ────────
function PersonCard({
  name,
  title,
  position,
  roleLabel,
  bio,
  email,
  photoUrl,
  countryEmoji,
  isDark,
}: {
  name: string;
  title?: string;
  position?: string;
  roleLabel?: string;
  bio?: string;
  email?: string;
  photoUrl?: string;
  countryEmoji?: string;
  isDark: boolean;
}) {
  const card    = isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100';
  const nameClr = isDark ? 'text-gray-100'               : 'text-gray-900';
  const textMut = isDark ? 'text-gray-400'               : 'text-gray-500';
  const green   = isDark ? 'text-primary-400'            : 'text-primary-600';
  const avatarBg = isDark ? 'bg-gray-700'                : 'bg-gray-100';
  const roleBadge = isDark ? 'bg-primary-900/40 text-primary-300' : 'bg-primary-50 text-primary-700';

  return (
    <div className={`${card} rounded-xl shadow-sm border p-5 flex flex-col items-center text-center
      hover:shadow-md transition-all duration-200`}>
      {/* Foto circular */}
      <div className="mb-4 relative">
        {photoUrl ? (
          <img
            src={getFileUrl(photoUrl)}
            alt={name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
          />
        ) : (
          <div className={`w-24 h-24 rounded-full ${avatarBg} flex items-center justify-center
            ring-4 ring-white shadow-md`}>
            <User size={36} className={isDark ? 'text-gray-500' : 'text-gray-300'} />
          </div>
        )}
      </div>

      {/* Nombre + título */}
      <h3 className={`font-heading font-bold text-sm leading-tight ${nameClr}`}>
        {title ? <span className={`${green} mr-1`}>{title}</span> : null}
        {name}
      </h3>

      {/* Cargo institucional */}
      {position && (
        <p className={`text-xs mt-1 ${textMut}`}>{position}</p>
      )}

      {/* Rol en el simposio */}
      {roleLabel && (
        <span className={`badge text-[10px] mt-2 ${roleBadge}`}>{roleLabel}</span>
      )}

      {/* País */}
      {countryEmoji && (
        <span className={`text-sm mt-2 ${textMut}`}>{countryEmoji}</span>
      )}

      {/* Bio (3 líneas máx) */}
      {bio && (
        <p className={`text-xs mt-3 leading-relaxed line-clamp-3 ${textMut}`}>{bio}</p>
      )}

      {/* Email */}
      {email && (
        <a href={`mailto:${email}`}
          className={`flex items-center gap-1 text-xs mt-3 hover:underline ${green}`}>
          <Mail size={11} /> {email}
        </a>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function OrganizersPage() {
  const { isDark } = useTheme();

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const { data: organizers, isLoading } = useQuery({
    queryKey: ['organizers-public', event?.id],
    queryFn: () => organizersApi.getPublic(event!.id),
    enabled: !!event?.id,
  });

  // ── Separar instituciones de personas ──────────────────────────────────────
  const institutions = (organizers ?? []).filter((o) => o.type === 'institution');
  const legacyPersons = (organizers ?? []).filter((o) => o.type === 'person');

  const host    = institutions.find((o) => o.role === 'host');
  const coOrgs  = institutions.filter((o) => o.role !== 'host');

  // Miembros del nuevo modelo (organizer_members), de cualquier institución
  const memberCards: OrganizerMember[] = (organizers ?? [])
    .flatMap((o) => (o.members ?? []).filter((m) => m.isVisible))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.fullName.localeCompare(b.fullName));

  // ── Colores según modo ──────────────────────────────────────────────────────
  const bg      = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const heading = isDark ? 'text-white'  : 'text-primary-900';
  const divider = isDark ? 'bg-primary-500' : 'bg-amber-500';
  const skCard  = isDark ? 'bg-gray-800' : 'bg-gray-200';

  const hasPersons = legacyPersons.length > 0 || memberCards.length > 0;

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className={`py-16 relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-primary-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border border-white/5" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className={`text-[11px] font-bold uppercase tracking-[0.2em] block mb-3
            ${isDark ? 'text-primary-400' : 'text-primary-200'}`}>
            {event?.name || 'II Simposio Internacional de Ciencia Abierta'}
          </span>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">
            Organizadores
          </h1>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mb-5" />
          <p className={`max-w-2xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-primary-100'}`}>
            Instituciones y personas responsables de la organización del {event?.name}
          </p>
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`${skCard} rounded-xl animate-pulse h-40`} />
            ))}
          </div>
        ) : (
          <>
            {/* ── 1. Institución anfitriona ─────────────────────────── */}
            {host && (
              <Section title="Institución Anfitriona" heading={heading} divider={divider}>
                <div className="max-w-xs">
                  <InstitutionCard org={host} isDark={isDark} />
                </div>
              </Section>
            )}

            {/* ── 2. Co-organizadoras ───────────────────────────────── */}
            {coOrgs.length > 0 && (
              <Section title="Instituciones Co-Organizadoras" heading={heading} divider={divider}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {coOrgs.map((org) => (
                    <InstitutionCard key={org.id} org={org} isDark={isDark} />
                  ))}
                </div>
              </Section>
            )}

            {/* ── 3. Equipo organizador (personas) ──────────────────── */}
            {hasPersons && (
              <Section title="Equipo Organizador" heading={heading} divider={divider}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">

                  {/* Personas del modelo legacy (type=person en organizers) */}
                  {legacyPersons.map((p) => (
                    <PersonCard
                      key={p.id}
                      name={p.name}
                      title={p.title}
                      position={p.institutionalPosition}
                      roleLabel={PERSON_ROLE_LABELS[p.role] || ORGANIZER_ROLE_LABELS[p.role] || p.role}
                      bio={p.bio}
                      email={p.email}
                      photoUrl={p.photoUrl}
                      countryEmoji={p.country?.flagEmoji}
                      isDark={isDark}
                    />
                  ))}

                  {/* Miembros del nuevo modelo (organizer_members) */}
                  {memberCards.map((m) => (
                    <PersonCard
                      key={m.id}
                      name={m.fullName}
                      title={m.academicTitle}
                      position={m.institutionalPosition}
                      roleLabel={m.roleLabel || MEMBER_ROLE_LABELS[m.role] || m.role}
                      bio={m.bio}
                      email={m.email}
                      photoUrl={m.photoUrl}
                      countryEmoji={m.country?.flagEmoji}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* ── Estado vacío ──────────────────────────────────────── */}
            {!host && coOrgs.length === 0 && !hasPersons && (
              <div className="text-center py-24 opacity-40">
                <Building2 size={48} className="mx-auto mb-4" />
                <p className="text-lg">Información de organizadores próximamente</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
