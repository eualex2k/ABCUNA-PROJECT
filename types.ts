export enum UserRole {
  ADMIN = 'ADMIN',
  FINANCIAL = 'FINANCIAL',
  SECRETARY = 'SECRETARY',
  INSTRUCTOR = 'INSTRUCTOR',
  ASSOCIATE = 'ASSOCIATE',
  CANDIDATE = 'CANDIDATE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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

export interface Shift {
  id: string;
  day: string;
  date: string; // Display string (e.g. 15/06)
  fullDate: string; // ISO string for sorting/logic
  team: string; // Title of the shift/Event
  leader: string;
  status: 'CONFIRMED' | 'PENDING';
  location: string;
  startTime: string;
  endTime: string;
  amount: number;
  organizer: string;
  vacancies: number;
  description?: string;
  confirmedMembers: string[]; // List of names
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