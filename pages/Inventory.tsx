import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Wrench, Calendar, DollarSign, Truck, Info, AlertCircle, Edit2, PlusSquare, ArrowUpRight, MapPin } from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../components/ui';
import { InventoryItem, User, UserRole } from '../types';
import { inventoryService } from '../services/inventory';

interface InventoryPageProps {
  user: User;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddQtyModalOpen, setIsAddQtyModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCondition = (quantity: number, type: 'REUSABLE' | 'DISPOSABLE'): 'AVAILABLE' | 'MAINTENANCE' | 'LOW_STOCK' | 'CRITICAL' | 'ADEQUATE' => {
    if (type === 'REUSABLE') return 'AVAILABLE';
    if (quantity < 5) return 'CRITICAL';
    if (quantity < 15) return 'LOW_STOCK';
    return 'ADEQUATE';
  };

  const initialFormState: Partial<InventoryItem> = {
    name: '',
    quantity: 1,
    category: 'Geral',
    location: 'Sede',
    unit: 'un',
    price: 0,
    supplier: '',
    description: '',
    itemType: 'DISPOSABLE'
  };

  const [formItem, setFormItem] = useState<Partial<InventoryItem>>(initialFormState);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormItem(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormItem({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      location: item.location,
      unit: item.unit,
      price: item.price,
      supplier: item.supplier,
      description: item.description,
      expirationDate: item.expirationDate,
      lastInspection: item.lastInspection,
      itemType: item.itemType || 'DISPOSABLE'
    });
    setIsModalOpen(true);
  };

  const handleOpenAddQty = (item: InventoryItem) => {
    setSelectedItem(item);
    setQtyToAdd(0);
    setIsAddQtyModalOpen(true);
  };

