import React, { useState, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
  Calendar,
  DollarSign,
  Truck,
  Info,
  AlertCircle,
  Edit2,
  PlusSquare,
  MapPin,
  Upload,
  X as XIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal, Skeleton } from '../components/ui';
import { InventoryItem, User, UserRole } from '../types';
import { inventoryService } from '../services/inventory';
import { ImageCropEditor } from '../components/ImageCropEditor';

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

  // Estados para o editor de imagens do item
  const [selectedCropFile, setSelectedCropFile] = useState<File | null>(null);
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const calculateCondition = (
    quantity: number,
    type: 'REUSABLE' | 'DISPOSABLE'
  ): 'AVAILABLE' | 'MAINTENANCE' | 'LOW_STOCK' | 'CRITICAL' | 'ADEQUATE' => {
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
    itemType: 'DISPOSABLE',
    image: '',
  };

  const [formItem, setFormItem] = useState<Partial<InventoryItem>>(initialFormState);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormItem(initialFormState);
    setPendingImageFile(null);
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
      itemType: item.itemType || 'DISPOSABLE',
      image: item.image || '',
    });
    setPendingImageFile(null);
    setIsModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedCropFile(file);
      setIsCropEditorOpen(true);
    }
    e.target.value = '';
  };

  const handleConfirmCroppedImage = (croppedFile: File) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    setFormItem((prev) => ({ ...prev, image: previewUrl }));
    setPendingImageFile(croppedFile);
  };

  const handleRemoveImage = () => {
    setFormItem((prev) => ({ ...prev, image: '' }));
    setPendingImageFile(null);
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
    if (!formItem.name) return;

    try {
      setIsUploadingImage(true);
      let imageUrl = formItem.image;

      if (pendingImageFile) {
        imageUrl = await inventoryService.uploadImage(pendingImageFile);
      }

      const itemType = formItem.itemType || 'DISPOSABLE';
      const itemData: any = {
        name: formItem.name!,
        quantity: formItem.quantity || 0,
        category: formItem.category || 'Geral',
        condition: calculateCondition(formItem.quantity || 0, itemType),
        location: formItem.location || 'Sede',
        lastInspection:
          formItem.lastInspection || new Date().toISOString().split('T')[0],
        unit: formItem.unit || 'un',
        price: formItem.price || 0,
        supplier: formItem.supplier || '',
        description: formItem.description || '',
        expirationDate: formItem.expirationDate || null,
        itemType: itemType,
        image: imageUrl || null,
      };

      if (editingId) {
        await inventoryService.update(editingId, itemData);
      } else {
        await inventoryService.create(itemData);
      }

      await loadInventory();
      setIsModalOpen(false);
      setFormItem(initialFormState);
      setPendingImageFile(null);
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving inventory item:', error);
      alert(
        'Erro ao salvar item: ' +
          (error.message || 'Verifique os campos e tente novamente.')
      );
    } finally {
      setIsUploadingImage(false);
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
        condition: calculateCondition(newQuantity, itemType),
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
        await inventoryService.update(item.id, {
          condition: calculateCondition(item.quantity, itemType),
        });
      } else {
        await inventoryService.update(item.id, { condition: 'MAINTENANCE' });
      }
      loadInventory();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = items.reduce(
    (acc, curr) => acc + curr.quantity * (curr.price || 0),
    0
  );

  // Helpers para o selo de status
  const conditionLabel = (c: string) => {
    switch (c) {
      case 'AVAILABLE': return 'Disponível';
      case 'ADEQUATE': return 'Estoque OK';
      case 'LOW_STOCK': return 'Estoque Baixo';
      case 'MAINTENANCE': return 'Manutenção';
      default: return 'Crítico';
    }
  };

  const conditionClass = (c: string) => {
    if (c === 'ADEQUATE' || c === 'AVAILABLE')
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (c === 'LOW_STOCK' || c === 'MAINTENANCE')
      return 'bg-amber-50 text-amber-600 border border-amber-100';
    return 'bg-rose-50 text-rose-600 border border-rose-100';
  };

  const conditionVariant = (c: string): 'success' | 'warning' | 'danger' => {
    if (c === 'ADEQUATE' || c === 'AVAILABLE') return 'success';
    if (c === 'LOW_STOCK' || c === 'MAINTENANCE') return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Estoque de Materiais
          </h2>
          <p className="text-slate-500 text-sm">
            Gestão de equipamentos, EPIs e suprimentos operacionais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 px-4 bg-slate-900 rounded-lg flex items-center gap-3 shadow-sm border border-slate-800 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Patrimônio
            </span>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(totalValue)}
            </span>
          </div>
          {canEdit && (
            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 shadow-lg shadow-brand-200"
            >
              <Plus size={18} /> Novo Item
            </Button>
          )}
        </div>
      </div>

      {/* Busca */}
      <Card className="p-4 flex gap-4 bg-white border-slate-200">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />
          <Input
            placeholder="Buscar equipamento por nome, categoria..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Grade de Cartões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="p-0 border-slate-200 overflow-hidden flex flex-col bg-white"
              >
                {/* Skeleton imagem */}
                <Skeleton className="w-full h-40 rounded-none" />
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-7 w-24 rounded-full shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <div className="space-y-1 flex flex-col items-end">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isExpired = item.expirationDate
              ? new Date(item.expirationDate) < new Date()
              : false;

            return (
              <Card
                key={item.id}
                className="group hover:ring-1 hover:ring-brand-500/20 transition-all border-slate-200 overflow-hidden flex flex-col bg-white"
              >
                {/* Imagem do item — topo do cartão */}
                {item.image ? (
                  <div className="w-full h-40 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-brand-50 transition-colors">
                    <Package size={40} className="text-slate-200 group-hover:text-brand-200 transition-colors" />
                  </div>
                )}

                {/* Corpo do cartão */}
                <div className="p-5 flex-1 flex flex-col gap-4">

                  {/* Cabeçalho: nome + selo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-900 leading-snug text-base tracking-tight break-words">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full inline-block"></span>
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider ${
                            item.itemType === 'REUSABLE'
                              ? 'text-blue-500'
                              : 'text-amber-500'
                          }`}
                        >
                          {item.itemType === 'REUSABLE' ? 'Reutilizável' : 'Descartável'}
                        </span>
                      </div>
                    </div>

                    {/* Selo de disponibilidade — nunca sai do card */}
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-sm ${conditionClass(item.condition)}`}
                    >
                      {conditionLabel(item.condition)}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 -mx-5"></div>

                  {/* Info: quantidade + localização */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Quantidade
                      </p>
                      <p className="font-black text-slate-900 text-2xl flex items-baseline gap-1">
                        {item.quantity}
                        <span className="text-xs font-bold text-slate-400 lowercase">
                          {item.unit || 'un'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Localização
                      </p>
                      <p className="font-bold text-slate-700 text-sm flex items-center justify-end gap-1.5 flex-wrap">
                        <MapPin size={14} className="text-red-400 shrink-0" />
                        <span className="break-words">{item.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Auditoria */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 w-full mt-auto">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      Auditado:{' '}
                      <span className="text-slate-800">
                        {item.lastInspection
                          ? new Date(item.lastInspection).toLocaleDateString('pt-BR')
                          : 'Pendente'}
                      </span>
                    </span>
                    {isExpired && (
                      <AlertCircle size={13} className="text-red-500 shrink-0 ml-auto" title="Validade expirada" />
                    )}
                  </div>
                </div>

                {/* Rodapé de ações */}
                <div className="bg-slate-50/80 border-t border-slate-100 px-5 py-3 flex justify-between items-center gap-2">
                  <button
                    onClick={() => handleOpenView(item)}
                    className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] hover:text-brand-600 transition-colors flex items-center gap-1.5 group/btn shrink-0"
                  >
                    <Info
                      size={14}
                      className="group-hover/btn:translate-x-0.5 transition-transform"
                    />
                    Detalhes
                  </button>

                  {canEdit && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleOpenAddQty(item)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                        title="Adicionar Estoque"
                      >
                        <PlusSquare size={19} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all active:scale-95"
                        title="Editar Item"
                      >
                        <Edit2 size={19} />
                      </button>
                      <button
                        onClick={() => toggleStatus(item)}
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all active:scale-95"
                        title="Alternar Manutenção"
                      >
                        <Wrench size={19} />
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                        title="Remover"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <h4 className="text-lg font-bold text-slate-900">
              Nenhum item encontrado
            </h4>
            <p className="text-slate-500">
              Tente ajustar sua busca ou adicione um novo equipamento.
            </p>
          </div>
        )}
      </div>

      {/* ===== Modal Criar / Editar ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Equipamento' : 'Cadastrar Novo Item'}
        maxWidth="6xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-5">

          {/* Campo de imagem — linha de destaque no topo do form */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
              Foto do Item
            </label>

            {formItem.image ? (
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-48 flex items-center justify-center group">
                <img
                  src={formItem.image}
                  alt="Pré-visualização"
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-slate-700 shadow hover:shadow-md transition-all"
                  >
                    <Upload size={14} className="inline mr-1.5" />
                    Substituir
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-red-600 shadow hover:shadow-md transition-all"
                  >
                    <XIcon size={14} className="inline mr-1.5" />
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all group"
              >
                <div className="p-3 bg-slate-100 group-hover:bg-brand-100 rounded-xl transition-colors">
                  <ImageIcon size={24} />
                </div>
                <span className="text-sm font-bold">Adicionar foto do equipamento</span>
                <span className="text-xs text-slate-400">PNG, JPG ou WEBP — máx. 8 MB</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Campos do formulário */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3">
            <div className="md:col-span-2">
              <Input
                label="Nome do Equipamento / Material"
                value={formItem.name}
                onChange={(e) =>
                  setFormItem({ ...formItem, name: e.target.value })
                }
                placeholder="Ex: Colete Refletivo"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                Categoria
              </label>
              <select
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                value={formItem.category}
                onChange={(e) =>
                  setFormItem({ ...formItem, category: e.target.value })
                }
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
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                Tipo de Material
              </label>
              <select
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                value={formItem.itemType}
                onChange={(e) =>
                  setFormItem({ ...formItem, itemType: e.target.value as any })
                }
              >
                <option value="REUSABLE">Reutilizável</option>
                <option value="DISPOSABLE">Descartável</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Qtd"
                type="number"
                min="0"
                value={formItem.quantity}
                onChange={(e) =>
                  setFormItem({
                    ...formItem,
                    quantity: parseInt(e.target.value),
                  })
                }
                required
              />
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  Unid
                </label>
                <select
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                  value={formItem.unit}
                  onChange={(e) =>
                    setFormItem({ ...formItem, unit: e.target.value })
                  }
                >
                  <option value="un">un</option>
                  <option value="par">Par</option>
                  <option value="cx">cx</option>
                  <option value="kg">kg</option>
                  <option value="lt">lt</option>
                  <option value="kit">Kit</option>
                  <option value="mt">mt</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Input
                label="Preço Aquisição"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formItem.price}
                onChange={(e) =>
                  setFormItem({
                    ...formItem,
                    price: parseFloat(e.target.value),
                  })
                }
              />
              <DollarSign
                size={14}
                className="absolute right-4 top-[38px] text-slate-400"
              />
            </div>

            <Input
              label="Localização Exata"
              placeholder="Ex: Prateleira B, Sede"
              value={formItem.location}
              onChange={(e) =>
                setFormItem({ ...formItem, location: e.target.value })
              }
            />

            <Input
              label="Data de Validade"
              type="date"
              value={formItem.expirationDate || ''}
              onChange={(e) =>
                setFormItem({ ...formItem, expirationDate: e.target.value })
              }
            />

            <div className="md:col-span-2">
              <Input
                label="Fornecedor / Fabricante"
                placeholder="Ex: Loja do Bombeiro Ltda."
                value={formItem.supplier || ''}
                onChange={(e) =>
                  setFormItem({ ...formItem, supplier: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                Notas e Descrição
              </label>
              <textarea
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20 transition-all"
                placeholder="Detalhes técnicos, condições de uso, etc..."
                value={formItem.description || ''}
                onChange={(e) =>
                  setFormItem({ ...formItem, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              className="h-10"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-10 shadow-lg shadow-brand-200"
              disabled={isUploadingImage}
            >
              {isUploadingImage
                ? 'Salvando...'
                : editingId
                ? 'Salvar Alterações'
                : 'Adicionar ao Inventário'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Modal Adicionar Quantidade ===== */}
      <Modal
        isOpen={isAddQtyModalOpen}
        onClose={() => setIsAddQtyModalOpen(false)}
        title="Nova Entrada de Estoque"
        maxWidth="md"
      >
        <form onSubmit={handleSaveQuantity} className="space-y-6">
          {selectedItem && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                />
              ) : (
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                  <Package size={20} className="text-brand-600" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Item Selecionado
                </p>
                <p className="font-bold text-slate-900">{selectedItem.name}</p>
                <p className="text-xs text-slate-500">
                  Saldo Atual:{' '}
                  <span className="font-bold">
                    {selectedItem.quantity} {selectedItem.unit}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Quantidade a Adicionar"
              type="number"
              min="1"
              value={qtyToAdd}
              onChange={(e) => setQtyToAdd(parseInt(e.target.value))}
              placeholder="Ex: 10"
              required
              autoFocus
            />
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 font-medium">
                Esta ação atualizará o status do item automaticamente com base
                no novo saldo total de{' '}
                <span className="font-bold">
                  {(selectedItem?.quantity || 0) + qtyToAdd}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddQtyModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
            >
              Confirmar Entrada
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Modal de Detalhes ===== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Item"
        maxWidth="lg"
      >
        {viewItem && (
          <div className="space-y-5">
            {/* Foto grande no topo dos detalhes */}
            {viewItem.image && (
              <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={viewItem.image}
                  alt={viewItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {!viewItem.image && (
                <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600 shrink-0">
                  <Package size={28} />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-xl font-bold text-slate-900 break-words">
                  {viewItem.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="neutral">{viewItem.category}</Badge>
                  <Badge
                    variant={
                      viewItem.itemType === 'REUSABLE' ? 'info' : 'warning'
                    }
                  >
                    {viewItem.itemType === 'REUSABLE'
                      ? 'Reutilizável'
                      : 'Descartável'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Status Atual
                </p>
                <Badge variant={conditionVariant(viewItem.condition)}>
                  {conditionLabel(viewItem.condition)}
                </Badge>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Quantidade
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {viewItem.quantity} {viewItem.unit}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Localização
                  </label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500 shrink-0" />{' '}
                    {viewItem.location}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Fornecedor
                  </label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Truck size={16} className="text-slate-400 shrink-0" />{' '}
                    {viewItem.supplier || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Preço de Aquisição
                  </label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500 shrink-0" />{' '}
                    {viewItem.price
                      ? formatCurrency(viewItem.price)
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Última Auditoria
                  </label>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400 shrink-0" />{' '}
                    {viewItem.lastInspection
                      ? new Date(viewItem.lastInspection).toLocaleDateString('pt-BR')
                      : 'Pendente'}
                  </p>
                </div>
                {viewItem.expirationDate && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Data de Validade
                    </label>
                    <p
                      className={`text-sm font-bold flex items-center gap-2 ${
                        new Date(viewItem.expirationDate) < new Date()
                          ? 'text-red-600'
                          : 'text-slate-700'
                      }`}
                    >
                      <AlertCircle size={16} className="shrink-0" />{' '}
                      {new Date(viewItem.expirationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {viewItem.description && (
              <div className="p-4 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Descrição e Notas
                </label>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {viewItem.description}
                </p>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <Button onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenEdit(viewItem);
                  }}
                  className="gap-2"
                >
                  <Edit2 size={16} /> Editar Item
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Editor de Recorte de Imagem (reutilizado) ===== */}
      <ImageCropEditor
        isOpen={isCropEditorOpen}
        onClose={() => {
          setIsCropEditorOpen(false);
          setSelectedCropFile(null);
        }}
        file={selectedCropFile}
        onConfirm={handleConfirmCroppedImage}
        title="Ajustar Foto do Equipamento"
        aspectRatio={4 / 3}
        cropShape="rect"
      />
    </div>
  );
};
