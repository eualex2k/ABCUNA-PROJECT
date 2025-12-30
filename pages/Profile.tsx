import React, { useState, useRef } from 'react';
import { User, UserRole, translateRole } from '../types';
import { Card, Button, Input, Avatar, Badge } from '../components/ui';
import { Camera, Save, Mail, Phone, MapPin, FileText, Activity, CreditCard, User as UserIcon, Bell } from 'lucide-react';
import { notificationService } from '../services/notifications';
import { profileService } from '../services/profile';
import { pushNotificationService } from '../services/pushNotifications';

interface ProfilePageProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<User>(user);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await profileService.update(user.id, formData);
      onUpdate(formData);

      notificationService.add({
        title: 'Perfil Atualizado',
        message: 'Suas informações foram salvas com sucesso.',
        type: 'SYSTEM',
        link: '/profile'
      });
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert('Erro ao atualizar perfil: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Meu Perfil</h2>
          <p className="text-slate-500 text-sm">Gerencie suas informações pessoais e documentos.</p>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
          <Save size={18} /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Card de Cabeçalho com Avatar e Info Principal */}
      <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg cursor-pointer transition-transform hover:scale-105"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar
                src={formData.avatar}
                alt={formData.name}
                fallback={formData.name.substring(0, 2)}
                size="lg"
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={28} />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Informações Principais */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{formData.name}</h3>
              <p className="text-sm text-slate-500">{formData.email}</p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="info">{translateRole(formData.role)}</Badge>
              {formData.bloodType && <Badge variant="danger">{formData.bloodType}</Badge>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-0.5">CPF</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{formData.cpf || '-'}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-0.5">Matrícula</p>
                <p className="text-sm font-bold text-slate-900">{formData.registrationNumber || '-'}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-0.5">Telefone</p>
                <p className="text-sm font-bold text-slate-900">{formData.phone || '-'}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400 mb-0.5">Cartão SUS</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{formData.susNumber || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de Formulários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b border-slate-100 pb-3">
            <UserIcon size={20} className="text-brand-600" /> Dados Pessoais
          </h3>
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CPF"
                name="cpf"
                mask="cpf"
                value={formData.cpf || ''}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
              />
              <Input
                label="Data de Nascimento"
                type="date"
                name="birthDate"
                value={formData.birthDate || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Biografia</label>
              <textarea
                name="bio"
                rows={3}
                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-base focus:outline-none focus:border-brand-500 resize-none"
                placeholder="Conte um pouco sobre você..."
                value={formData.bio || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        {/* Informações Institucionais */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b border-slate-100 pb-3">
            <FileText size={20} className="text-brand-600" /> Informações Institucionais
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Matrícula"
                name="registrationNumber"
                value={formData.registrationNumber || ''}
                onChange={handleInputChange}
                placeholder="Ex: 2024.001"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo Sanguíneo</label>
                <select
                  name="bloodType"
                  className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:outline-none focus:border-brand-500"
                  value={formData.bloodType || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <Input
              label="Cartão Nacional de Saúde (SUS)"
              name="susNumber"
              mask="cns"
              value={formData.susNumber || ''}
              onChange={handleInputChange}
              placeholder="000 0000 0000 0000"
            />
          </div>
        </Card>

        {/* Contato e Endereço */}
        <Card className="p-6 md:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b border-slate-100 pb-3">
            <MapPin size={20} className="text-brand-600" /> Contato e Endereço
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="E-mail"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
              className="bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <Input
              label="Telefone / WhatsApp"
              name="phone"
              mask="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
            />
            <div className="md:col-span-1">
              <Input
                label="Endereço Completo"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Rua, Número, Bairro"
              />
            </div>
          </div>
        </Card>

        {/* Preferências de Notificação */}
        <Card className="p-6 md:col-span-2 border-brand-100 bg-brand-50/10">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b border-brand-100 pb-3">
            <Bell size={20} className="text-brand-600" /> Preferências de Notificação
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">Notificações Push no Navegador</p>
              <p className="text-sm text-slate-500">Receba alertas de novas escalas, materiais e eventos mesmo com o sistema fechado.</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await pushNotificationService.subscribeUser(user.id);
                    alert('Notificações ativadas com sucesso neste dispositivo!');
                  } catch (err) {
                    // Erro já é tratado no service
                  }
                }}
                className="text-brand-600 border-brand-200"
              >
                Ativar Notificações
              </Button>
              <Button
                variant="ghost"
                onClick={() => pushNotificationService.unsubscribeUser()}
                className="text-slate-500"
              >
                Desativar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};