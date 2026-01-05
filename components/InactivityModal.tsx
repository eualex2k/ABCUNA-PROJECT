import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface InactivityModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onTimeout: () => void;
    timeoutSeconds?: number;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
    isOpen,
    onConfirm,
    onTimeout,
    timeoutSeconds = 60
}) => {
    const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);

    useEffect(() => {
        if (!isOpen) {
            setSecondsLeft(timeoutSeconds);
            return;
        }

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, timeoutSeconds, onTimeout]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6 animate-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                    <AlertTriangle size={40} />
                </div>

                {/* Content */}
                <div className="text-center space-y-3">
                    <h2 className="text-2xl font-black text-slate-900">
                        Você ainda está aí?
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Detectamos que você está inativo há algum tempo. Por questões de segurança,
                        sua sessão será encerrada automaticamente em:
                    </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                                <span className="text-3xl font-black text-slate-900">
                                    {secondsLeft}
                                </span>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                            segundos
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(secondsLeft / timeoutSeconds) * 100}%` }}
                    />
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onConfirm}
                        className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sim, estou aqui!
                    </button>

                    <button
                        onClick={onTimeout}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Fazer Logout
                    </button>
                </div>

                {/* Info */}
                <p className="text-xs text-slate-400 text-center">
                    Clique em "Sim, estou aqui!" para continuar usando o sistema
                </p>
            </div>
        </div>
    );
};
