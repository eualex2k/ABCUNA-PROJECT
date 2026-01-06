import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, Loader2, ShieldCheck, ArrowLeft, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showContent, setShowContent] = useState(false);

  // Efeito de entrada suave ao montar
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    accessCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegister) {
        // CADASTRO REAL COM SUPABASE
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              phone: formData.phone,
              access_code: formData.accessCode,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          alert('Cadastro realizado com sucesso. Faça login para continuar.');
          setIsRegister(false);
          setFormData({
            email: '',
            password: '',
            name: '',
            phone: '',
            accessCode: '',
          });
        }
      } else {
        // LOGIN REAL
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) throw profileError;

          const appUser: User = {
            id: profile.id,
            name: profile.full_name || profile.email,
            email: profile.email,
            role: profile.role,
            avatar: profile.avatar_url,
            phone: profile.phone,
            cpf: profile.cpf,
            bio: profile.bio
          };

          onLogin(appUser);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`
      fixed inset-0 z-50 bg-[#0f172a] text-slate-900 flex items-center justify-center p-4 lg:p-8 overflow-y-auto overscroll-none font-sans 
      transition-all duration-700 ease-out
      ${showContent ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-sm'}
    `}>
      <div className="w-full max-w-6xl h-full lg:h-[80vh] min-h-[550px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row ring-1 ring-white/10">

        {/* Lado Esquerdo - Branding (40%) */}
        <div className="lg:w-[40%] bg-gradient-to-br from-red-800 to-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Background Decorativo */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjFmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600 rounded-full blur-[120px] opacity-20 -ml-20 -mb-20"></div>

          {/* Header Branding */}
          <div className="relative z-10">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group text-sm font-medium"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Voltar ao Início
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                <Flame size={24} className="text-white" fill="currentColor" />
              </div>
              <span className="text-2xl font-bold tracking-tight">ABCUNA</span>
            </div>

            <h2 className="text-3xl font-bold leading-tight mb-4 text-white">
              {isRegister ? 'Solicitar Acesso' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-slate-300 font-light leading-relaxed">
              {isRegister
                ? 'Insira seu código de acesso exclusivo para se juntar à equipe.'
                : 'Acesse o painel de gestão integrada para gerenciar operações e escalas.'}
            </p>
          </div>

          {/* Footer Branding */}
          <div className="relative z-10 mt-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30 text-green-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={12} />
              Ambiente Seguro
            </div>
            <p className="text-[10px] text-slate-400 opacity-60 uppercase tracking-widest">
              © 2026 ABCUNA System • v2.0
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário (60%) */}
        <div className="lg:w-[60%] bg-white flex flex-col justify-center relative p-6 lg:p-12 overflow-hidden">
          <div className="w-full max-w-md mx-auto">

            <div className="text-center lg:text-left mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {isRegister ? 'Criar Nova Conta' : 'Login no Sistema'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRegister ? 'Preencha seus dados para solicitar cadastro.' : 'Digite suas credenciais para continuar.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <Input
                    label="Nome Completo"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Seu nome"
                    icon={<UserIcon size={16} />}
                    className="h-9 text-sm"
                  />
                  <Input
                    label="Telefone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    icon={<Phone size={16} />}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <Input
                label="E-mail Corporativo"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="usuario@abcuna.org"
                icon={<Mail size={16} />}
                className="h-9 text-sm"
              />

              {isRegister ? (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-75">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código de Acesso
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-red-600 pointer-events-none">
                        <ShieldCheck size={16} />
                      </div>
                      <input
                        type="text"
                        name="accessCode"
                        value={formData.accessCode}
                        onChange={handleInputChange}
                        className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded-lg uppercase tracking-wider text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono placeholder:normal-case"
                        placeholder="CÓDIGO-123"
                        required
                      />
                    </div>
                  </div>

                  <Input
                    label="Criar Senha"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    className="h-9 text-sm"
                  />
                </div>
              ) : (
                <Input
                  label="Senha"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  className="h-9 text-sm"
                />
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                  <div className="mt-0.5"><ShieldCheck size={14} /></div>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-200 transition-all mt-2 text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isRegister ? 'Finalizar Cadastro' : 'Entrar na Plataforma'}
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center mt-4">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                  setFormData({
                    email: '',
                    password: '',
                    name: '',
                    phone: '',
                    accessCode: '',
                  });
                }}
                className="text-xs text-slate-500 hover:text-red-700 font-medium transition-colors"
              >
                {isRegister
                  ? 'Já possui uma conta? Fazer Login'
                  : 'Não tem acesso? Utilizar Código de Convite'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
