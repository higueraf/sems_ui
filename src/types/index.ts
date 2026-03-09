export type UserRole = 'admin' | 'evaluator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Country {
  id: string;
  name: string;
  isoCode: string;
  flagEmoji: string;
  flagIconUrl?: string;
  isActive: boolean;
}

export type EventFormat = 'in_person' | 'online' | 'hybrid';

export interface ScientificEvent {
  id: string;
  name: string;
  edition?: string;
  tagline?: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  city?: string;
  country?: string;
  format: EventFormat;
  certifiedHours?: number;
  expectedAttendees?: number;
  maxPresentations?: number;
  isActive: boolean;
  isAgendaPublished: boolean;
  submissionDeadline?: string;
  reviewDeadline?: string;
  contactEmail?: string;
  contactPhone?: string;
  bannerImageUrl?: string;
  logoUrl?: string;
  pageSections?: EventPageSection[];
  thematicAxes?: ThematicAxis[];
  organizers?: Organizer[];
  guidelines?: Guideline[];
}

export interface EventPageSection {
  id: string;
  eventId: string;
  sectionKey: string;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  displayOrder: number;
  isVisible: boolean;
}

export interface ThematicAxis {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export type OrganizerRole =
  | 'host'
  | 'co_organizer'
  | 'sponsor'
  | 'scientific_committee'
  | 'organizing_committee'
  | 'keynote_speaker'
  | 'contact';

export type MemberRole =
  | 'rector'
  | 'vice_rector'
  | 'dean'
  | 'director'
  | 'researcher'
  | 'coordinator'
  | 'speaker'
  | 'panelist'
  | 'committee'
  | 'contact'
  | 'other';

export interface OrganizerMember {
  id: string;
  organizerId: string;
  fullName: string;
  academicTitle?: string;
  institutionalPosition?: string;
  role: MemberRole;
  roleLabel?: string;
  bio?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  country?: Country;
  countryId?: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface Organizer {
  id: string;
  eventId: string;
  /** 'institution' = universidad/org · 'person' = persona responsable */
  type: 'institution' | 'person';
  name: string;
  shortName?: string;
  title?: string;
  institutionalPosition?: string;
  role: OrganizerRole;
  bio?: string;
  description?: string;
  country?: Country;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  photoUrl?: string;
  displayOrder: number;
  isVisible: boolean;
  members?: OrganizerMember[];
}

export type GuidelineCategory = 'format' | 'submission' | 'evaluation' | 'publication' | 'general';

export interface Guideline {
  id: string;
  eventId: string;
  title: string;
  content: string;
  category: GuidelineCategory;
  iconName?: string;
  displayOrder: number;
  isVisible: boolean;
  /** URL relativa del archivo adjunto (PDF, PPTX, DOCX) */
  fileUrl?: string | null;
  /** Nombre original del archivo adjunto */
  fileName?: string | null;
  /** Tipo MIME del archivo */
  fileMimeType?: string | null;
}

export interface ScientificProductType {
  id: string;
  name: string;
  description?: string;
  maxAuthors?: number;
  minPages?: number;
  maxPages?: number;
  maxPresentationMinutes?: number;
  requiresFile: boolean;
  formatGuidelinesHtml?: string;
  isActive: boolean;
}

export type SubmissionStatus =
  | 'received'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'scheduled';

export interface SubmissionAuthor {
  id: string;
  submissionId: string;
  fullName: string;
  academicTitle?: string;
  affiliation?: string;
  email: string;
  orcid?: string;
  phone?: string;
  country?: Country;
  countryId?: string;
  city?: string;
  isCorresponding: boolean;
  authorOrder: number;
  /** Foto del ponente, subida por admin/evaluador tras aprobación */
  photoUrl?: string;
}

export interface SubmissionStatusHistory {
  id: string;
  submissionId: string;
  previousStatus?: SubmissionStatus;
  newStatus: SubmissionStatus;
  notes?: string;
  internalNotes?: string;
  changedBy?: User;
  notifiedApplicant: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  referenceCode: string;
  eventId: string;
  thematicAxis: ThematicAxis;
  productType: ScientificProductType;
  titleEs: string;
  titleEn?: string;
  abstractEs: string;
  abstractEn?: string;
  keywordsEs?: string;
  keywordsEn?: string;
  introduction?: string;
  methodology?: string;
  results?: string;
  discussion?: string;
  conclusions?: string;
  bibliography?: string;
  fileUrl?: string;
  fileName?: string;
  plagiarismScore?: number;
  status: SubmissionStatus;
  assignedEvaluatorId?: string;
  country?: Country;
  usesAi?: boolean;
  aiUsageDescription?: string;
  pageCount?: number;
  authors: SubmissionAuthor[];
  statusHistory?: SubmissionStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export type AgendaSlotType = 'keynote' | 'presentation' | 'break' | 'ceremony' | 'workshop' | 'panel';

export interface AgendaSlot {
  id: string;
  eventId: string;
  type: AgendaSlotType;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  title?: string;
  description?: string;
  submission?: Submission;
  submissionId?: string;
  thematicAxis?: ThematicAxis;
  thematicAxisId?: string;
  speakerName?: string;
  speakerAffiliation?: string;
  moderatorName?: string;
  displayOrder: number;
  isPublished: boolean;
  speakerNotified: boolean;
}

export interface SubmissionStats {
  total: number;
  byStatus: Record<SubmissionStatus, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}
