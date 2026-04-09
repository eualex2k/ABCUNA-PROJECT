import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui';

export const AccessDenied: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-red-50">
                    <ShieldAlert size={40} />
                </div>
                
                <h1 className="text-2xl font-black text-slate-800 mb-2">Acesso Negado</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Ops! Parece que você não tem permissão para acessar esta área do sistema. 
                    Se acredita que isso é um erro, entre em contato com o administrador.
                </p>

                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={() => navigate('/')} 
                        className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Ir para o Dashboard
                    </Button>
                    
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors py-2"
                    >
                        <ArrowLeft size={16} />
                        Voltar para a página anterior
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Sistema de Gestão Integrada - ABCUNA
                    </p>
                </div>
            </div>
        </div>
    );
};
