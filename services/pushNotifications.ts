import { supabase } from '../lib/supabase';
import { notificationService } from './notifications';
import { pushNotificationService } from './pushNotifications';

export const pushNotificationService = {
    /**
     * Verifica se o navegador suporta Push
     */
    isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    },

    /**
     * Solicita permissão e subscreve o usuário
     */
    async subscribeUser(userId: string) {
        if (!this.isSupported()) return null;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permissão de notificação negada');
            }

            // Garante que o service worker está registrado
            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js');
            }

            await navigator.serviceWorker.ready;

            // Placeholder VAPID Key - Substituir pelo real gerado
            const VAPID_PUBLIC_KEY = 'BM_AsO7jE9y5V8V_T_E8O_S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8U8S8';

            // Verifica se já existe uma subscrição
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            // Salva no banco de dados do Supabase
            const subJSON = subscription.toJSON();

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: userId,
                    endpoint: subJSON.endpoint,
                    p256dh: subJSON.keys?.p256dh,
                    auth: subJSON.keys?.auth,
                    user_agent: navigator.userAgent,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });

            if (error) throw error;

            alert('Notificações ativadas com sucesso!');
            return subscription;
        } catch (err: any) {
            console.error('Failed to subscribe to push notifications:', err);
            alert('Erro ao ativar notificações: ' + err.message);
            throw err;
        }
    },

    /**
     * Remove a subscrição do usuário
     */
    async unsubscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove do banco de dados
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', subscription.endpoint);

                alert('Notificações desativadas.');
            }
        } catch (err) {
            console.error('Failed to unsubscribe:', err);
        }
    },

    /**
     * Converte a chave VAPID para o formato correto
     */
    urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};
