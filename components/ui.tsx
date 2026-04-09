import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Loader2, ChevronLeft, ChevronRight, Check, ChevronDown, Search } from 'lucide-react';

// --- Skeleton Component ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 animate-pulse-subtle rounded ${className}`} />
);

// --- Loading Overlay ---
export const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl animate-in fade-in duration-300">
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100">
      <Loader2 className="animate-spin text-brand-600" size={18} />
      <span className="text-sm font-bold text-slate-700">Carregando...</span>
    </div>
  </div>
);

// --- Card Component ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; glass?: boolean; hover?: boolean }> = ({
  children,
  className = '',
  onClick,
  glass = false,
  hover = true
}) => (
  <div
    onClick={onClick}
    className={`
      rounded-xl transition-all duration-300
      ${glass ? 'glass shadow-premium' : 'bg-white border border-slate-100 shadow-sm'}
      ${hover ? 'hover:shadow-md hover:border-slate-200' : ''}
      ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} 
      ${className}
    `}
  >
    {children}
  </div>
);

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg";

  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500 shadow-sm",
    outline: "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-brand-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
  mask?: 'phone' | 'cpf' | 'cnpj' | 'date' | 'cep' | 'cns';
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', onClick, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const isDate = props.type === 'date';

  const isNumericMask = props.mask && ['phone', 'cpf', 'cnpj', 'cep', 'cns'].includes(props.mask);

  const applyMask = (value: string, maskType: string) => {
    const numbers = value.replace(/\D/g, '');

    switch (maskType) {
      case 'phone':
        if (numbers.length <= 10) {
          // Telefone fixo: (DD) XXXX-XXXX
          return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
          // Celular: (DD) 9XXXX-XXXX
          return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
        }
      case 'cpf':
        return numbers
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2')
          .replace(/(-\d{2})\d+?$/, '$1');
      case 'cnpj':
        return numbers
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
          .replace(/(-\d{2})\d+?$/, '$1');
      case 'cep':
        return numbers
          .replace(/(\d{5})(\d)/, '$1-$2')
          .replace(/(-\d{3})\d+?$/, '$1');
      case 'cns':
        return numbers
          .replace(/(\d{3})(\d)/, '$1 $2')
          .replace(/(\d{4})(\d)/, '$1 $2')
          .replace(/(\d{4})(\d)/, '$1 $2')
          .replace(/(\d{4})\d+?$/, '$1');
      default:
        return value;
    }
  };

  const getMaxLength = (maskType?: string) => {
    switch (maskType) {
      case 'phone': return 15; // (00) 00000-0000
      case 'cpf': return 14;   // 000.000.000-00
      case 'cnpj': return 18;  // 00.000.000/0000-00
      case 'cep': return 9;    // 00000-000
      case 'cns': return 18;   // 000 0000 0000 0000
      default: return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (props.mask) {
      const masked = applyMask(e.target.value, props.mask);
      e.target.value = masked;
    }
    if (props.onChange) props.onChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (props.mask && isNumericMask) {
      // Allow control keys
      const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
      if (controlKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) {
        return;
      }

      // Prevent non-numeric characters
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (onClick) onClick(e);
    if (isDate) {
      setIsCalendarOpen(true);
    }
  };

  // Define largura mínima baseada no tipo de máscara para garantir que todos os dígitos sejam visíveis
  const getMinWidth = (maskType?: string) => {
    switch (maskType) {
      case 'phone': return 'min-w-[200px]';    // (00) 00000-0000
      case 'cpf': return 'min-w-[180px]';      // 000.000.000-00
      case 'cnpj': return 'min-w-[220px]';     // 00.000.000/0000-00
      case 'cep': return 'min-w-[140px]';      // 00000-000
      case 'cns': return 'min-w-[240px]';      // 000 0000 0000 0000
      default: return '';
    }
  };

  const getDisplayValue = () => {
    if (isDate && props.value) {
      try {
        const date = new Date(props.value as string + 'T12:00:00');
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR');
        }
      } catch (e) {
        console.error("Date formatting error", e);
      }
    }
    return props.value || '';
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type={isDate ? "text" : (props.type || (isNumericMask ? "tel" : "text"))}
          value={getDisplayValue()}
          readOnly={isDate}
          inputMode={isNumericMask ? "numeric" : props.inputMode}
          maxLength={getMaxLength(props.mask) || props.maxLength}
          className={`w-full ${getMinWidth(props.mask)} h-12 px-5 bg-white border border-slate-300 rounded-lg text-base shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${error ? 'border-red-500' : ''} ${className} ${isDate ? 'pr-12 cursor-pointer' : ''} ${icon ? 'pl-11' : ''}`}
          onClick={handleInputClick}
          {...props}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {icon && (
          <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        {isDate && (
          <div
            className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center text-slate-400 pointer-events-none"
            aria-hidden="true"
          >
            <Calendar size={18} />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isDate && (
        <DatePickerModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          value={props.value as string}
          onChange={(val) => {
            // Se for nulo ou vazio, passa vazio
            const finalVal = val || '';
            const event = {
                target: { value: finalVal, name: props.name },
                currentTarget: { value: finalVal, name: props.name }
            } as any;
            if (props.onChange) props.onChange(event);
            setIsCalendarOpen(false);
          }}
        />
      )}
    </div>
  );
};

// --- Custom Calendar Picker Modal ---
interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (val: string) => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ isOpen, onClose, value, onChange }) => {
    const today = new Date();
    
    // Garantir que temos uma data válida para visualização inicial
    const getInitialDate = () => {
        if (!value) return today;
        const d = new Date(value + 'T12:00:00');
        return isNaN(d.getTime()) ? today : d;
    };

    const [viewDate, setViewDate] = React.useState(new Date(getInitialDate().getFullYear(), getInitialDate().getMonth(), 1));
    const [view, setView] = React.useState<'DAYS' | 'MONTHS' | 'YEARS'>('DAYS');
    const [yearSearch, setYearSearch] = React.useState('');

    // Sincronizar quando o modal abre ou o valor muda externamente
    React.useEffect(() => {
        if (isOpen) {
            const current = getInitialDate();
            setViewDate(new Date(current.getFullYear(), current.getMonth(), 1));
            setView('DAYS');
            setYearSearch('');
        }
    }, [isOpen, value]);

    const monthName = viewDate.toLocaleString('pt-BR', { month: 'long' });
    const year = viewDate.getFullYear();

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 10; y >= 1900; y--) {
        if (yearSearch === '' || y.toString().includes(yearSearch)) {
            years.push(y);
        }
    }

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-11 w-11" />);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = value === dateStr;
            const isToday = today.toISOString().split('T')[0] === dateStr;

            days.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => onChange(dateStr)}
                    className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                        ${isSelected ? 'bg-slate-900 text-white shadow-lg' : isToday ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Data" maxWidth="sm">
            <div className="p-1 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                        <button 
                            type="button" 
                            onClick={() => setView(view === 'MONTHS' ? 'DAYS' : 'MONTHS')}
                            className={`text-lg font-black uppercase tracking-tight flex items-center gap-1 transition-colors ${view === 'MONTHS' ? 'text-brand-600' : 'text-slate-900 hover:text-brand-600'}`}
                        >
                            {monthName}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${view === 'MONTHS' ? 'rotate-180' : ''}`} />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setView(view === 'YEARS' ? 'DAYS' : 'YEARS')}
                            className={`text-[10px] font-black tracking-[0.2em] flex items-center gap-1 transition-colors ${view === 'YEARS' ? 'text-brand-600' : 'text-slate-400 hover:text-brand-600'}`}
                        >
                            {year}
                            <ChevronDown size={10} className={`transition-transform duration-300 ${view === 'YEARS' ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    {view === 'DAYS' && (
                        <div className="flex gap-1">
                            <button type="button" onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900"><ChevronLeft size={20} /></button>
                            <button type="button" onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>

                <div className="relative flex-1">
                    {view === 'DAYS' && (
                        <div className="animate-in fade-in duration-300">
                             <div className="grid grid-cols-7 gap-1 mb-2">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                                    <div key={idx} className="h-10 w-11 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderDays()}
                            </div>
                        </div>
                    )}

                    {view === 'MONTHS' && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-200">
                            {months.map((m, i) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setViewDate(new Date(viewDate.getFullYear(), i, 1));
                                        setView('DAYS');
                                    }}
                                    className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewDate.getMonth() === i ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                >
                                    {m.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'YEARS' && (
                        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                            <div className="mb-4 relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Buscar ano..." 
                                    className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-brand-500"
                                    value={yearSearch}
                                    onChange={e => setYearSearch(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                                {years.map(y => (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => {
                                            setViewDate(new Date(y, viewDate.getMonth(), 1));
                                            setView('DAYS');
                                            setYearSearch('');
                                        }}
                                        className={`py-2 rounded-lg text-[11px] font-black transition-all ${viewDate.getFullYear() === y ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Hoje: {today.toLocaleDateString('pt-BR')}</span>
                    <button type="button" onClick={() => { onChange(today.toISOString().split('T')[0]); setView('DAYS'); }} className="text-brand-600 hover:underline">Ir para hoje</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Textarea Component ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>}
      <textarea
        className={`w-full p-4 bg-white border border-slate-300 rounded-lg text-base shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'; className?: string }> = ({ children, variant = 'neutral', className = '' }) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- Avatar Component ---
export const Avatar: React.FC<{
  src?: string;
  alt: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: boolean;
  className?: string;
}> = ({ src, alt, fallback, size = 'md', border, shadow, className = '' }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-slate-600 font-bold ${border ? 'border-2 border-white' : 'border border-white'} ${shadow ? 'shadow-md' : 'shadow-sm'} ring-1 ring-slate-100 flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
};

// --- Stat Card Component ---
export const StatCard: React.FC<{
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ title, value, trend, trendUp, icon, loading = false }) => (
  <Card className="p-4 sm:p-6 flex flex-col justify-between h-full hover-lift" glass={false}>
    {loading ? (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-32 h-8" />
        </div>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-brand-50 rounded-lg text-brand-600 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          {trend && (
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {trend}
            </span>
          )}
        </div>
        <div className="animate-slide-up flex flex-col mobile-items-center sm:items-start text-center sm:text-left">
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
      </>
    )}
  </Card>
);

// --- Modal Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'lg' }) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
};