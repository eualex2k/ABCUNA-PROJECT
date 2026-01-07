import React, { useState, useEffect } from 'react';
import {
    Save, Upload, Eye, Star, Info, Award, Phone,
    Plus, Trash2, Loader2, HelpCircle
} from 'lucide-react';
import { Card, Button, Input, Textarea } from '../components/ui';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig, User } from '../types';
import { notificationService } from '../services/notifications';

// --- Componentes Auxiliares (DEFINIDOS FORA DO COMPONENTE PRINCIPAL PARA EVITAR TREMOR) ---

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2">
        <HelpCircle size={16} className="text-slate-400 hover:text-red-600 cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {text}
        </div>
    </div>
);

const SectionCard = ({
    title,
    description,
    icon: Icon,
    sectionKey,
    expanded,
    onToggle,
    children
}: {
    title: string;
    description: string;
    icon: any;
    sectionKey: string;
    expanded: boolean;
    onToggle: (key: string) => void;
    children: React.ReactNode;
}) => (
    <Card className="overflow-hidden mb-4 transition-all duration-300 ease-in-out border-slate-200 hover:border-slate-300">
        <div
            className={`p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors ${expanded ? 'bg-slate-100' : ''}`}
            onClick={() => onToggle(sectionKey)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${expanded ? 'bg-red-600 shadow-red-200' : 'bg-slate-200'}`}>
                        <Icon size={24} className={expanded ? "text-white" : "text-slate-500"} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-black ${expanded ? 'text-red-700' : 'text-slate-700'}`}>{title}</h3>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Usando renderização condicional simples para evitar problemas de layout */}
        {expanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-6 space-y-6 bg-white border-t border-slate-100">
                    {children}
                </div>
            </div>
        )}
    </Card>
);

// --- Componente Principal ---

interface LandingPageSettingsProps {
    user: User;
}

