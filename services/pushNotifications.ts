import { supabase } from '../lib/supabase';

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
    /**
     * Solicita permissão e subscreve o usuário
     * @param silent Se true, não solicita permissão se ainda não tiver, apenas atualiza se já existir
     */
    async subscribeUser(userId: string, silent = false) {
        if (!this.isSupported()) {
            console.warn('Push notifications not supported in this browser.');
            return null;
        }

        try {
            const currentPermission = Notification.permission;

            if (silent && currentPermission !== 'granted') {
                return null;
            }

            if (currentPermission === 'denied') {
                if (!silent) alert('As notificações estão bloqueadas no seu navegador. Por favor, ative-as nas configurações do site.');
                return null;
            }

            if (currentPermission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    if (!silent) throw new Error('Permissão de notificação negada');
                    return null;
                }
            }

            // Garante que o service worker está registrado e ativo
            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                console.log('Registrando service worker...');
                registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            }

            // Aguarda o SW estar pronto
            const readyRegistration = await navigator.serviceWorker.ready;

            // Chave VAPID Pública
            const VAPID_PUBLIC_KEY = 'BFX7msqv0fBlqIOeFdGHMNRCmgYeuTvWhU5W1A294e45oEjcUtjqIbgcWoHGrTVFs34he3g6bcxuSZiOqXPE6qg';

            // Verifica se já existe uma subscrição
            let subscription = await readyRegistration.pushManager.getSubscription();

            if (!subscription) {
                console.log('Criando nova subscrição push...');
                subscription = await readyRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            // Salva no banco de dados do Supabase
            const subJSON = subscription.toJSON();
            console.log('Subscrição obtida com sucesso:', subJSON.endpoint);

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

            if (error) {
                console.error('Erro ao salvar subscrição no Supabase:', error);
                throw error;
            }

            console.log('Subscrição ativa e sincronizada com o banco de dados.');
            return subscription;
        } catch (err: any) {
            console.error('Falha detalhada na subscrição de push:', err);
            if (!silent) {
                if (err.name === 'NotAllowedError') {
                    alert('As notificações foram bloqueadas. Por favor, ative-as nas configurações do seu navegador para este site.');
                } else {
                    alert('Erro ao ativar notificações: ' + (err.message || 'Verifique sua conexão ou chaves VAPID.'));
                }
            }
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
