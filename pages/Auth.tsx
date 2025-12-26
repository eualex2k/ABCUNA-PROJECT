import React, { useState } from 'react';
import { Flame, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

          // Build User object mapping from DB snake_case to frontend camelCase
          const appUser: User = {
            id: profile.id,
            name: profile.full_name || profile.email, // Fallback to email if name missing
            email: profile.email,
            role: profile.role,
            avatar: profile.avatar_url,
            phone: profile.phone,
            cpf: profile.cpf,
            bio: profile.bio
            // Add other fields as needed from the User interface
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-brand-700 -skew-y-3 transform origin-top-left -z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50 -z-0"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4 text-brand-600">
            <Flame size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ABCUNA</h1>
          <p className="text-brand-100">Sistema de Gestão Integrada</p>
        </div>

        <Card className="p-8 shadow-xl border-0">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {isRegister ? 'Criar Nova Conta' : 'Acessar Sistema'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isRegister
                ? 'Insira o Código de Acesso fornecido pela administração.'
                : 'Entre com seu e-mail e senha.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <Input
                  label="Nome Completo"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Telefone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </>
            )}

            <Input
              label="E-mail"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            {isRegister ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Código de Acesso
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-600">
                      <ShieldCheck size={16} />
                    </div>
                    <input
                      type="text"
                      name="accessCode"
                      value={formData.accessCode}
                      onChange={handleInputChange}
                      className="w-full h-10 pl-10 pr-3 border rounded-lg uppercase tracking-wider"
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
                />
              </>
            ) : (
              <Input
                label="Senha"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isRegister ? 'Cadastrar' : 'Entrar'}
                  <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
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
              className="text-sm text-slate-600 hover:text-brand-600"
            >
              {isRegister ? 'Já possui conta? Entrar' : 'Criar conta com código'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
