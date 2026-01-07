import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';

// --- Card Component ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg";

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
  const isDate = props.type === 'date' || props.type === 'datetime-local';

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
    if (isDate && inputRef.current) {
      try {
        if ('showPicker' in inputRef.current) {
          inputRef.current.showPicker();
        }
      } catch (error) { }
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

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type={props.type || (isNumericMask ? "tel" : "text")}
          inputMode={isNumericMask ? "numeric" : props.inputMode}
          maxLength={getMaxLength(props.mask) || props.maxLength}
          className={`w-full ${getMinWidth(props.mask)} h-12 px-5 bg-white border border-slate-300 rounded-lg text-base shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${error ? 'border-red-500' : ''} ${className} ${isDate ? 'pr-12' : ''} ${icon ? 'pl-11' : ''}`}
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
    </div>
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
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
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
export const StatCard: React.FC<{ title: string; value: string; trend?: string; trendUp?: boolean; icon: React.ReactNode }> = ({ title, value, trend, trendUp, icon }) => (
  <Card className="p-6 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-brand-50 rounded-lg text-brand-600">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  </Card>
);

// --- Modal Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'lg' }) => {
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
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-md flex-shrink-0">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
};