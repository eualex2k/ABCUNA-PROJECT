import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [isSessionReady, setIsSessionReady] = useState(false);

    useEffect(() => {
        // Aguardar um pequeno momento para o Supabase processar o token e estabelecer a sessão
        const timer = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsSessionReady(true);
            } else {
                // Tenta uma última vez após outro intervalo ou avisa erro
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) setIsSessionReady(true);
                    else setError('Sessão de segurança não encontrada. Por favor, tente clicar no link do e-mail novamente.');
                }, 1000);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                navigate('/auth');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Senha Alterada!</h2>
                        <p className="text-slate-500 font-medium">Sua nova senha foi salva com sucesso. Você será redirecionado para o login em instantes.</p>
                    </div>
                    <Button onClick={() => navigate('/auth')} className="w-full">Ir para Login Agora</Button>
                </Card>
            </div>
        );
    }

    if (!isSessionReady && !error) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-white mx-auto" size={48} />
                    <p className="text-slate-400 font-medium animate-pulse">Validando acesso seguro...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-500/20 mb-4">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Nova Senha</h1>
                    <p className="text-slate-400 font-medium">Crie uma nova senha forte para sua conta.</p>
                </div>

                <Card className="p-8 shadow-2xl border-0">
                    <form onSubmit={handleReset} className="space-y-6">
                        <Input
                            label="Nova Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            icon={<Lock size={18} />}
                        />
                        <Input
                            label="Confirmar Nova Senha"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            icon={<ShieldCheck size={18} />}
                        />

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-center gap-3">
                                <ShieldCheck size={18} />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-all"
                            disabled={isLoading || !isSessionReady}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin mx-auto" size={24} />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Atualizar Senha <ArrowRight size={20} />
                                </span>
                            )}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};
