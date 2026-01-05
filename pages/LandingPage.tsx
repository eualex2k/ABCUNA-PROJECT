import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ArrowRight, Target, Eye, Heart, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig } from '../types';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<LandingPageConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await landingPageService.get();
            setConfig(data);
        } catch (error) {
            console.error('Failed to load landing page config:', error);
        } finally {
            setLoading(false);
        }
    };

    // Default content if no config is available
    const defaultConfig: LandingPageConfig = {
        id: '',
        hero_title: 'ABCUNA - Associação Brasileira de Combate a Urgências e Necessidades Assistenciais',
        hero_subtitle: 'Dedicados a salvar vidas e servir a comunidade com excelência, profissionalismo e compromisso social.',
        hero_image_url: '',
        about_text: 'A ABCUNA é uma organização sem fins lucrativos dedicada ao atendimento de emergências e urgências médicas. Nossa equipe altamente qualificada trabalha incansavelmente para garantir atendimento rápido e eficiente à comunidade.',
        mission_text: 'Prestar serviços de atendimento pré-hospitalar com excelência, garantindo suporte imediato e qualificado em situações de emergência.',
        vision_text: 'Ser referência nacional em atendimento de urgência e emergência, reconhecida pela qualidade técnica e compromisso com a vida.',
        values_text: 'Ética, Profissionalismo, Compromisso Social, Excelência Técnica, Respeito à Vida',
        gallery_images: [],
        sections_visibility: {
            hero: true,
            about: true,
            gallery: true,
            cta: true
        }
    };

    const displayConfig = config || defaultConfig;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-slate-400">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-600 rounded-xl text-white">
                                <Flame size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">ABCUNA</h1>
                                <p className="text-[9px] font-bold text-slate-400 tracking-[0.15em] uppercase">Sistema de Gestão Integrada</p>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Button
                            onClick={() => navigate('/auth')}
                            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            Entrar
                            <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            {displayConfig.sections_visibility.hero && (
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Text Content */}
                            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600/20 border border-brand-500/30 rounded-full text-sm font-medium">
                                    <Flame size={16} className="text-brand-400" />
                                    <span>Salvando vidas desde sempre</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                                    {displayConfig.hero_title}
                                </h1>

                                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
                                    {displayConfig.hero_subtitle}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={() => navigate('/auth')}
                                        size="lg"
                                        className="flex items-center gap-2 text-base shadow-2xl hover:shadow-brand-600/50 transition-all"
                                    >
                                        Acessar o Sistema
                                        <ArrowRight size={18} />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex items-center gap-2 text-base bg-white/10 border-white/20 text-white hover:bg-white/20"
                                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Saiba Mais
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </div>

                            {/* Hero Image */}
                            <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
                                <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-600/20 to-brand-800/20 border border-brand-500/30 backdrop-blur-sm overflow-hidden shadow-2xl">
                                    {displayConfig.hero_image_url ? (
                                        <img
                                            src={displayConfig.hero_image_url}
                                            alt="ABCUNA"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Flame size={120} className="text-brand-600/30" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* About Section */}
            {displayConfig.sections_visibility.about && (
                <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Sobre a Associação</h2>
                            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                {displayConfig.about_text}
                            </p>
                        </div>

                        {/* Mission, Vision, Values Cards */}
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Mission */}
                            <div className="group bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                                <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors">
                                    <Target size={28} className="text-brand-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Missão</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {displayConfig.mission_text}
                                </p>
                            </div>

                            {/* Vision */}
                            <div className="group bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                                <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors">
                                    <Eye size={28} className="text-brand-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Visão</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {displayConfig.vision_text}
                                </p>
                            </div>

                            {/* Values */}
                            <div className="group bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                                <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors">
                                    <Heart size={28} className="text-brand-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Valores</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {displayConfig.values_text}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {displayConfig.sections_visibility.gallery && displayConfig.gallery_images.length > 0 && (
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Nossa Galeria</h2>
                            <p className="text-lg text-slate-600">Conheça um pouco mais sobre nosso trabalho</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayConfig.gallery_images.map((image, index) => (
                                <div
                                    key={index}
                                    className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-700"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <img
                                        src={image}
                                        alt={`Galeria ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            {displayConfig.sections_visibility.cta && (
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl sm:text-4xl font-black">Pronto para começar?</h2>
                        <p className="text-lg sm:text-xl text-brand-100 leading-relaxed">
                            Acesse nosso sistema de gestão integrada e faça parte da nossa equipe.
                        </p>
                        <Button
                            onClick={() => navigate('/auth')}
                            size="lg"
                            variant="secondary"
                            className="flex items-center gap-2 text-base shadow-2xl hover:shadow-3xl transition-all bg-white text-brand-600 hover:bg-slate-50"
                        >
                            Acessar o Sistema
                            <ArrowRight size={18} />
                        </Button>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-400 border-t border-slate-800">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-2 bg-brand-600 rounded-lg">
                            <Flame size={20} fill="currentColor" className="text-white" />
                        </div>
                        <span className="font-bold text-white">ABCUNA</span>
                    </div>
                    <p className="text-sm">
                        © {new Date().getFullYear()} ABCUNA - Associação Brasileira de Combate a Urgências e Necessidades Assistenciais
                    </p>
                    <p className="text-xs mt-2">Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};
