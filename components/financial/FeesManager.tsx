import React from 'react';
import { Filter, CheckCircle2, Calendar, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../ui';
import { Associate, translateStatus } from '../../types';

interface FeeRecord {
    id: string;
    associateId: string;
    associateName: string;
    dueDate: string;
    amount: number;
    status: 'LATE' | 'OPEN' | 'PAID' | 'PARTIAL';
    monthRef: string;
}

interface FeesManagerProps {
    fees: FeeRecord[];
    associates: Associate[];
    filterAssociateId: string;
    setFilterAssociateId: (id: string) => void;
    isSelectionMode: boolean;
    setIsSelectionMode: (mode: boolean) => void;
    selectedFeeIds: string[];
    toggleFeeSelection: (id: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    onDeleteBulk: () => void;
    onEdit: (fee: FeeRecord) => void;
    onPay: (fee: FeeRecord) => void;
    canEdit: boolean;
    loading?: boolean;
}

export const FeesManager: React.FC<FeesManagerProps> = ({
    fees,
    associates,
    filterAssociateId,
    setFilterAssociateId,
    isSelectionMode,
    setIsSelectionMode,
    selectedFeeIds,
    toggleFeeSelection,
    selectAll,
    deselectAll,
    onDeleteBulk,
    onEdit,
    onPay,
    canEdit,
    loading = false
}) => {
    const sortedFees = [...fees].sort((a, b) => {
        if (a.status === 'LATE' && b.status !== 'LATE') return -1;
        if (a.status !== 'LATE' && b.status === 'LATE') return 1;
        return a.dueDate.localeCompare(b.dueDate);
    });

    const unpaidFees = sortedFees.filter(f => f.status !== 'PAID');

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-900">Controle de Mensalidades</h3>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {canEdit && (
                        <Button
                            variant={isSelectionMode ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (!isSelectionMode) deselectAll();
                            }}
                            className="h-8 text-[10px] font-black uppercase tracking-wider"
                        >
                            {isSelectionMode ? (
                                <><X size={14} className="mr-1" /> Sair da Seleção</>
                            ) : (
                                <><CheckCircle2 size={14} className="mr-1" /> Seleção em Massa</>
                            )}
                        </Button>
                    )}

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2.5 h-8 ring-offset-bg focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            className="text-[11px] font-bold text-slate-700 bg-transparent border-none focus:ring-0 outline-none pr-6 cursor-pointer"
                            value={filterAssociateId}
                            onChange={(e) => setFilterAssociateId(e.target.value)}
                        >
                            <option value="ALL">TODOS OS ASSOCIADOS</option>
                            {associates.map(a => (
                                <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isSelectionMode && canEdit && unpaidFees.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            checked={selectedFeeIds.length > 0 && selectedFeeIds.length === unpaidFees.length}
                            onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                            id="select-all"
                        />
                        <label htmlFor="select-all" className="text-[11px] font-black text-brand-900 uppercase tracking-wider cursor-pointer">
                            Selecionar Todas ({unpaidFees.length})
                        </label>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 mr-2">{selectedFeeIds.length} selecionadas</span>
                        <Button
                            size="sm"
                            onClick={onDeleteBulk}
                            disabled={selectedFeeIds.length === 0}
                            className="h-8 text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_4px_12px_rgba(220,38,38,0.2)] disabled:bg-slate-300"
                        >
                            <Trash2 size={12} className="mr-1.5" /> Excluir Seleção
                        </Button>
                    </div>
                </div>
            )}

            <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                ) : unpaidFees.length > 0 ? (
                    unpaidFees.map(fee => (
                        <div
                            key={fee.id}
                            className={`group p-4 rounded-xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${selectedFeeIds.includes(fee.id)
                                ? 'bg-brand-50 border-brand-200 shadow-lg scale-[1.01]'
                                : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
                                }`}
                        >
                            <div className="flex items-start gap-4 flex-1">
                                {isSelectionMode && (
                                    <div className="pt-1.5">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                            checked={selectedFeeIds.includes(fee.id)}
                                            onChange={() => toggleFeeSelection(fee.id)}
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-black text-slate-900 truncate">{fee.associateName}</span>
                                        <Badge variant={fee.status === 'LATE' ? 'danger' : 'warning'} className="text-[9px] px-2">
                                            {translateStatus(fee.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-1">
                                        <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" strokeWidth={2.5} /> Venc. {new Date(fee.dueDate).toLocaleDateString('pt-BR')}</span>
                                        <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-slate-400" strokeWidth={2.5} /> {fee.monthRef}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                                <span className="font-black text-slate-900 text-xl tracking-tighter">R$ {fee.amount.toFixed(2)}</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEdit(fee)}
                                        className="h-9 w-9 p-0 border-slate-200 bg-white hover:bg-slate-100 hover:text-brand-600 transition-all shadow-sm"
                                        title="Editar"
                                    >
                                        <Edit3 size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onPay(fee)}
                                        className="h-9 px-4 text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform"
                                    >
                                        Receber
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-100" strokeWidth={1} />
                        <h4 className="text-slate-900 font-bold">Tudo em dia!</h4>
                        <p className="text-slate-500 text-sm">Nenhuma mensalidade pendente encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
