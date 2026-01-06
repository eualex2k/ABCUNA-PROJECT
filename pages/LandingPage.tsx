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

    // Default content
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
        stats: [
            { label: 'Vidas Salvas', value: '10.000+', icon: 'users' },
            { label: 'Anos de Experiência', value: '15+', icon: 'award' },
            { label: 'Profissionais', value: '200+', icon: 'shield' },
            { label: 'Atendimentos/Ano', value: '50.000+', icon: 'activity' }
        ],
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
            stats: true,
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
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
                            className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-brand-600/30 transition-all"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero with dynamic patterns */}
            {displayConfig.sections_visibility.hero && (
                <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-50/30"></div>

                    {/* Grid pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-40"
                        style={{
                            backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
                            backgroundSize: '4rem 4rem'
                        }}
                    ></div>

                    {/* Animated gradient orbs */}
                    <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-brand-600/10 to-brand-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-600/10 to-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-purple-600/5 to-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-full mb-8">
                                <Sparkles size={14} className="text-brand-600" />
                                <span className="text-xs font-semibold text-brand-700">
                                    {displayConfig.hero_badge_text || 'Salvando vidas desde sempre'}
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                                {displayConfig.hero_title}
                            </h1>

                            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                                {displayConfig.hero_subtitle}
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-brand-600/30 transition-all inline-flex items-center gap-2"
                                >
                                    Acessar o Sistema
                                    <ArrowRight size={20} />
                                </button>
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-brand-600 hover:text-brand-600 transition-all"
                                >
                                    Saiba mais
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Stats with dark background */}
            {displayConfig.sections_visibility.stats && displayConfig.stats && displayConfig.stats.length > 0 && (
                <section className="py-20 px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800 relative overflow-hidden">
                    {/* Subtle grid */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                            backgroundSize: '3rem 3rem'
                        }}
                    ></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {displayConfig.stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-slate-400 font-medium">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* About with dot pattern */}
            {displayConfig.sections_visibility.about && (
                <section id="about" className="relative py-24 px-6 lg:px-8 bg-white overflow-hidden">
                    {/* Dot pattern */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}
                    ></div>

                    {/* Decorative gradient orbs */}
                    <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-brand-100/40 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-72 h-72 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-2 gap-16 items-start">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                                    {displayConfig.about_title || 'Sobre Nós'}
                                </h2>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {displayConfig.about_text}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative p-6 bg-gradient-to-br from-brand-50 to-white border-l-4 border-brand-600 rounded-r-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
                                            <Target size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Missão</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.mission_text}
                                    </p>
                                </div>

                                <div className="relative p-6 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-600 rounded-r-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <Eye size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Visão</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.vision_text}
                                    </p>
                                </div>

                                <div className="relative p-6 bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-600 rounded-r-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                            <Heart size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Valores</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.values_text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Services with diagonal pattern */}
            {displayConfig.sections_visibility.services && displayConfig.services && displayConfig.services.length > 0 && (
                <section id="services" className="relative py-24 px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                    {/* Diagonal stripes pattern */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, #f1f5f9 35px, #f1f5f9 70px)`
                        }}
                    ></div>

                    {/* Gradient accents */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-brand-200/20 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-blue-200/20 to-transparent rounded-full blur-3xl"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                                {displayConfig.services_title || 'Nossos Serviços'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.services_subtitle || 'Soluções completas para atendimento de emergências'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {displayConfig.services.map((service, index) => (
                                <div
                                    key={index}
                                    className="group relative p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-brand-600 hover:shadow-xl hover:shadow-brand-600/10 transition-all"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/5 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">
                                        {service.title}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed relative z-10">
                                        {service.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials with wave pattern */}
            {displayConfig.sections_visibility.testimonials && displayConfig.testimonials && displayConfig.testimonials.length > 0 && (
                <section className="relative py-24 px-6 lg:px-8 bg-white overflow-hidden">
                    {/* Wave pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                    <path d="M0 50 Q 25 40, 50 50 T 100 50" stroke="#e2e8f0" strokeWidth="1" fill="none" />
                                    <path d="M0 60 Q 25 50, 50 60 T 100 60" stroke="#e2e8f0" strokeWidth="1" fill="none" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#wave)" />
                        </svg>
                    </div>

                    {/* Colored accents */}
                    <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-brand-100/30 to-transparent rounded-full blur-2xl"></div>
                    <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                                {displayConfig.testimonials_title || 'Depoimentos'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.testimonials_subtitle || 'O que nossos parceiros dizem'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {displayConfig.testimonials.map((testimonial, index) => {
                                const colors = [
                                    { bg: 'from-brand-50 to-white', border: 'border-brand-600' },
                                    { bg: 'from-blue-50 to-white', border: 'border-blue-600' },
                                    { bg: 'from-purple-50 to-white', border: 'border-purple-600' }
                                ];
                                const color = colors[index % 3];

                                return (
                                    <div key={index} className={`p-6 bg-gradient-to-br ${color.bg} border-l-4 ${color.border} rounded-r-xl`}>
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                                            ))}
                                        </div>
                                        <p className="text-slate-700 leading-relaxed mb-6 italic">
                                            "{testimonial.content}"
                                        </p>
                                        <div>
                                            <p className="font-bold text-slate-900">{testimonial.name}</p>
                                            <p className="text-sm text-slate-600">{testimonial.role}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery */}
            {displayConfig.sections_visibility.gallery && displayConfig.gallery_images.length > 0 && (
                <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-12 text-center">
                            {displayConfig.gallery_title || 'Galeria'}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {displayConfig.gallery_images.map((image, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-2xl overflow-hidden bg-slate-200 hover:shadow-xl transition-shadow"
                                >
                                    <img
                                        src={image}
                                        alt={`Galeria ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact with circuit pattern */}
            {displayConfig.sections_visibility.contact && displayConfig.contact && (
                <section id="contact" className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-white via-slate-50/50 to-white overflow-hidden">
                    {/* Circuit board inspired pattern */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                    ></div>

                    {/* Colored dots like circuit nodes */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-600 rounded-full"></div>
                    <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-600 rounded-full"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-green-600 rounded-full"></div>

                    {/* Gradient accents */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-50/50 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-50/50 to-transparent rounded-full blur-3xl"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-2 gap-16">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                                    Entre em Contato
                                </h2>
                                <p className="text-lg text-slate-600 mb-8">
                                    Estamos aqui para ajudar. Entre em contato conosco.
                                </p>

                                {displayConfig.social && (
                                    <div className="flex items-center gap-3">
                                        {displayConfig.social.facebook && (
                                            <a href={displayConfig.social.facebook} target="_blank" rel="noopener noreferrer"
                                                className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-blue-600/30">
                                                <Facebook size={20} />
                                            </a>
                                        )}
                                        {displayConfig.social.instagram && (
                                            <a href={displayConfig.social.instagram} target="_blank" rel="noopener noreferrer"
                                                className="w-11 h-11 bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-pink-600/30">
                                                <Instagram size={20} />
                                            </a>
                                        )}
                                        {displayConfig.social.linkedin && (
                                            <a href={displayConfig.social.linkedin} target="_blank" rel="noopener noreferrer"
                                                className="w-11 h-11 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-blue-700/30">
                                                <Linkedin size={20} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                {displayConfig.contact.phone && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                                        <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/20">
                                            <Phone size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 mb-1">Telefone</p>
                                            <p className="text-slate-600">{displayConfig.contact.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.email && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                                            <Mail size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 mb-1">E-mail</p>
                                            <p className="text-slate-600">{displayConfig.contact.email}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.address && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/20">
                                            <MapPin size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 mb-1">Endereço</p>
                                            <p className="text-slate-600">{displayConfig.contact.address}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.workingHours && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-600/20">
                                            <Clock size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 mb-1">Horário</p>
                                            <p className="text-slate-600">{displayConfig.contact.workingHours}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA with mesh gradient */}
            {displayConfig.sections_visibility.cta && (
                <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                    {/* Mesh gradient background */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-blue-600/10"></div>
                        <div className="absolute inset-0 bg-gradient-to-tl from-purple-600/10 via-transparent to-pink-600/10"></div>
                    </div>

                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                            backgroundSize: '4rem 4rem'
                        }}
                    ></div>

                    {/* Animated orbs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            {displayConfig.cta_title || 'Pronto para fazer a diferença?'}
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            {displayConfig.cta_subtitle || 'Junte-se à nossa equipe e ajude a salvar vidas.'}
                        </p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
                        >
                            {displayConfig.cta_button_text || 'Acessar o Sistema'}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-12 px-6 lg:px-8 bg-white border-t border-slate-200">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                                <Flame size={20} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-slate-900">ABCUNA</span>
                        </div>
                        <p className="text-sm text-slate-600">
                            © {new Date().getFullYear()} ABCUNA. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
