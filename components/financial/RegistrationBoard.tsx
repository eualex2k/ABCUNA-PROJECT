import React from 'react';
import { Plus, Users, Calendar, Trash2, Edit3, CreditCard } from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../ui';
import { Registration } from '../../types';

interface RegistrationBoardProps {
    registrations: Registration[];
    onAdd: () => void;
    onEdit: (reg: Registration) => void;
    onDelete: (id: string, name: string) => void;
    onPay: (reg: Registration) => void;
    loading?: boolean;
}

export const RegistrationBoard: React.FC<RegistrationBoardProps> = ({
    registrations,
    onAdd,
    onEdit,
    onDelete,
    onPay,
    loading = false
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Taxas de Inscrição 2026</h3>
                    <p className="text-sm text-slate-500">Gestão de novos inscritos e pagamentos iniciais.</p>
                </div>
                <Button onClick={onAdd} className="w-full sm:w-auto">
                    <Plus size={18} className="mr-2" /> Novo Inscrito
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registrations.length > 0 ? (
                    registrations.map((reg) => {
                        const remaining = reg.target_amount - reg.total_paid;
                        const progress = (reg.total_paid / reg.target_amount) * 100;

                        return (
                            <Card key={reg.id} className="p-5 flex flex-col justify-between hover-lift">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 leading-tight">{reg.full_name}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Inscrito</span>
                                            </div>
                                        </div>
                                        <Badge variant={remaining <= 0 ? 'success' : 'warning'}>
                                            {remaining <= 0 ? 'Pago' : 'Pendente'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-medium">Progresso</span>
                                            <span className="text-slate-900 font-bold">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${remaining <= 0 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Pago</p>
                                            <p className="text-sm font-black text-emerald-600">{formatCurrency(reg.total_paid)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Restante</p>
                                            <p className={`text-sm font-black ${remaining > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                {formatCurrency(remaining)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                        <Calendar size={12} className="text-slate-400" />
                                        Prazo: {new Date(reg.deadline).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    {remaining > 0 && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1 font-bold text-xs h-9"
                                            onClick={() => onPay(reg)}
                                        >
                                            <CreditCard size={14} className="mr-1.5" /> Pagar
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 p-0"
                                        onClick={() => onEdit(reg)}
                                    >
                                        <Edit3 size={14} />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                        onClick={() => onDelete(reg.id, reg.full_name)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Users size={48} className="mx-auto mb-4 text-slate-300" />
                        <h4 className="text-slate-900 font-bold">Nenhum inscrito encontrado</h4>
                        <p className="text-slate-500 text-sm">Adicione um novo inscrito para começar o controle.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
