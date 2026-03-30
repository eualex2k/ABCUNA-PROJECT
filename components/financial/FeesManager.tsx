import React from 'react';
import { Filter, CheckCircle2, Calendar, Edit3, Trash2, X, AlertTriangle, CreditCard, ChevronRight } from 'lucide-react';
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
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="border-b border-slate-100 pb-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controle de Fluxo</span>
                </div>

                <div className="flex items-center gap-4">
                    {canEdit && (
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (!isSelectionMode) deselectAll();
                            }}
                            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                                isSelectionMode 
                                ? 'text-brand-600' 
                                : 'text-slate-400 hover:text-brand-500'
                            }`}
                        >
                            {isSelectionMode ? 'Sair da Seleção' : 'Seleção em Massa'}
                        </button>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <Filter size={12} className="text-slate-400" />
                        <select
                            className="text-[10px] font-bold text-slate-600 bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer"
                            value={filterAssociateId}
                            onChange={(e) => setFilterAssociateId(e.target.value)}
                        >
                            <option value="ALL">Todos os Associados</option>
                            {associates
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
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
                                        ? 'bg-brand-50/50 border-brand-200 shadow-sm'
                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {isSelectionMode && (
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                checked={selectedFeeIds.includes(fee.id)}
                                                onChange={() => toggleFeeSelection(fee.id)}
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-slate-900 truncate tracking-tight">{fee.associateName}</span>
                                                <Badge variant={fee.status === 'LATE' ? 'danger' : 'warning'} className="text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                                                    {translateStatus(fee.status)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[9px] font-medium text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1">
                                                    {new Date(fee.dueDate + "T12:00:00").toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span>{fee.monthRef}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-50">
                                        <div className="text-right">
                                            <span className="font-bold text-slate-800 text-lg tracking-tighter">R$ {fee.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => onEdit(fee)}
                                                    className="p-1.5 text-slate-300 hover:text-brand-500 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onPay(fee)}
                                                className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-colors"
                                            >
                                                Pagar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-premium">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform duration-500">
                           <CheckCircle2 size={40} strokeWidth={1.5} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2">Tudo em dia!</h4>
                        <p className="text-slate-400 font-medium text-sm">Nenhuma mensalidade pendente encontrada nesta visualização.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
