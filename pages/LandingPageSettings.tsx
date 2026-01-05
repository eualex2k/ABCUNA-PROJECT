import React, { useState, useEffect } from 'react';
import { Save, Upload, Eye, EyeOff, Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, Button, Input, Textarea, Modal } from '../components/ui';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig, User } from '../types';
import { notificationService } from '../services/notifications';

interface LandingPageSettingsProps {
    user: User;
}

export const LandingPageSettings: React.FC<LandingPageSettingsProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [config, setConfig] = useState<LandingPageConfig>({
        id: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        about_text: '',
        mission_text: '',
        vision_text: '',
        values_text: '',
        gallery_images: [],
        sections_visibility: {
            hero: true,
            about: true,
            gallery: true,
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
                setConfig(data);
            }
        } catch (error) {
            console.error('Failed to load landing page config:', error);
            notificationService.add({
                title: 'Erro ao Carregar',
                message: 'Não foi possível carregar as configurações da página inicial.',
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
                message: 'As configurações da página inicial foram atualizadas com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to save config:', error);
            notificationService.add({
                title: 'Erro ao Salvar',
                message: 'Não foi possível salvar as configurações.',
                type: 'SYSTEM'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'gallery') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        try {
            setUploading(true);
            const url = await landingPageService.uploadImage(file);

            if (type === 'hero') {
                setConfig({ ...config, hero_image_url: url });
            } else {
                setConfig({
                    ...config,
                    gallery_images: [...config.gallery_images, url]
                });
            }

            notificationService.add({
                title: 'Imagem Enviada',
                message: 'A imagem foi enviada com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to upload image:', error);
            notificationService.add({
                title: 'Erro no Upload',
                message: 'Não foi possível enviar a imagem.',
                type: 'SYSTEM'
            });
        } finally {
            setUploading(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        const newImages = config.gallery_images.filter((_, i) => i !== index);
        setConfig({ ...config, gallery_images: newImages });
    };

    const toggleSection = (section: keyof LandingPageConfig['sections_visibility']) => {
        setConfig({
            ...config,
            sections_visibility: {
                ...config.sections_visibility,
                [section]: !config.sections_visibility[section]
            }
        });
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-slate-400 italic">
                Carregando configurações...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Configurações da Página Inicial</h2>
                    <p className="text-slate-500 text-sm">Personalize o conteúdo da landing page pública</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2"
                    >
                        <Eye size={18} />
                        Pré-visualizar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex items-center gap-2"
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

            {/* Sections Visibility */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Visibilidade das Seções</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(config.sections_visibility).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => toggleSection(key as keyof LandingPageConfig['sections_visibility'])}
                            className={`p-4 rounded-lg border-2 transition-all ${value
                                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                                    : 'border-slate-200 bg-white text-slate-400'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {value ? <Eye size={20} /> : <EyeOff size={20} />}
                            </div>
                            <p className="text-sm font-bold capitalize">{key}</p>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Hero Section */}
            <Card className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Seção Hero (Principal)</h3>

                <Input
                    label="Título Principal"
                    value={config.hero_title}
                    onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                    placeholder="Ex: ABCUNA - Associação Brasileira..."
                />

                <Textarea
                    label="Subtítulo"
                    value={config.hero_subtitle}
                    onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                    placeholder="Descrição breve do propósito da associação"
                    rows={3}
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Imagem Hero</label>
                    <div className="flex items-center gap-4">
                        {config.hero_image_url && (
                            <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={config.hero_image_url}
                                    alt="Hero"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <label className="cursor-pointer">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700">
                                    <Upload size={16} />
                                    {uploading ? 'Enviando...' : 'Escolher Imagem'}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'hero')}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                            <p className="text-xs text-slate-500 mt-2">Máximo 5MB. Formatos: JPG, PNG, WebP</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* About Section */}
            <Card className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Sobre a Associação</h3>

                <Textarea
                    label="Texto Institucional"
                    value={config.about_text}
                    onChange={(e) => setConfig({ ...config, about_text: e.target.value })}
                    placeholder="Descrição completa sobre a associação"
                    rows={4}
                />

                <div className="grid md:grid-cols-3 gap-6">
                    <Textarea
                        label="Missão"
                        value={config.mission_text}
                        onChange={(e) => setConfig({ ...config, mission_text: e.target.value })}
                        placeholder="Nossa missão..."
                        rows={4}
                    />

                    <Textarea
                        label="Visão"
                        value={config.vision_text}
                        onChange={(e) => setConfig({ ...config, vision_text: e.target.value })}
                        placeholder="Nossa visão..."
                        rows={4}
                    />

                    <Textarea
                        label="Valores"
                        value={config.values_text}
                        onChange={(e) => setConfig({ ...config, values_text: e.target.value })}
                        placeholder="Nossos valores..."
                        rows={4}
                    />
                </div>
            </Card>

            {/* Gallery Section */}
            <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Galeria de Imagens</h3>
                    <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors text-sm font-medium">
                            <Plus size={16} />
                            Adicionar Imagem
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'gallery')}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {config.gallery_images.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">Nenhuma imagem na galeria</p>
                        <p className="text-sm text-slate-400 mt-1">Adicione imagens para exibir na página inicial</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {config.gallery_images.map((image, index) => (
                            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={image}
                                    alt={`Galeria ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Pré-visualização da Página Inicial"
                maxWidth="5xl"
            >
                <div className="space-y-4">
                    <div className="bg-slate-100 p-4 rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">
                            <strong>Nota:</strong> Esta é uma pré-visualização simplificada. Para ver a página completa, salve as alterações e acesse a página inicial pública.
                        </p>
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {/* Hero Preview */}
                        {config.sections_visibility.hero && (
                            <div className="bg-slate-900 text-white p-8 rounded-lg">
                                <h2 className="text-2xl font-bold mb-2">{config.hero_title || 'Título não definido'}</h2>
                                <p className="text-slate-300">{config.hero_subtitle || 'Subtítulo não definido'}</p>
                            </div>
                        )}

                        {/* About Preview */}
                        {config.sections_visibility.about && (
                            <div className="bg-white p-8 rounded-lg border border-slate-200">
                                <h3 className="text-xl font-bold mb-4">Sobre a Associação</h3>
                                <p className="text-slate-600 mb-6">{config.about_text || 'Texto não definido'}</p>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <h4 className="font-bold mb-2">Missão</h4>
                                        <p className="text-sm text-slate-600">{config.mission_text || 'Não definido'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-2">Visão</h4>
                                        <p className="text-sm text-slate-600">{config.vision_text || 'Não definido'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-2">Valores</h4>
                                        <p className="text-sm text-slate-600">{config.values_text || 'Não definido'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gallery Preview */}
                        {config.sections_visibility.gallery && config.gallery_images.length > 0 && (
                            <div className="bg-slate-50 p-8 rounded-lg">
                                <h3 className="text-xl font-bold mb-4">Galeria</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {config.gallery_images.slice(0, 6).map((image, index) => (
                                        <div key={index} className="aspect-video rounded overflow-hidden">
                                            <img src={image} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
