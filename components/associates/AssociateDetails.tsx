import React from 'react';
import { Mail, Phone, MapPin, Calendar, DollarSign, Clock, Info } from 'lucide-react';
import { Badge, Card, Button } from '../ui';
import { Transaction, Shift, Associate } from '../../types';

interface AssociateDetailsProps {
    associate: Associate;
    transactions: Transaction[];
    shifts: Shift[];
    tab: 'OVERVIEW' | 'FINANCIAL' | 'HISTORY';
    notes: string;
    onPayFee: (feeId: string) => void;
    canEdit: boolean;
}

export const AssociateDetails: React.FC<AssociateDetailsProps> = ({
    associate,
    transactions,
    shifts,
    tab,
    notes,
    onPayFee,
    canEdit
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (tab === 'OVERVIEW') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-brand-200 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-slate-400 group-hover:text-brand-500 transition-colors">
                            <Mail size={14} />
                            <p className="text-[10px] font-black uppercase tracking-widest">E-mail de Contato</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{associate.email}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-brand-200 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-slate-400 group-hover:text-brand-500 transition-colors">
                            <Phone size={14} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Telefone / WhatsApp</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{associate.phone}</p>
                    </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Info size={14} /> Observações Internas
                        </h4>
                        {canEdit && (
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200">
                                Editar
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed italic bg-white p-4 rounded-lg border border-slate-200 shadow-sm font-medium">
                        "{notes || 'Nenhuma observação técnica registrada para este perfil.'}"
                    </p>
                </div>
            </div>
        );
    }

    if (tab === 'FINANCIAL') {
        const associateFees = transactions
            .filter(tx => (
                tx.category === 'Mensalidade' || 
                tx.category === 'Mensalidades' || 
                tx.category === 'Taxa de Inscrição' ||
                (tx.category === 'Geral' && tx.description.toLowerCase().includes('mensalidade'))
            ) && tx.payer_id === associate.id)
            .sort((a, b) => b.date.localeCompare(a.date));

        const pendingFees = associateFees.filter(f => f.status === 'PENDING');
        const overduePayments = pendingFees.filter(f => {
            const dObj = new Date(f.date + 'T12:00:00');
            return dObj < new Date();
        });

        const oldestOverdue = overduePayments.length > 0 ? overduePayments[overduePayments.length - 1] : null;

        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Situação Financeira Geral</p>
                        <p className="text-xl font-black">
                            {overduePayments.length > 0 ? 'PENDÊNCIA IDENTIFICADA' : (pendingFees.length > 0 ? 'PRÓXIMO VENCIMENTO' : 'CONTA EM DIA')}
                        </p>
                        {oldestOverdue && (
                            <p className="text-xs text-rose-400 mt-1 font-bold">
                                {overduePayments.length} parcela(s) em atraso.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {oldestOverdue && (
                            <Button
                                onClick={() => onPayFee(oldestOverdue.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                            >
                                <DollarSign size={16} className="mr-2" /> Pagar Agora
                            </Button>
                        )}
                        <div className={`p-3 rounded-xl bg-white/10 ${overduePayments.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <Card className="p-0 overflow-hidden border-slate-100 shadow-sm">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico de Cobranças / Taxas</p>
                        <Badge variant="neutral" className="font-bold">{associateFees.length} Lançamentos</Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-5 py-3 text-left">Referência / Vencim.</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-right">Valor</th>
                                    <th className="px-5 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {associateFees.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                                            <Info size={24} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-xs font-medium italic">Nenhuma cobrança encontrada para este perfil.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    associateFees.map(fee => {
                                        const isFeeOverdue = fee.status === 'PENDING' && new Date(fee.date + 'T12:00:00') < new Date();
                                        const isRegistration = fee.category === 'Taxa de Inscrição';
                                        
                                        return (
                                            <tr key={fee.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-5 py-4 font-bold text-slate-700">
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {(() => {
                                                                const [y, m, d] = fee.date.split('-');
                                                                return `${d}/${m}/${y}`;
                                                            })()}
                                                        </span>
                                                        {isRegistration ? (
                                                            <span className="text-[9px] text-brand-500 uppercase font-black">Inscrição</span>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold">Mensalidade</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge variant={fee.status === 'COMPLETED' ? 'success' : (isFeeOverdue ? 'danger' : 'warning')}>
                                                        {fee.status === 'COMPLETED' ? 'PAGO' : (isFeeOverdue ? 'ATRASADO' : 'PENDENTE')}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrency(fee.amount)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    {fee.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => onPayFee(fee.id)}
                                                            className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 tracking-widest bg-brand-50 px-2 py-1 rounded"
                                                        >
                                                            Pagar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }

    if (tab === 'HISTORY') {
        const today = new Date();
        const associateShifts = shifts.filter(s =>
            s.members.some(m => m.name === associate.name && m.status === 'CONFIRMED') &&
            new Date(s.fullDate) < today &&
            s.status === 'CONFIRMED'
        );

        const totalRemuneration = associateShifts.reduce((sum, s) => sum + s.amount, 0);

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6 bg-brand-900 border-none flex flex-col items-center justify-center text-center shadow-lg">
                        <div className="p-3 bg-white/10 rounded-2xl mb-3 text-white">
                            <Calendar size={24} />
                        </div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Missões Concluídas</p>
                        <p className="text-4xl font-black text-white">{associateShifts.length}</p>
                    </Card>
                    <Card className="p-6 bg-emerald-900 border-none flex flex-col items-center justify-center text-center shadow-lg">
                        <div className="p-3 bg-white/10 rounded-2xl mb-3 text-white">
                            <DollarSign size={24} />
                        </div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Acumulado em Diárias</p>
                        <p className="text-3xl font-black text-white">{formatCurrency(totalRemuneration)}</p>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-2"><Clock size={16} /> Detalhamento Operacional</div>
                        <Badge variant="neutral">{associateShifts.length} Eventos</Badge>
                    </h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {associateShifts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Info size={32} className="opacity-10 mb-2" />
                                <p className="text-xs italic font-bold">Nenhum histórico operacional sincronizado.</p>
                            </div>
                        ) : (
                            associateShifts.sort((a, b) => b.fullDate.localeCompare(a.fullDate)).map((shift, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 group shadow-sm hover:shadow-md">
                                    <div className="flex flex-col items-center justify-center bg-slate-900 rounded-xl px-4 py-2 h-fit group-hover:bg-brand-600 transition-colors">
                                        <span className="text-[10px] font-black text-white/60 uppercase leading-tight">{shift.day.substring(0, 3)}</span>
                                        <span className="text-base font-black text-white">{shift.date}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-black text-slate-900 uppercase text-sm tracking-tight">{shift.team}</h5>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                        <MapPin size={10} className="text-rose-500" /> {shift.location}
                                                    </p>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                        <Clock size={10} className="text-brand-500" /> {shift.startTime}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-black">
                                                {formatCurrency(shift.amount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
