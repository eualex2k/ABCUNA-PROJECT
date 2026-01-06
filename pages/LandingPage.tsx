import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, ArrowRight, Target, Eye, Heart,
    Users, Award, Shield, Phone, Mail, MapPin,
    Facebook, Instagram, Twitter, Linkedin, Youtube, Star,
    TrendingUp, Activity, CheckCircle, Zap, Clock, Sparkles
} from 'lucide-react';
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

    const defaultConfig: LandingPageConfig = {
        id: '',
        hero_title: 'ABCUNA',
        hero_subtitle: 'Dedicados a salvar vidas e servir a comunidade com excelência, profissionalismo e compromisso social.',
        hero_badge_text: 'Salvando vidas desde sempre',
        hero_image_url: '',
        about_title: 'Sobre Nós',
        about_text: 'A ABCUNA é uma organização sem fins lucrativos dedicada ao atendimento de emergências e urgências médicas. Nossa equipe altamente qualificada trabalha incansavelmente para garantir atendimento rápido e eficiente à comunidade.',
        mission_text: 'Prestar serviços de atendimento pré-hospitalar com excelência, garantindo suporte imediato e qualificado em situações de emergência.',
        vision_text: 'Ser referência nacional em atendimento de urgência e emergência, reconhecida pela qualidade técnica e compromisso com a vida.',
        values_text: 'Ética, Profissionalismo, Compromisso Social, Excelência Técnica, Respeito à Vida',
        gallery_images: [],
        stats: [],
        services: [
            { title: 'Atendimento Pré-Hospitalar', description: 'Equipe especializada em atendimento de urgência e emergência, disponível 24/7.', icon: 'activity' },
            { title: 'Treinamentos e Capacitação', description: 'Cursos e treinamentos para formação de socorristas e profissionais de saúde.', icon: 'award' },
            { title: 'Eventos e Operações', description: 'Cobertura médica para eventos esportivos, culturais e corporativos.', icon: 'calendar' },
            { title: 'Consultoria em Saúde', description: 'Assessoria técnica para empresas e instituições em gestão de emergências.', icon: 'briefcase' }
        ],
        testimonials: [
            { name: 'Maria Silva', role: 'Coordenadora de Eventos', content: 'A ABCUNA prestou um serviço excepcional no nosso evento. Profissionalismo e dedicação incomparáveis!', avatar: '' },
            { name: 'João Santos', role: 'Gestor de RH', content: 'Os treinamentos oferecidos pela ABCUNA transformaram nossa equipe de segurança. Altamente recomendado!', avatar: '' },
            { name: 'Ana Costa', role: 'Diretora Escolar', content: 'Confiamos na ABCUNA para a segurança dos nossos alunos. Equipe sempre pronta e preparada.', avatar: '' }
        ],
        contact: {
            phone: '(11) 1234-5678',
            email: 'contato@abcuna.org.br',
            address: 'Rua Exemplo, 123 - São Paulo, SP',
            workingHours: 'Seg-Sex: 8h-18h | Emergências: 24/7'
        },
        social: {
            facebook: 'https://facebook.com/abcuna',
            instagram: 'https://instagram.com/abcuna',
            linkedin: 'https://linkedin.com/company/abcuna'
        },
        cta_title: 'Pronto para fazer a diferença?',
        cta_subtitle: 'Junte-se à nossa equipe e ajude a salvar vidas.',
        cta_button_text: 'Acessar o Sistema',
        sections_visibility: {
            hero: true,
            about: true,
            stats: false,
            services: true,
            testimonials: true,
            gallery: true,
            contact: true,
            cta: true
        }
    };

    const displayConfig = config || defaultConfig;

    const getIcon = (iconName: string, size: number = 24) => {
        const icons: { [key: string]: any } = {
            users: Users, award: Award, shield: Shield, activity: Activity,
            trending: TrendingUp, check: CheckCircle, zap: Zap, clock: Clock
        };
        const IconComponent = icons[iconName] || Activity;
        return <IconComponent size={size} />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-white font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
                                <Flame size={20} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-slate-900">ABCUNA</span>
                        </div>

                        <nav className="hidden md:flex items-center gap-8">
                            {displayConfig.sections_visibility.about && (
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Sobre
                                </button>
                            )}
                            {displayConfig.sections_visibility.services && (
                                <button
                                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Serviços
                                </button>
                            )}
                            {displayConfig.sections_visibility.contact && (
                                <button
                                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Contato
                                </button>
                            )}
                        </nav>

                        <button
                            onClick={() => navigate('/auth')}
                            className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-brand-600/40 transition-all hover:scale-105"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            </header>

            {displayConfig.sections_visibility.hero && (
                <section className="relative pt-32 pb-32 px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-8">
                                <Sparkles size={14} className="text-white" />
                                <span className="text-xs font-semibold text-white">
                                    {displayConfig.hero_badge_text || 'Salvando vidas desde sempre'}
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                                {displayConfig.hero_title}
                            </h1>

                            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl">
                                {displayConfig.hero_subtitle}
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
                                >
                                    Acessar o Sistema
                                    <ArrowRight size={20} />
                                </button>
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                                >
                                    Saiba mais
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.about && (
                <section id="about" className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-200/40 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/40 to-transparent rounded-full blur-3xl"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-2 gap-16 items-start">
                            <div>
                                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                    {displayConfig.about_title || 'Sobre Nós'}
                                </h2>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {displayConfig.about_text}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative p-6 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-xl shadow-red-600/30 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <Target size={24} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold">Missão</h3>
                                    </div>
                                    <p className="text-white/90 leading-relaxed">
                                        {displayConfig.mission_text}
                                    </p>
                                </div>

                                <div className="relative p-6 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl shadow-xl shadow-orange-600/30 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <Eye size={24} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold">Visão</h3>
                                    </div>
                                    <p className="text-white/90 leading-relaxed">
                                        {displayConfig.vision_text}
                                    </p>
                                </div>

                                <div className="relative p-6 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl shadow-xl shadow-yellow-600/30 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <Heart size={24} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold">Valores</h3>
                                    </div>
                                    <p className="text-white/90 leading-relaxed">
                                        {displayConfig.values_text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.services && displayConfig.services && displayConfig.services.length > 0 && (
                <section id="services" className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(220,38,38,0.05),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.05),transparent_50%)]"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                                {displayConfig.services_title || 'Nossos Serviços'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.services_subtitle || 'Soluções completas para atendimento de emergências'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {displayConfig.services.map((service, index) => {
                                const gradients = [
                                    'from-red-600 to-red-700',
                                    'from-orange-600 to-orange-700',
                                    'from-yellow-600 to-yellow-700',
                                    'from-slate-700 to-slate-800'
                                ];
                                const shadows = [
                                    'shadow-red-600/30',
                                    'shadow-orange-600/30',
                                    'shadow-yellow-600/30',
                                    'shadow-slate-700/30'
                                ];

                                return (
                                    <div
                                        key={index}
                                        className={`group relative p-8 bg-gradient-to-br ${gradients[index % 4]} rounded-2xl shadow-xl ${shadows[index % 4]} hover:shadow-2xl hover:scale-105 transition-all text-white`}
                                    >
                                        <h3 className="text-2xl font-bold mb-3">
                                            {service.title}
                                        </h3>
                                        <p className="text-white/90 leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.testimonials && displayConfig.testimonials && displayConfig.testimonials.length > 0 && (
                <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.05),transparent_70%)]"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                {displayConfig.testimonials_title || 'Depoimentos'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.testimonials_subtitle || 'O que nossos parceiros dizem'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {displayConfig.testimonials.map((testimonial, index) => {
                                const gradients = [
                                    'from-red-600 to-red-700',
                                    'from-orange-600 to-orange-700',
                                    'from-yellow-600 to-yellow-700'
                                ];
                                const shadows = [
                                    'shadow-red-600/20',
                                    'shadow-orange-600/20',
                                    'shadow-yellow-600/20'
                                ];

                                return (
                                    <div key={index} className={`p-6 bg-gradient-to-br ${gradients[index % 3]} rounded-2xl shadow-lg ${shadows[index % 3]} text-white`}>
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className="text-yellow-300 fill-yellow-300" />
                                            ))}
                                        </div>
                                        <p className="text-white/90 leading-relaxed mb-6 italic">
                                            "{testimonial.content}"
                                        </p>
                                        <div>
                                            <p className="font-bold text-white">{testimonial.name}</p>
                                            <p className="text-sm text-white/80">{testimonial.role}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.gallery && displayConfig.gallery_images.length > 0 && (
                <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-white to-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-12 text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                            {displayConfig.gallery_title || 'Galeria'}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {displayConfig.gallery_images.map((image, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-2xl overflow-hidden bg-slate-200 hover:shadow-2xl hover:scale-105 transition-all"
                                >
                                    <img
                                        src={image}
                                        alt={`Galeria ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.contact && displayConfig.contact && (
                <section id="contact" className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-yellow-200/40 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-200/40 to-transparent rounded-full blur-3xl"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-2 gap-16">
                            <div>
                                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                    Entre em Contato
                                </h2>
                                <p className="text-lg text-slate-600 mb-8">
                                    Estamos aqui para ajudar. Entre em contato conosco.
                                </p>

                                {displayConfig.social && (
                                    <div className="flex items-center gap-3">
                                        {displayConfig.social.facebook && (
                                            <a href={displayConfig.social.facebook} target="_blank" rel="noopener noreferrer"
                                                className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 hover:scale-110 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-slate-700/40">
                                                <Facebook size={22} />
                                            </a>
                                        )}
                                        {displayConfig.social.instagram && (
                                            <a href={displayConfig.social.instagram} target="_blank" rel="noopener noreferrer"
                                                className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 hover:scale-110 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-orange-600/40">
                                                <Instagram size={22} />
                                            </a>
                                        )}
                                        {displayConfig.social.linkedin && (
                                            <a href={displayConfig.social.linkedin} target="_blank" rel="noopener noreferrer"
                                                className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 hover:scale-110 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-slate-700/40">
                                                <Linkedin size={22} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                {displayConfig.contact.phone && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-lg shadow-red-600/30 text-white">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Phone size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold mb-1">Telefone</p>
                                            <p className="text-white/90">{displayConfig.contact.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.email && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl shadow-lg shadow-orange-600/30 text-white">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Mail size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold mb-1">E-mail</p>
                                            <p className="text-white/90">{displayConfig.contact.email}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.address && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-lg shadow-slate-700/30 text-white">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MapPin size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold mb-1">Endereço</p>
                                            <p className="text-white/90">{displayConfig.contact.address}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.workingHours && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl shadow-lg shadow-yellow-600/30 text-white">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Clock size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold mb-1">Horário</p>
                                            <p className="text-white/90">{displayConfig.contact.workingHours}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.cta && (
                <section className="relative py-32 px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            {displayConfig.cta_title || 'Pronto para fazer a diferença?'}
                        </h2>
                        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
                            {displayConfig.cta_subtitle || 'Junte-se à nossa equipe e ajude a salvar vidas.'}
                        </p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-10 py-5 bg-white text-slate-900 font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-110 transition-all inline-flex items-center gap-2"
                        >
                            {displayConfig.cta_button_text || 'Acessar o Sistema'}
                            <ArrowRight size={22} />
                        </button>
                    </div>
                </section>
            )}

            <footer className="py-12 px-6 lg:px-8 bg-slate-900 border-t border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
                                <Flame size={20} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-white">ABCUNA</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            © {new Date().getFullYear()} ABCUNA. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
