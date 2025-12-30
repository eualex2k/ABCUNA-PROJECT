import { UserRole, Associate, Transaction, FinancialMetric } from './types';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  CalendarDays,
  RefreshCcw,
  FileText,
  GraduationCap,
  UserPlus,
  Settings,
  Building2
} from 'lucide-react';

export const MOCK_USER = {
  id: '1',
  name: 'Comandante Silva',
  email: 'cmte.silva@abcuna.org.br',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/200/200',
};

export const MENU_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', allowedRoles: [UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE] },
  { label: 'Empresa', icon: Building2, path: '/company', allowedRoles: [UserRole.ADMIN] },
  { label: 'Associados', icon: Users, path: '/associates', allowedRoles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL] },
  { label: 'Financeiro', icon: DollarSign, path: '/financial', allowedRoles: [UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY] },
  { label: 'Estoque', icon: Package, path: '/inventory', allowedRoles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL] },
  { label: 'Eventos', icon: CalendarDays, path: '/events', allowedRoles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.ASSOCIATE, UserRole.FINANCIAL] },
  { label: 'Escala', icon: RefreshCcw, path: '/schedule', allowedRoles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.ASSOCIATE, UserRole.FINANCIAL] },
  { label: 'Auditoria', icon: FileText, path: '/audit', allowedRoles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL, UserRole.ASSOCIATE, UserRole.INSTRUCTOR, UserRole.CANDIDATE] },
  { label: 'Sala de Aula', icon: GraduationCap, path: '/classroom', allowedRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.SECRETARY, UserRole.FINANCIAL] },
  { label: 'Processo Seletivo', icon: UserPlus, path: '/selection', allowedRoles: [UserRole.ADMIN, UserRole.CANDIDATE] },
  { label: 'Configurações', icon: Settings, path: '/settings/codes', allowedRoles: [UserRole.ADMIN] },
];

export const MOCK_ASSOCIATES: Associate[] = [
  { id: '1', name: 'João Souza', email: 'joao@abcuna.org', phone: '(83) 99999-0001', role: 'Bombeiro Líder', status: 'ACTIVE', joinDate: '2023-01-15', paymentStatus: 'UP_TO_DATE' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@abcuna.org', phone: '(83) 99999-0002', role: 'Socorrista', status: 'ACTIVE', joinDate: '2023-03-10', paymentStatus: 'LATE' },
  { id: '3', name: 'Pedro Santos', email: 'pedro@abcuna.org', phone: '(83) 99999-0003', role: 'Motorista', status: 'INACTIVE', joinDate: '2022-11-05', paymentStatus: 'PENDING' },
  { id: '4', name: 'Ana Costa', email: 'ana@abcuna.org', phone: '(83) 99999-0004', role: 'Estagiário', status: 'PENDING', joinDate: '2024-01-20', paymentStatus: 'UP_TO_DATE' },
  { id: '5', name: 'Carlos Lima', email: 'carlos@abcuna.org', phone: '(83) 99999-0005', role: 'Bombeiro Civil', status: 'ACTIVE', joinDate: '2023-06-12', paymentStatus: 'UP_TO_DATE' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Mensalidade - João Souza', amount: 30.00, type: 'INCOME', date: '2024-05-10', status: 'COMPLETED', category: 'Mensalidades' },
  { id: '2', description: 'Compra de EPIs', amount: 450.00, type: 'EXPENSE', date: '2024-05-08', status: 'COMPLETED', category: 'Equipamentos' },
  { id: '3', description: 'Manutenção Viatura 01', amount: 1200.00, type: 'EXPENSE', date: '2024-05-05', status: 'PENDING', category: 'Manutenção' },
  { id: '4', description: 'Doação Externa', amount: 500.00, type: 'INCOME', date: '2024-05-01', status: 'COMPLETED', category: 'Doações' },
  { id: '5', description: 'Mensalidade - Carlos Lima', amount: 30.00, type: 'INCOME', date: '2024-05-10', status: 'COMPLETED', category: 'Mensalidades' },
];

export const FINANCIAL_METRICS: FinancialMetric[] = [
  { title: 'Receita do Mês', value: 'R$ 2.450,00', trend: 12, trendLabel: 'vs. mês anterior', icon: 'dollar' },
  { title: 'Mensalidades Pendentes', value: '14', trend: -5, trendLabel: 'Melhora de 5%', icon: 'users' },
  { title: 'Gastos Operacionais', value: 'R$ 1.650,00', trend: -2, trendLabel: 'Dentro do orçamento', icon: 'check' },
  { title: 'Equipamentos Críticos', value: '3 Itens', trend: 0, trendLabel: 'Requer atenção', icon: 'alert' },
];