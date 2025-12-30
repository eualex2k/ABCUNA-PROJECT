import React, { useState } from 'react';
import { accessCodeService } from '../services/accessCodes';
import { AccessCode, UserRole, translateRole } from '../types';
import { Card, Button, Input, Badge } from '../components/ui';
import { Copy, Plus, Trash2, Power, Shield, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AccessCodesPage: React.FC = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCode, setNewCode] = useState<Partial<AccessCode>>({
    code: '',
    role: UserRole.ASSOCIATE,
    limit: 10,
    description: ''
  });

  const refresh = async () => {
    setIsLoading(true);
    const data = await accessCodeService.getAll();
    setCodes(data);
    setIsLoading(false);
  };

  React.useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCode.code && newCode.role) {
      await accessCodeService.create(newCode);
      setIsCreating(false);
      setNewCode({ code: '', role: UserRole.ASSOCIATE, limit: 10, description: '' });
      refresh();
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await accessCodeService.toggleStatus(id, currentStatus);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este código?')) {
      await accessCodeService.delete(id);
      refresh();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.FINANCIAL: return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.SECRETARY: return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Códigos de Acesso</h2>
          <p className="text-slate-500 text-sm">Gerencie os tokens de registro e permissões do sistema.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-2">
          {isCreating ? 'Cancelar' : <><Plus size={18} /> Novo Código</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 bg-slate-50 border-brand-200 border-l-4 border-l-brand-500">
          <h3 className="font-semibold text-slate-900 mb-4">Gerar Novo Código de Acesso</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Input
                label="Código Personalizado"
                value={newCode.code}
                onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="EX: CAMPANHA-2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Perfil Associado</label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-brand-500"
                value={newCode.role}
                onChange={e => setNewCode({ ...newCode, role: e.target.value as UserRole })}
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{translateRole(role)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Limite de Usos (Deixe vazio para ilimitado)</label>
              <input
                type="number"
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-brand-500"
                value={newCode.limit || ''}
                onChange={e => setNewCode({ ...newCode, limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Ex: 50"
              />
            </div>
            <div>
              <Input
                label="Descrição (Opcional)"
                value={newCode.description || ''}
                onChange={e => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="Ex: Campanha de Novos Sócios"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <Button type="submit">Criar Código</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {codes.map((code) => {
          const usagePercent = code.limit ? (code.used / code.limit) * 100 : 0;
          const isLimitReached = code.limit && code.used >= code.limit;

          return (
            <Card key={code.id} className={`p-0 overflow-hidden ${!code.active ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <div className="flex flex-col md:flex-row items-center">
                <div className="p-6 flex-1 w-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Shield size={20} className="text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-lg text-slate-900 tracking-wider">{code.code}</h3>
                          <button onClick={() => copyToClipboard(code.code)} className="text-slate-400 hover:text-brand-600" title="Copiar">
                            <Copy size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-500">{code.description || 'Sem descrição'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getRoleColor(code.role)}`}>
                      {translateRole(code.role)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Users size={12} /> Utilização
                      </span>
                      <span className={`${isLimitReached ? 'text-red-600' : 'text-brand-600'}`}>
                        {code.used} / {code.limit === null ? '∞' : code.limit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-brand-500'}`}
                        style={{ width: `${code.limit === null ? 100 : Math.min(usagePercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-4 md:h-full flex md:flex-col gap-2 justify-center w-full md:w-auto min-w-[140px]">
                  <Button
                    variant={code.active ? 'outline' : 'secondary'}
                    size="sm"
                    className={`w-full ${code.active ? 'text-green-600 border-green-200 hover:bg-green-50' : ''}`}
                    onClick={() => handleToggle(code.id, code.active)}
                  >
                    {code.active ? <><Power size={14} className="mr-2" /> Ativo</> : <><AlertCircle size={14} className="mr-2" /> Inativo</>}
                  </Button>

                  {!code.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(code.id)}
                    >
                      <Trash2 size={14} className="mr-2" /> Excluir
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};