  const handleOpenView = (item: InventoryItem) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItem.name) {
      try {
        const itemType = formItem.itemType || 'DISPOSABLE';
        const itemData: any = {
          name: formItem.name!,
          quantity: formItem.quantity || 0,
          category: formItem.category || 'Geral',
          condition: calculateCondition(formItem.quantity || 0, itemType),
          location: formItem.location || 'Sede',
          lastInspection: formItem.lastInspection || new Date().toISOString().split('T')[0],
          unit: formItem.unit || 'un',
          price: formItem.price || 0,
          supplier: formItem.supplier || '',
          description: formItem.description || '',
          expirationDate: formItem.expirationDate || null,
          itemType: itemType
        };

        if (editingId) {
          await inventoryService.update(editingId, itemData);
        } else {
          await inventoryService.create(itemData);
        }

        loadInventory();
        setIsModalOpen(false);
        setFormItem(initialFormState);
        setEditingId(null);
      } catch (error: any) {
        console.error('Error saving inventory item:', error);
        alert('Erro ao salvar item: ' + (error.message || 'Verifique os campos e tente novamente.'));
      }
    }
  };

  const handleSaveQuantity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || qtyToAdd <= 0) return;

    try {
      const newQuantity = selectedItem.quantity + qtyToAdd;
      const itemType = selectedItem.itemType || 'DISPOSABLE';
      await inventoryService.update(selectedItem.id, {
        quantity: newQuantity,
        condition: calculateCondition(newQuantity, itemType)
      });
      loadInventory();
      setIsAddQtyModalOpen(false);
    } catch (error) {
      alert('Erro ao atualizar quantidade.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover item do estoque?')) {
      try {
        await inventoryService.delete(id);
        loadInventory();
      } catch (error) {
        console.error('Error deleting', error);
      }
    }
  };

  const toggleStatus = async (item: InventoryItem) => {
    try {
      if (item.condition === 'MAINTENANCE') {
        const itemType = item.itemType || 'DISPOSABLE';
        await inventoryService.update(item.id, { condition: calculateCondition(item.quantity, itemType) });
      } else {
        await inventoryService.update(item.id, { condition: 'MAINTENANCE' });
      }
      loadInventory();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = items.reduce((acc, curr) => acc + (curr.quantity * (curr.price || 0)), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estoque de Materiais</h2>
          <p className="text-slate-500 text-sm">Gestão de equipamentos, EPIs e suprimentos operacionais.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 px-4 bg-slate-900 rounded-lg flex items-center gap-3 shadow-sm border border-slate-800 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patrimônio</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalValue)}</span>
          </div>
          {canEdit && (
            <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-lg shadow-brand-200">
              <Plus size={18} /> Novo Item
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 flex gap-4 bg-white border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <Input
            placeholder="Buscar equipamento por nome, categoria..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 italic">Sincronizando inventário...</div>
        ) : filteredItems.map(item => {
          const isExpired = item.expirationDate ? new Date(item.expirationDate) < new Date() : false;

          return (
            <Card key={item.id} className="group hover:border-brand-500 transition-all border-slate-200 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Package size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight text-lg">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</p>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${item.itemType === 'REUSABLE' ? 'text-blue-500' : 'text-amber-500'}`}>
                          {item.itemType === 'REUSABLE' ? 'Reutilizável' : 'Descartável'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant={
                    item.condition === 'ADEQUATE' || item.condition === 'AVAILABLE' ? 'success' :
                      item.condition === 'LOW_STOCK' || item.condition === 'MAINTENANCE' ? 'warning' : 'danger'
                  }>
                    {item.condition === 'AVAILABLE' ? 'Disponível' :
                      item.condition === 'ADEQUATE' ? 'Estoque OK' :
                        item.condition === 'LOW_STOCK' ? 'Estoque Baixo' :
                          item.condition === 'MAINTENANCE' ? 'Manutenção' : 'Crítico'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 py-5 border-t border-slate-100 mt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantidade</p>
                    <p className="font-black text-slate-900 text-2xl flex items-baseline gap-1">
                      {item.quantity}
                      <span className="text-xs font-bold text-slate-400">{item.unit || 'un'}</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Localização</p>
                    <p className="font-bold text-slate-700 flex items-center justify-end gap-1.5">
                      <MapPin size={14} className="text-red-500" /> {item.location}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Auditado: {item.lastInspection ? new Date(item.lastInspection).toLocaleDateString('pt-BR') : 'Pendente'}</span>
                  </div>
                  {item.expirationDate && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isExpired ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Val: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/50 backdrop-blur-sm border-t border-slate-100 p-3 flex justify-between items-center px-4">
                <button
                  onClick={() => handleOpenView(item)}
                  className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors flex items-center gap-1.5"
                >
                  <Info size={14} /> Detalhes
                </button>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleOpenAddQty(item)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Adicionar Estoque"
                      >
                        <PlusSquare size={20} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Editar Item"
                      >
                        <Edit2 size={19} />
                      </button>
                      <button
                        onClick={() => toggleStatus(item)}
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Alternar Manutenção"
                      >
                        <Wrench size={19} />
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-2"></div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                        title="remover"
                      >
                        <Trash2 size={19} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Equipamento" : "Cadastrar Novo Item"} maxWidth="xl">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input
            label="Nome do Equipamento / Material"
            value={formItem.name}
            onChange={e => setFormItem({ ...formItem, name: e.target.value })}
            placeholder="Ex: Colete Refletivo"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Categoria</label>
              <select
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                value={formItem.category}
                onChange={e => setFormItem({ ...formItem, category: e.target.value })}
              >
                <option value="Geral">Geral</option>
                <option value="EPI">EPI</option>
                <option value="Combate a Incêndio">Combate a Incêndio</option>
                <option value="Comunicação">Comunicação</option>
                <option value="APH">APH</option>
                <option value="Veículos">Veículos</option>
                <option value="Uniforme">Uniforme</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Material</label>
              <select
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                value={formItem.itemType}
                onChange={e => setFormItem({ ...formItem, itemType: e.target.value as any })}
              >
                <option value="REUSABLE">Reutilizável (Equipamento)</option>
                <option value="DISPOSABLE">Descartável (Soro, Gaze, etc.)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input
                label="Físico em Estoque"
                type="number"
                min="0"
                value={formItem.quantity}
                onChange={e => setFormItem({ ...formItem, quantity: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="col-span-1">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Unidade</label>
                <select
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                  value={formItem.unit}
                  onChange={e => setFormItem({ ...formItem, unit: e.target.value })}
                >
                  <option value="un">Unidade (un)</option>
                  <option value="par">Par</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="lt">Litro (lt)</option>
                  <option value="kit">Kit</option>
                  <option value="mt">Metro (mt)</option>
                </select>
              </div>
            </div>
            <div className="col-span-1">
              <div className="relative">
                <Input
                  label="Preço Aquisição"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formItem.price}
                  onChange={e => setFormItem({ ...formItem, price: parseFloat(e.target.value) })}
                />
                <DollarSign size={14} className="absolute right-4 top-[38px] text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Localização Exata"
              placeholder="Ex: Prateleira B, Sede"
              value={formItem.location}
              onChange={e => setFormItem({ ...formItem, location: e.target.value })}
            />
            <Input
              label="Data de Validade"
              type="date"
              value={formItem.expirationDate || ''}
              onChange={e => setFormItem({ ...formItem, expirationDate: e.target.value })}
            />
          </div>

          <Input
            label="Fornecedor / Fabricante"
            placeholder="Ex: Loja do Bombeiro Ltda."
            value={formItem.supplier || ''}
            onChange={e => setFormItem({ ...formItem, supplier: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Notas e Descrição</label>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24 transition-all"
              placeholder="Detalhes técnicos, condições de uso, etc..."
              value={formItem.description || ''}
              onChange={e => setFormItem({ ...formItem, description: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="shadow-lg shadow-brand-200">
              {editingId ? "Salvar Alterações" : "Adicionar ao Inventário"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAddQtyModalOpen} onClose={() => setIsAddQtyModalOpen(false)} title="Nova Entrada de Estoque" maxWidth="md">
        <form onSubmit={handleSaveQuantity} className="space-y-6">
          {selectedItem && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Selecionado</p>
                <p className="font-bold text-slate-900">{selectedItem.name}</p>
                <p className="text-xs text-slate-500">Saldo Atual: <span className="font-bold">{selectedItem.quantity} {selectedItem.unit}</span></p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Quantidade a Adicionar"
              type="number"
              min="1"
              value={qtyToAdd}
              onChange={e => setQtyToAdd(parseInt(e.target.value))}
              placeholder="Ex: 10"
              required
              autoFocus
            />
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 font-medium">
                Esta ação atualizará o status do item automaticamente com base no novo saldo total de <span className="font-bold">{(selectedItem?.quantity || 0) + qtyToAdd}</span>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddQtyModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100">
              Confirmar Entrada
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes do Item" maxWidth="lg">
        {viewItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600">
                <Package size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">{viewItem.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{viewItem.category}</Badge>
                  <Badge variant={viewItem.itemType === 'REUSABLE' ? 'info' : 'warning'}>
                    {viewItem.itemType === 'REUSABLE' ? 'Reutilizável' : 'Descartável'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Atual</p>
                <Badge variant={
                  viewItem.condition === 'ADEQUATE' || viewItem.condition === 'AVAILABLE' ? 'success' :
                    viewItem.condition === 'LOW_STOCK' || viewItem.condition === 'MAINTENANCE' ? 'warning' : 'danger'
                }>
                  {viewItem.condition === 'AVAILABLE' ? 'Disponível' :
                    viewItem.condition === 'ADEQUATE' ? 'Estoque OK' :
                      viewItem.condition === 'LOW_STOCK' ? 'Estoque Baixo' :
                        viewItem.condition === 'MAINTENANCE' ? 'Manutenção' : 'Crítico'}
                </Badge>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantidade</p>
                <p className="text-xl font-bold text-slate-900">{viewItem.quantity} {viewItem.unit}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Localização</label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" /> {viewItem.location}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fornecedor</label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Truck size={16} className="text-slate-400" /> {viewItem.supplier || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço de Aquisição</label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" /> {viewItem.price ? formatCurrency(viewItem.price) : 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Última Auditoria</label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" /> {viewItem.lastInspection ? new Date(viewItem.lastInspection).toLocaleDateString('pt-BR') : 'Pendente'}
                  </p>
                </div>
                {viewItem.expirationDate && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data de Validade</label>
                    <p className={`text-sm font-bold flex items-center gap-2 ${new Date(viewItem.expirationDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                      <AlertCircle size={16} /> {new Date(viewItem.expirationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {viewItem.description && (
              <div className="p-4 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Descrição e Notas</label>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{viewItem.description}</p>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <Button onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
              {canEdit && (
                <Button variant="outline" onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(viewItem);
                }} className="gap-2">
                  <Edit2 size={16} /> Editar Item
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};