import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, Laptop, Trash2, Send, CheckCircle2, ShieldAlert, AlertCircle, RefreshCw, Edit2, Check, ShieldCheck } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { pushNotificationService } from '../services/pushNotifications';
import { notificationService } from '../services/notifications';

interface NotificationSettingsProps {
    user: User;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user }) => {
    const [permissionStatus, setPermissionStatus] = useState<string>('default');
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    
    // Nomes personalizados para dispositivos
    const [deviceNames, setDeviceNames] = useState<Record<string, string>>({});
    const [editingDevice, setEditingDevice] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const isAdmin = user.role === UserRole.ADMIN;

    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastTarget, setBroadcastTarget] = useState<'me' | 'all'>('me');

    // Mock preferences 
    const [prefs, setPrefs] = useState({
        sound: true,
        financial: true,
        events: true,
        shifts: true
    });

    useEffect(() => {
        checkPermission();
        fetchDevices();
        
        const localPrefs = localStorage.getItem('abcuna_notif_prefs');
        if (localPrefs) {
            try { setPrefs(JSON.parse(localPrefs)); } catch (e) {}
        }
        
        const localNames = localStorage.getItem('abcuna_device_names');
        if (localNames) {
            try { setDeviceNames(JSON.parse(localNames)); } catch (e) {}
        }
    }, [user.id]);

    const checkPermission = async () => {
        if (!('Notification' in window)) {
            setPermissionStatus('unsupported');
            return;
        }
        setPermissionStatus(Notification.permission);
    };

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
                
            if (!error && data) {
                setDevices(data);
            }
        } catch (err) {
            console.error('Error fetching devices', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        try {
            await pushNotificationService.subscribeUser(user.id);
            await checkPermission();
            await fetchDevices();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUnsubscribe = async () => {
        try {
            await pushNotificationService.unsubscribeUser();
            await checkPermission();
            await fetchDevices();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteDevice = async (id: string, isCurrent: boolean) => {
        if (isCurrent) {
            await handleUnsubscribe();
            return;
        }
        
        if (confirm('Deseja realmente desconectar este dispositivo? Ele não receberá mais notificações.')) {
            await supabase.from('push_subscriptions').delete().eq('id', id);
            await fetchDevices();
        }
    };

    const handleDisconnectOthers = async () => {
        if (devices.length <= 1) return;
        
        if (confirm('Atenção: Você será desconectado de TODOS os outros computadores e celulares, mantendo apenas a sessão mais recente. Confirmar limpeza?')) {
            // Keep the most recent one (index 0)
            const currentDeviceId = devices[0].id;
            
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .neq('id', currentDeviceId);
                
            alert('Todos os acessos suspeitos ou antigos foram revogados!');
            await fetchDevices();
        }
    };

    const saveDeviceName = (endpoint: string) => {
        if (!editName.trim()) {
            setEditingDevice(null);
            return;
        }
        
        setDeviceNames(prev => {
            const newNames = { ...prev, [endpoint]: editName.trim() };
            localStorage.setItem('abcuna_device_names', JSON.stringify(newNames));
            return newNames;
        });
        setEditingDevice(null);
    };

    const handleBroadcastPush = async () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
            alert('Preencha o título e a mensagem antes de disparar!');
            return;
        }

        if (broadcastTarget === 'all' && !confirm('ATENÇÃO: Este chamado será enviado via Push Notification para TODOS os celulares e computadores de todos os usuários do sistema neste exato momento. Tem certeza absoluta que deseja disparar a transmissão?')) {
            return;
        }

        setTesting(true);
        try {
            await notificationService.add({
                title: broadcastTitle,
                message: broadcastMessage,
                type: 'SYSTEM',
                targetUserIds: broadcastTarget === 'me' ? [user.id] : undefined,
                broadcast: broadcastTarget === 'all'
            });
            
            setTimeout(() => { 
                alert(broadcastTarget === 'me' ? 'Teste disparado para o seu aparelho!' : 'Mensagem transmitida com sucesso para toda a base do sistema!'); 
                setBroadcastTitle('');
                setBroadcastMessage('');
            }, 600);
        } catch (err) {
            alert('Falha interna ao disparar transmissões.');
        } finally {
            setTesting(false);
        }
    };

    const togglePref = (key: keyof typeof prefs) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(newPrefs);
        localStorage.setItem('abcuna_notif_prefs', JSON.stringify(newPrefs));
    };

    const getDeviceIcon = (agent: string) => {
        const lower = (agent || '').toLowerCase();
        if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return <Smartphone size={20} />;
        return <Laptop size={20} />;
    };

    const parseDeviceSystem = (agent: string) => {
        const lower = (agent || '').toLowerCase();
        let name = 'Dispositivo Desconhecido';
        if (lower.includes('windows')) name = 'Windows PC';
        else if (lower.includes('macintosh') || lower.includes('mac os')) name = 'MacBook / iMac';
        else if (lower.includes('iphone')) name = 'Apple iPhone';
        else if (lower.includes('android')) name = 'Smartphone Android';
        else if (lower.includes('linux')) name = 'Linux PC';
        
        let browser = '';
        if (lower.includes('edg/')) browser = 'Edge';
        else if (lower.includes('chrome/')) browser = 'Chrome';
        else if (lower.includes('firefox/')) browser = 'Firefox';
        else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari';
        
        return `${name}${browser ? ` (${browser})` : ''}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Status Banner */}
            <Card className={`p-6 border-l-4 ${permissionStatus === 'granted' ? 'border-emerald-500 bg-emerald-50/50' : 'border-amber-500 bg-amber-50/50'}`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${permissionStatus === 'granted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {permissionStatus === 'granted' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {permissionStatus === 'granted' ? 'Notificações Ativas Neste Aparelho' : 'Notificações Desativadas'}
                            </h2>
                            <p className="text-sm text-slate-600 mt-1 max-w-xl">
                                {permissionStatus === 'granted' 
                                    ? 'Este dispositivo está autorizado a receber alertas importantes do sistema em tempo real, mesmo quando a aba estiver fechada.'
                                    : 'Ative as notificações para ser avisado sobre escalas, comunicados importantes e vencimentos de mensalidade instantaneamente.'}
                            </p>
                        </div>
                    </div>
                    <div>
                        {permissionStatus === 'granted' ? (
                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors" onClick={handleUnsubscribe}>
                                Desativar Neste Aparelho
                            </Button>
                        ) : (
                            <Button onClick={handleSubscribe} className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30">
                                Ativar Notificações
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lado Esquerdo - Aparelhos de Confiança */}
                <div className="space-y-6">
                    <Card className="p-0 overflow-hidden border border-brand-100 shadow-md">
                        <div className="bg-brand-50 p-6 border-b border-brand-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white text-brand-600 rounded-lg shadow-sm">
                                        <ShieldCheck size={20} className="text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight">Aparelhos de Confiança</h3>
                                        <p className="text-xs text-brand-600 font-medium mt-0.5">Gerencie seus acessos autorizados</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={fetchDevices} disabled={loading} className="text-brand-600 hover:bg-brand-100">
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 space-y-3 bg-white">
                            {devices.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Smartphone size={32} />
                                    </div>
                                    <p className="font-bold text-slate-700">Nenhum aparelho emparelhado</p>
                                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Você não ativou as notificações em nenhum dispositivo ainda.</p>
                                </div>
                            ) : (
                                devices.map((dev, index) => {
                                    const isCurrent = index === 0;
                                    const systemName = parseDeviceSystem(dev.user_agent);
                                    const customName = deviceNames[dev.endpoint] || (isCurrent ? 'Meu Aparelho Atual' : `Sessão #${index + 1}`);

                                    return (
                                        <div key={dev.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${isCurrent ? 'border-brand-300 bg-brand-50/30' : 'border-slate-100 bg-slate-50'} hover:border-brand-400 hover:shadow-md transition-all group gap-4_`}>
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`p-3 rounded-full mt-1 ${isCurrent ? 'bg-brand-100 text-brand-600' : 'bg-white border border-slate-200 text-slate-500'} transition-colors`}>
                                                    {getDeviceIcon(dev.user_agent)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {editingDevice === dev.endpoint ? (
                                                        <div className="flex items-center gap-2 mb-1 w-full relative">
                                                            <input 
                                                                type="text" 
                                                                className="w-full text-sm font-bold border-b border-brand-500 focus:outline-none bg-transparent py-1 px-1 text-slate-800"
                                                                value={editName}
                                                                onChange={e => setEditName(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && saveDeviceName(dev.endpoint)}
                                                                autoFocus
                                                                placeholder="Dê um nome, ex: 'Celular Pessoal'"
                                                            />
                                                            <button onClick={() => saveDeviceName(dev.endpoint)} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded">
                                                                <Check size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-slate-800 text-sm truncate">{customName}</p>
                                                            <button 
                                                                onClick={() => { setEditingDevice(dev.endpoint); setEditName(deviceNames[dev.endpoint] || ''); }}
                                                                className="text-slate-300 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                title="Personalizar nome do aparelho"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-xs text-slate-500 truncate" title={dev.user_agent}>
                                                            {systemName}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                            <p className="text-[11px] font-medium text-slate-400">
                                                                Sincronizado: {new Date(dev.updated_at).toLocaleDateString('pt-BR')} às {new Date(dev.updated_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end sm:flex-col gap-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
                                                <button 
                                                    onClick={() => handleDeleteDevice(dev.id, isCurrent)}
                                                    className="w-full sm:w-auto px-4 py-2 sm:p-2.5 text-xs sm:text-base flex items-center justify-center gap-2 font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 sm:border-transparent"
                                                    title={isCurrent ? "Desativar" : "Remover este aparelho permanentemente"}
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="sm:hidden">{isCurrent ? 'Desativar Aqui' : 'Remover Aparelho'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    {/* Excluir Outros Acessos */}
                    <Card className="p-6 bg-red-50/50 border-red-100">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Proteção de Segurança</h3>
                                <p className="text-sm text-slate-600 mt-1 mb-4 leading-relaxed">
                                    Conectou em um aparelho público ou trocou de celular? Use este botão para derrubar imediatamente todas as sessões de notificação abertas em outros lugares, mantendo apenar a sua atual.
                                </p>
                                <Button 
                                    onClick={handleDisconnectOthers} 
                                    disabled={devices.length <= 1}
                                    variant="danger"
                                    className="w-full sm:w-auto"
                                >
                                    Desconectar Todos os Outros Dispositivos
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Lado Direito - Preferências & Testes */}
                <div className="space-y-6">
                    {isAdmin && (
                        <Card className="p-0 overflow-hidden border-brand-200">
                            <div className="bg-brand-600 p-6 flex items-center gap-3">
                                <Send size={24} className="text-white opacity-90" />
                                <div>
                                    <h3 className="font-bold text-lg text-white">Central de Transmissão</h3>
                                    <p className="text-brand-100 text-sm">Crie avisos instantâneos via Push</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-5 bg-white">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Público Alvo</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="target" 
                                                className="w-4 h-4 text-brand-500 focus:ring-brand-500 border-slate-300"
                                                checked={broadcastTarget === 'me'}
                                                onChange={() => setBroadcastTarget('me')}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600">Apenas Mim (Teste)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="target" 
                                                className="w-4 h-4 text-red-500 focus:ring-red-500 border-slate-300"
                                                checked={broadcastTarget === 'all'}
                                                onChange={() => setBroadcastTarget('all')}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-red-600">Todos os Usuários Ativos</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Título do Alerta</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Reunião Urgente hoje às 20h"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                        value={broadcastTitle}
                                        onChange={e => setBroadcastTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Mensagem</label>
                                    <textarea 
                                        placeholder="Escreva a mensagem que aparecerá na tela..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 min-h-[100px] resize-none"
                                        value={broadcastMessage}
                                        onChange={e => setBroadcastMessage(e.target.value)}
                                    />
                                </div>

                                <Button 
                                    onClick={handleBroadcastPush} 
                                    disabled={testing || permissionStatus !== 'granted'} 
                                    className={`w-full py-3 shadow-lg ${broadcastTarget === 'all' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'}`}
                                >
                                    {testing ? 'Transmitindo...' : (
                                        <span className="flex items-center gap-2">
                                            <Send size={18} /> {broadcastTarget === 'all' ? 'Disparar para a Base Inteira' : 'Enviar Teste Local'}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )}

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Bell size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Preferências Locais</h3>
                        </div>

                        <div className="space-y-1">
                            {[ 
                                { key: 'financial', label: 'Cobranças e Financeiro', desc: 'Avisos sobre mensalidades atrasadas ou pagamentos' },
                                { key: 'events', label: 'Eventos e Reuniões', desc: 'Lembretes de reuniões e aprovações de eventos' },
                                { key: 'shifts', label: 'Escalas e Ocorrências', desc: 'Seja notificado quando for escalado para um plantão' },
                                { key: 'sound', label: 'Efeitos Sonoros', desc: 'Tocar bip audível quando uma notificação chegar' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors" onClick={() => togglePref(item.key as any)}>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${prefs[item.key as keyof typeof prefs] ? 'bg-brand-500' : 'bg-slate-200'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${prefs[item.key as keyof typeof prefs] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
