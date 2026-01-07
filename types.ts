export enum UserRole {
  ADMIN = 'ADMIN',
  FINANCIAL = 'FINANCIAL',
  SECRETARY = 'SECRETARY',
  INSTRUCTOR = 'INSTRUCTOR',
  ASSOCIATE = 'ASSOCIATE',
  CANDIDATE = 'CANDIDATE',
}

export const translateRole = (role: UserRole | string): string => {
  switch (role) {
    case UserRole.ADMIN:
    case 'ADMIN':
      return 'Presidente';
    case UserRole.FINANCIAL:
    case 'FINANCIAL':
      return 'Tesoureiro(a)';
    case UserRole.SECRETARY:
    case 'SECRETARY':
      return 'Secretário(a)';
    case UserRole.INSTRUCTOR:
    case 'INSTRUCTOR':
      return 'Instrutor(a)';
    case UserRole.ASSOCIATE:
    case 'ASSOCIATE':
      return 'Associado(a)';
    case UserRole.CANDIDATE:
    case 'CANDIDATE':
      return 'Candidato(a)';
    default:
      return role;
  }
};

export const translateStatus = (status: string): string => {
  switch (status) {
    case 'ACTIVE': return 'Ativo';
    case 'INACTIVE': return 'Inativo';
    case 'PENDING': return 'Pendente';
    case 'FINISHED': return 'Concluído';
    case 'COMPLETED': return 'Concluído';
    case 'CONFIRMED': return 'Confirmado';
    case 'APPROVED': return 'Aprovado';
    case 'REJECTED': return 'Reprovado';
    case 'VOLUNTEER': return 'Voluntário';
    case 'PAID': return 'Pago';
    case 'OPEN': return 'Aberto';
    case 'LATE': return 'Em Atraso';
    case 'CANCELLED': return 'Cancelado';
    default: return status;
  }
};

export const translatePaymentStatus = (status: string): string => {
  switch (status) {
    case 'UP_TO_DATE': return 'Em Dia';
    case 'LATE': return 'Em Atraso';
    case 'PENDING': return 'Pendente';
    default: return status;
  }
};

export const translateVisibility = (visibility: string): string => {
  switch (visibility) {
    case 'PUBLIC': return 'Público';
    case 'BOARD': return 'Diretoria';
    default: return visibility;
  }
};

export const translateCondition = (condition: string): string => {
  switch (condition) {
    case 'AVAILABLE': return 'Disponível';
    case 'MAINTENANCE': return 'Manutenção';
    case 'LOW_STOCK': return 'Estoque Baixo';
    case 'CRITICAL': return 'Crítico';
    case 'ADEQUATE': return 'Adequado';
    default: return condition;
  }
};

export const translateEventType = (type: string): string => {
  switch (type) {
    case 'TRAINING': return 'Treinamento';
    case 'MEETING': return 'Reunião';
    case 'OPERATION': return 'Operação';
    case 'EVENT': return 'Evento';
    default: return type;
  }
};

export const translateTransactionType = (type: string): string => {
  switch (type) {
    case 'INCOME': return 'Entrada';
    case 'EXPENSE': return 'Saída';
    default: return type;
  }
};

export const translateCategory = (category: string): string => {
  switch (category) {
    case 'Donation': return 'Doação';
    case 'Membership': return 'Mensalidade';
    case 'Maintenance': return 'Manutenção';
    case 'Equipment': return 'Equipamento';
    case 'Other': return 'Outro';
    default: return category;
  }
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  shiftsCount?: number;
  lastShiftDate?: string;
  // Extended Profile Fields
  phone?: string;
  cpf?: string;
  susNumber?: string;
  registrationNumber?: string; // Matrícula
  bloodType?: string;
  birthDate?: string;
  address?: string;
  bio?: string;
}

export interface AccessCode {
  id: string;
  code: string;
  role: UserRole;
  limit: number | null; // null means unlimited
  used: number;
  active: boolean;
  createdAt: string;
  description?: string;
  isSystem?: boolean; // If true, cannot be deleted
}

export interface Associate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  joinDate: string;
  avatar?: string;
  paymentStatus: 'UP_TO_DATE' | 'LATE' | 'PENDING';
}

