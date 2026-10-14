import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

export interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    options?: { title?: string; duration?: number } | number
  ) => string;
  success: (message: string, options?: { title?: string; duration?: number } | number) => string;
  error: (message: string, options?: { title?: string; duration?: number } | number) => string;
  info: (message: string, options?: { title?: string; duration?: number } | number) => string;
  warning: (message: string, options?: { title?: string; duration?: number } | number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE_TOASTS = 3;

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  warning: 6500,
  error: 8000, // Erros permanecem mais tempo para leitura completa
};

// Singleton para acesso imperativo caso necessário fora de componentes React
let globalToastHandler: ToastContextType | null = null;
export const toast = {
  show: (
    message: string,
    type?: ToastType,
    options?: { title?: string; duration?: number } | number
  ) => globalToastHandler?.showToast(message, type, options) ?? '',
  success: (message: string, options?: { title?: string; duration?: number } | number) =>
    globalToastHandler?.success(message, options) ?? '',
  error: (message: string, options?: { title?: string; duration?: number } | number) =>
    globalToastHandler?.error(message, options) ?? '',
  info: (message: string, options?: { title?: string; duration?: number } | number) =>
    globalToastHandler?.info(message, options) ?? '',
  warning: (message: string, options?: { title?: string; duration?: number } | number) =>
    globalToastHandler?.warning(message, options) ?? '',
  remove: (id: string) => globalToastHandler?.removeToast(id),
  clearAll: () => globalToastHandler?.clearAll(),
};

interface ToastCardProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(toast.duration);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onClose(toast.id);
    }, remainingTime);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, remainingTime, toast.id, onClose]);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const newRemaining = Math.max(remainingTime - elapsed, 1000);
    setRemainingTime(newRemaining);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />,
    info: <Info size={18} className="text-blue-600 flex-shrink-0" />,
  };

  const styleConfigs: Record<
    ToastType,
    {
      borderColor: string;
      accentBg: string;
      titleColor: string;
      defaultTitle: string;
    }
  > = {
    success: {
      borderColor: 'border-emerald-200',
      accentBg: 'bg-emerald-50 border-emerald-100',
      titleColor: 'text-emerald-900',
      defaultTitle: 'Sucesso',
    },
    error: {
      borderColor: 'border-rose-200',
      accentBg: 'bg-rose-50 border-rose-100',
      titleColor: 'text-rose-900',
      defaultTitle: 'Atenção / Erro',
    },
    warning: {
      borderColor: 'border-amber-200',
      accentBg: 'bg-amber-50 border-amber-100',
      titleColor: 'text-amber-900',
      defaultTitle: 'Aviso',
    },
    info: {
      borderColor: 'border-blue-200',
      accentBg: 'bg-blue-50 border-blue-100',
      titleColor: 'text-blue-900',
      defaultTitle: 'Informação',
    },
  };

  const config = styleConfigs[toast.type];

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        pointer-events-auto
        w-full
        bg-white
        border ${config.borderColor}
        rounded-xl
        p-4
        shadow-xl
        flex
        items-start
        gap-3
        transform
        transition-all
        duration-300
        ease-out
        translate-x-0
        motion-reduce:transform-none
        motion-reduce:transition-none
        relative
        overflow-hidden
      `}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${config.accentBg}`}
      >
        {icons[toast.type]}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className={`text-xs font-bold tracking-wide uppercase mb-0.5 ${config.titleColor}`}>
            {toast.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Fechar notificação"
        className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [queue, setQueue] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
    setQueue([]);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: { title?: string; duration?: number } | number
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration =
        typeof options === 'number'
          ? options
          : options?.duration || DEFAULT_DURATIONS[type];
      const title = typeof options === 'object' ? options?.title : undefined;

      const newToast: ToastItem = {
        id,
        message,
        title,
        type,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        if (prev.length < MAX_VISIBLE_TOASTS) {
          return [...prev, newToast];
        } else {
          // Adiciona na fila sem descartar
          setQueue((q) => [...q, newToast]);
          return prev;
        }
      });

      return id;
    },
    []
  );

  // Monitora quando abre espaço entre os toasts visíveis e promove itens da fila
  useEffect(() => {
    if (toasts.length < MAX_VISIBLE_TOASTS && queue.length > 0) {
      const slotsAvailable = MAX_VISIBLE_TOASTS - toasts.length;
      const nextToasts = queue.slice(0, slotsAvailable);
      const remainingQueue = queue.slice(slotsAvailable);

      setToasts((prev) => [...prev, ...nextToasts]);
      setQueue(remainingQueue);
    }
  }, [toasts.length, queue]);

  const success = useCallback(
    (message: string, options?: { title?: string; duration?: number } | number) =>
      showToast(message, 'success', options),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: { title?: string; duration?: number } | number) =>
      showToast(message, 'error', options),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: { title?: string; duration?: number } | number) =>
      showToast(message, 'info', options),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: { title?: string; duration?: number } | number) =>
      showToast(message, 'warning', options),
    [showToast]
  );

  const contextValue: ToastContextType = {
    showToast,
    success,
    error,
    info,
    warning,
    removeToast,
    clearAll,
  };

  useEffect(() => {
    globalToastHandler = contextValue;
    return () => {
      globalToastHandler = null;
    };
  }, [contextValue]);

  const canUseDOM = typeof document !== 'undefined';

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {canUseDOM &&
        createPortal(
          <div
            aria-live="polite"
            style={{ zIndex: 99999 }}
            className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2.5 pointer-events-none"
          >
            {toasts.map((item) => (
              <ToastCard key={item.id} toast={item} onClose={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
};
