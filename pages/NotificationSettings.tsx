import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, Laptop, Trash2, Send, CheckCircle2, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { User } from '../types';
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

    // Mock preferences for visual wow factor
    const [prefs, setPrefs] = useState({
        sound: true,
        financial: true,
        events: true,
        shifts: true
    });

    useEffect(() => {
        checkPermission();
        fetchDevices();
        
        // Load local preferences
        const localPrefs = localStorage.getItem('abcuna_notif_prefs');
        if (localPrefs) {
            try { setPrefs(JSON.parse(localPrefs)); } catch (e) {}
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
        
        if (confirm('Deseja realmente desconectar este dispositivo de receber notificações?')) {
            await supabase.from('push_subscriptions').delete().eq('id', id);
            await fetchDevices();
        }
    };

    const handleTestPush = async () => {
        setTesting(true);
        try {
            await notificationService.add({
                title: 'Alerta de Teste de ' + user.name,
                message: 'Você configurou suas notificações com sucesso. O sistema está operante!',
                type: 'SYSTEM',
                targetUserIds: [user.id]
            });
            setTimeout(() => { alert('Teste disparado! Cheque suas notificações.'); }, 500);
        } catch (err) {
            alert('Falha ao disparar teste.');
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
                                Desativar Notificações
                            </Button>
                        ) : (
                            <Button onClick={handleSubscribe} className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30">
                                Ativar Agora
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meus Dispositivos Panel */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                                <Smartphone size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Meus Aparelhos Conectados</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchDevices} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'animate-spin text-brand-500' : 'text-slate-400'} />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {devices.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">Nenhum aparelho conectado no momento.</p>
                        ) : (
                            devices.map((dev, index) => {
                                // A rough heuristic to see if it's the current device endpoint 
                                // (Since we don't store endpoint in local state easily, we mark the most recent if nothing else)
                                const isCurrent = index === 0; // simplistic assumption for visual wow

                                return (
                                    <div key={dev.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-brand-200 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-50 rounded-full text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                                {getDeviceIcon(dev.user_agent)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">
                                                    {isCurrent ? 'Este Dispositivo' : `Sessão #${index + 1}`}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-slate-400 capitalize truncate max-w-[200px]" title={dev.user_agent}>
                                                        {dev.user_agent.split(' ')[0] || 'Browser'}
                                                    </p>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(dev.updated_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteDevice(dev.id, isCurrent)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Desconectar dispotivo"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Preferências Locais */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Bell size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Preferências de Alerta</h3>
                        </div>

                        <div className="space-y-1">
                            {/* Toggle Component Implementation */}
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

                    {/* Ferramenta de Teste */}
                    <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-none relative overflow-hidden">
                        {/* Blob decór */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-500 opacity-20 blur-3xl rounded-full"></div>
                        
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center gap-2 text-white mb-2">
                                    <ShieldAlert size={18} className="text-brand-400" />
                                    <h3 className="font-bold text-lg">Diagnóstico do Sistema</h3>
                                </div>
                                <p className="text-slate-400 text-sm mb-6">
                                    Use este botão para forçar o servidor a enviar uma notificação de teste diretamente para todos os seus dispositivos conectados agora.
                                </p>
                            </div>
                            <Button 
                                onClick={handleTestPush} 
                                disabled={testing || permissionStatus !== 'granted'} 
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 py-6"
                            >
                                {testing ? 'Enviando pacote...' : (
                                    <span className="flex items-center gap-2">
                                        <Send size={18} /> Disparar Teste de Servidor
                                    </span>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