export interface FinancialMetric {
  title: string;
  value: string;
  trend: number; // positive is good, negative is bad
  trendLabel: string;
  icon: 'dollar' | 'users' | 'alert' | 'check';
}

export interface MenuItem {
  label: string;
  icon: any;
  path: string;
  allowedRoles: UserRole[];
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  status: 'COMPLETED' | 'PENDING';
  category: string;
  payer_id?: string;
  recipient_id?: string;
  notes?: string;
}

export type NotificationType = 'FINANCIAL' | 'EVENT' | 'SCHEDULE' | 'CLASSROOM' | 'AUDIT' | 'SYSTEM';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string; // ISO String
  read: boolean;
  link?: string;
  userId?: string;
  notificationId?: string; // Original ID in notifications table
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  condition: 'AVAILABLE' | 'MAINTENANCE' | 'LOW_STOCK' | 'CRITICAL' | 'ADEQUATE';
  location: string;
  lastInspection: string;
  unit?: string;
  price?: number;
  supplier?: string;
  description?: string;
  expirationDate?: string;
  entryDate?: string;
  itemType?: 'REUSABLE' | 'DISPOSABLE';
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  type: 'TRAINING' | 'MEETING' | 'OPERATION' | 'EVENT';
  confirmed: number;
  status: 'ACTIVE' | 'FINISHED';
  visibility: 'PUBLIC' | 'BOARD';
}

export interface CompanyInfo {
  id: string;
  name: string;
  corporateName: string;
  cnpj: string;
  ie: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  logo: string;
  website?: string;
}

export type ShiftMemberStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'VOLUNTEER_PENDING' | 'VOLUNTEER_APPROVED';

export interface ShiftMember {
  userId: string;
  name: string;
  avatar?: string;
  status: ShiftMemberStatus;
  type: 'ROTATION' | 'VOLUNTEER';
  confirmedAt?: string;
  joinedAt: string;
}

export type ShiftStatus = 'PENDING' | 'CONFIRMED' | 'AWAITING_CONFIRMATION' | 'FINISHED' | 'DRAFT';

export interface Shift {
  id: string;
  day: string;
  date: string; // Display string (e.g. 15/06)
  fullDate: string; // ISO string for sorting/logic
  team: string; // Title of the shift/Event
  leader: string;
  status: ShiftStatus; // Updated type
  location: string;
  startTime: string;
  endTime: string;
  amount: number;
  organizer: string;
  vacancies: number;
  description?: string;
  members: ShiftMember[]; // Replaces confirmedMembers
}

export interface SelectionStage {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface SelectionScheduleItem {
  id: string;
  date: string;
  event: string;
  done: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  breakdown?: {
    theory: number;
    simulation: number;
    internship: number;
    discipline: number;
  };
  status: 'PENDING' | 'APPROVED' | 'VOLUNTEER' | 'REJECTED';
}

export interface LandingPageStat {
  label: string;
  value: string;
  icon?: string;
}

export interface LandingPageService {
  title: string;
  description: string;
  icon?: string;
}

export interface LandingPageTestimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}

export interface LandingPageContact {
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
}

export interface LandingPageSocial {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

export interface LandingPageTheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface LandingPageConfig {
  id: string;
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  hero_badge_text?: string;

  // About Section
  about_title?: string;
  about_text: string;
  mission_text: string;
  vision_text: string;
  values_text: string;

  // Statistics Section
  stats?: LandingPageStat[];

  // Services Section
  services_title?: string;
  services_subtitle?: string;
  services?: LandingPageService[];

  // Testimonials Section
  testimonials_title?: string;
  testimonials_subtitle?: string;
  testimonials?: LandingPageTestimonial[];

  // Gallery Section
  gallery_title?: string;
  gallery_subtitle?: string;
  gallery_images: string[];

  // Contact Section
  contact?: LandingPageContact;
  social?: LandingPageSocial;

  // CTA Section
  cta_title?: string;
  cta_subtitle?: string;
  cta_button_text?: string;

  // Theme Customization
  theme?: LandingPageTheme;

  // Sections Visibility
  sections_visibility: {
    hero: boolean;
    about: boolean;
    stats: boolean;
    services: boolean;
    testimonials: boolean;
    gallery: boolean;
    contact: boolean;
    cta: boolean;
  };
}