export const LandingPageSettings: React.FC<LandingPageSettingsProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Simplificando o estado de expansão para apenas o que é relevante
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        hero: true,
        about: false,
        services: false,
        contact: false,
        gallery: false
    });
    const [config, setConfig] = useState<LandingPageConfig>({
        id: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        hero_badge_text: '',
        about_title: '',
        about_text: '',
        mission_text: '',
        vision_text: '',
        values_text: '',
        services: [],
        contact: {
            phone: '',
            email: '',
            address: '',
            workingHours: ''
        },
        social: {
            facebook: '',
            instagram: '',
            linkedin: ''
        },
        cta_button_text: '',
        stats: [],
        services_title: '',
        services_subtitle: '',
        testimonials_title: '',
        testimonials_subtitle: '',
        testimonials: [],
        gallery_title: '',
        gallery_subtitle: '',
        gallery_images: [],
        cta_title: '',
        cta_subtitle: '',
        sections_visibility: {
            hero: true,
            about: true,
            stats: false,
            services: true,
            testimonials: false,
            gallery: false,
            contact: true,
            cta: true
        }
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await landingPageService.get();
            if (data) {
                setConfig({
                    ...data,
                    services: data.services || [],
                    contact: data.contact || { phone: '', email: '', address: '', workingHours: '' },
                    social: data.social || { facebook: '', instagram: '', linkedin: '' }
                });
            }
        } catch (error) {
            console.error('Failed to load landing page config:', error);
            notificationService.add({
                title: 'Erro ao Carregar',
                message: 'Não foi possível carregar as configurações.',
                type: 'SYSTEM'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await landingPageService.update(config);
            notificationService.add({
                title: 'Configurações Salvas',
                message: 'Página inicial atualizada com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to save config:', error);
            notificationService.add({
                title: 'Erro ao Salvar',
                message: 'Não foi possível salvar as alterações.',
                type: 'SYSTEM'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }

        try {
            setUploading(true);
            const url = await landingPageService.uploadImage(file);
            setConfig({ ...config, hero_image_url: url });

            notificationService.add({
                title: 'Imagem Enviada',
                message: 'Imagem carregada com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to upload image:', error);
            notificationService.add({
                title: 'Erro no Upload',
                message: 'Falha ao enviar imagem.',
                type: 'SYSTEM'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploading(true);
            const newImages: string[] = [];

            // Upload each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                    const url = await landingPageService.uploadImage(file);
                    newImages.push(url);
                }
            }

            const currentImages = config.gallery_images || [];
            setConfig({ ...config, gallery_images: [...currentImages, ...newImages] });

            notificationService.add({
                title: 'Galeria Atualizada',
                message: `${newImages.length} imagem(ns) adicionada(s) com sucesso.`,
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to upload gallery images:', error);
            notificationService.add({
                title: 'Erro no Upload',
                message: 'Falha ao enviar algumas imagens.',
                type: 'SYSTEM'
            });
        } finally {
            setUploading(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        const currentImages = config.gallery_images || [];
        const newImages = currentImages.filter((_, i) => i !== index);
        setConfig({ ...config, gallery_images: newImages });
    };

    const toggleExpanded = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Services Helper
    const addService = () => {
        setConfig({
            ...config,
            services: [...(config.services || []), { title: '', description: '', icon: 'activity' }]
        });
    };

    const updateService = (index: number, field: string, value: string) => {
        const newServices = [...(config.services || [])];
        newServices[index] = { ...newServices[index], [field]: value };
        setConfig({ ...config, services: newServices });
    };

    const removeService = (index: number) => {
        const newServices = (config.services || []).filter((_, i) => i !== index);
        setConfig({ ...config, services: newServices });
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 size={40} className="animate-spin text-red-600 mx-auto mb-4" />
                <p className="text-slate-400 italic">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Editor da Página Inicial</h2>
                    <p className="text-slate-500 text-sm">Personalize o conteúdo da sua Landing Page</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-900/10"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">Novo Layout Simplificado</p>
                        <p className="text-sm text-blue-700">
                            A página agora usa um layout moderno de "Tela Dividida" com abas.
                            Edite apenas as seções **Hero**, **Sobre**, **Serviços** e **Contato**.
                        </p>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <SectionCard
                title="Identidade Visual (Hero)"
                description="Lado esquerdo da tela: Título, Slogan e Botão"
                icon={Star}
                sectionKey="hero"
                expanded={expandedSections['hero']}
                onToggle={toggleExpanded}
            >
                <Input
                    label={
                        <span className="flex items-center">
                            Título Principal
                        </span>
                    }
                    value={config.hero_title}
                    onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                    placeholder="Ex: ABCUNA"
                />

                <Textarea
                    label={
                        <span className="flex items-center">
                            Subtítulo / Slogan
                        </span>
                    }
                    value={config.hero_subtitle}
                    onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                    placeholder="Ex: Excelência em salvar vidas..."
                    rows={2}
                />

                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label={
                            <span className="flex items-center">
                                Texto do Badge
                            </span>
                        }
                        value={config.hero_badge_text || ''}
                        onChange={(e) => setConfig({ ...config, hero_badge_text: e.target.value })}
                        placeholder="Ex: Desde 2020"
                    />

                    <Input
                        label="Texto do Botão Principal"
                        value={config.cta_button_text || ''}
                        onChange={(e) => setConfig({ ...config, cta_button_text: e.target.value })}
                        placeholder="Ex: Área do Associado"
                    />
                </div>

                {/* Hero Image Section - Mantida mas simplificada */}
                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Imagem de Fundo (Opcional)
                    </label>
                    <div className="flex items-center gap-4">
                        {config.hero_image_url && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={config.hero_image_url}
                                    alt="Hero"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <label className="cursor-pointer">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 w-fit">
                                    <Upload size={16} />
                                    Escolher Imagem
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* About Section */}
            <SectionCard
                title="Aba: Sobre"
                description="Texto institucional e valores"
                icon={Info}
                sectionKey="about"
                expanded={expandedSections['about']}
                onToggle={toggleExpanded}
            >
                <Input
                    label="Título da Aba"
                    value={config.about_title || ''}
                    onChange={(e) => setConfig({ ...config, about_title: e.target.value })}
                    placeholder="Ex: Nossa Essência"
                />

                <Textarea
                    label="Texto Institucional"
                    value={config.about_text}
                    onChange={(e) => setConfig({ ...config, about_text: e.target.value })}
                    placeholder="Resumo principal sobre a organização..."
                    rows={4}
                />

                <div className="grid md:grid-cols-3 gap-4">
                    <Textarea
                        label="Missão"
                        value={config.mission_text}
                        onChange={(e) => setConfig({ ...config, mission_text: e.target.value })}
                        rows={3}
                        placeholder="Nossa missão..."
                    />

                    <Textarea
                        label="Visão"
                        value={config.vision_text}
                        onChange={(e) => setConfig({ ...config, vision_text: e.target.value })}
                        rows={3}
                        placeholder="Nossa visão..."
                    />

                    <Textarea
                        label="Valores"
                        value={config.values_text}
                        onChange={(e) => setConfig({ ...config, values_text: e.target.value })}
                        rows={3}
                        placeholder="Nossos valores..."
                    />
                </div>
            </SectionCard>

            {/* Services Section */}
            <SectionCard
                title="Aba: Serviços"
                description="Lista de serviços oferecidos"
                icon={Award}
                sectionKey="services"
                expanded={expandedSections['services']}
                onToggle={toggleExpanded}
            >
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">Recomendado: 4 serviços principais</p>
                    <Button onClick={addService} size="sm" className="flex items-center gap-2">
                        <Plus size={16} /> Adicionar
                    </Button>
                </div>

                {config.services && config.services.length > 0 ? (
                    <div className="space-y-3">
                        {config.services.map((service, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-start">
                                <div className="flex-1 space-y-2 w-full">
                                    <Input
                                        placeholder="Título (ex: APH)"
                                        value={service.title}
                                        onChange={(e) => updateService(index, 'title', e.target.value)}
                                        className="font-bold"
                                    />
                                    <Input
                                        placeholder="Descrição breve..."
                                        value={service.description}
                                        onChange={(e) => updateService(index, 'description', e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => removeService(index)}
                                    className="text-red-500 hover:text-red-700 p-2 md:mt-2"
                                    title="Remover Serviço"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <p className="text-slate-500">Nenhum serviço cadastrado.</p>
                    </div>
                )}
            </SectionCard>

            {/* Contact Section */}
            <SectionCard
                title="Aba: Contato"
                description="Dados de contato e redes sociais"
                icon={Phone}
                sectionKey="contact"
                expanded={expandedSections['contact']}
                onToggle={toggleExpanded}
            >
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Input
                        label="Telefone"
                        value={config.contact?.phone || ''}
                        onChange={(e) => setConfig({
                            ...config,
                            contact: { ...config.contact, phone: e.target.value }
                        })}
                        placeholder="(00) 00000-0000"
                    />
                    <Input
                        label="E-mail"
                        value={config.contact?.email || ''}
                        onChange={(e) => setConfig({
                            ...config,
                            contact: { ...config.contact, email: e.target.value }
                        })}
                        placeholder="contato@exemplo.com"
                    />
                    <Input
                        label="Endereço / Localização"
                        value={config.contact?.address || ''}
                        onChange={(e) => setConfig({
                            ...config,
                            contact: { ...config.contact, address: e.target.value }
                        })}
                        placeholder="Cidade - UF"
                    />
                </div>

                <div className="border-t pt-4 mt-6">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        Redes Sociais <span className="text-xs font-normal text-slate-500">(Links completos)</span>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Facebook"
                            value={config.social?.facebook || ''}
                            onChange={(e) => setConfig({
                                ...config,
                                social: { ...config.social, facebook: e.target.value }
                            })}
                            placeholder="https://facebook.com/..."
                        />
                        <Input
                            label="Instagram"
                            value={config.social?.instagram || ''}
                            onChange={(e) => setConfig({
                                ...config,
                                social: { ...config.social, instagram: e.target.value }
                            })}
                            placeholder="https://instagram.com/..."
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Gallery Section */}
            <SectionCard
                title="Aba: Galeria de Imagens"
                description="Fotos para o carrossel da página inicial"
                icon={Eye}
                sectionKey="gallery"
                expanded={expandedSections['gallery']}
                onToggle={toggleExpanded}
            >
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Imagens do Carrossel
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {config.gallery_images?.map((img, idx) => (
                            <div key={idx} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img src={img} alt={`Galeria ${idx}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => removeGalleryImage(idx)}
                                        className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                        title="Remover Imagem"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4 hover:border-red-400 hover:bg-red-50 transition-colors aspect-video">
                            <Upload size={24} className="text-slate-400 mb-2" />
                            <span className="text-xs font-medium text-slate-600 text-center">
                                {uploading ? 'Enviando...' : 'Adicionar Fotos'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-slate-500">
                        <Info size={12} className="inline mr-1" />
                        Formatos aceitos: JPG, PNG. Recomendado: 1200x500px (Formato Horizontal/Banner).
                    </p>
                </div>
            </SectionCard>
        </div>
    );
};
