import { useEffect, useRef, useCallback } from 'react';

interface UseUserActivityOptions {
    onInactive?: () => void;
    inactivityTimeout?: number; // em milissegundos - tempo SEM ATIVIDADE para mostrar modal
    enabled?: boolean;
}

/**
 * Hook para monitorar atividade do usuário de forma inteligente
 * 
 * Lógica:
 * - Se o usuário estiver ATIVO (usando o sistema), não faz nada
 * - Se o usuário ficar INATIVO por X tempo, chama onInactive (mostra modal)
 * - O modal dá 60s para o usuário confirmar presença
 * 
 * Detecta: cliques, teclas, movimentos do mouse, scroll, touch
 */
export const useUserActivity = ({
    onInactive,
    inactivityTimeout = 30 * 60 * 1000, // 30 minutos de INATIVIDADE padrão
    enabled = true
}: UseUserActivityOptions = {}) => {
    const lastActivityRef = useRef<number>(Date.now());
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasTriggeredInactiveRef = useRef<boolean>(false);

    // Atualiza o timestamp da última atividade
    const updateActivity = useCallback(() => {
        const now = Date.now();
        lastActivityRef.current = now;
        localStorage.setItem('lastActivityTime', now.toString());

        // Reset da flag de inatividade quando há atividade
        hasTriggeredInactiveRef.current = false;

        // Reinicia o timer de inatividade
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Configura novo timer para detectar inatividade
        if (enabled && onInactive) {
            inactivityTimerRef.current = setTimeout(() => {
                // Só dispara se ainda não tiver disparado
                if (!hasTriggeredInactiveRef.current) {
                    console.log(`Usuário inativo por ${inactivityTimeout / 60000} minutos`);
                    hasTriggeredInactiveRef.current = true;
                    onInactive();
                }
            }, inactivityTimeout);
        }
    }, [inactivityTimeout, onInactive, enabled]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Restaura última atividade do localStorage se existir
        const savedActivity = localStorage.getItem('lastActivityTime');
        if (savedActivity) {
            const savedTime = parseInt(savedActivity, 10);
            lastActivityRef.current = savedTime;

            // Verifica se já está inativo desde o último acesso
            const timeSinceActivity = Date.now() - savedTime;
            if (timeSinceActivity >= inactivityTimeout && onInactive && !hasTriggeredInactiveRef.current) {
                console.log('Usuário já estava inativo desde o último acesso');
                hasTriggeredInactiveRef.current = true;
                onInactive();
                return;
            }
        }

        // Eventos que indicam atividade do usuário
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'keydown'
        ];

        // Handler para eventos de atividade
        const handleActivity = () => {
            updateActivity();
        };

        // Adiciona listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Inicia o timer inicial
        updateActivity();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });

            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [enabled, updateActivity, inactivityTimeout, onInactive]);

    // Retorna funções úteis
    return {
        updateActivity,
        getLastActivityTime: () => lastActivityRef.current,
        getTimeSinceActivity: () => Date.now() - lastActivityRef.current,
        isActive: () => {
            const timeSinceActivity = Date.now() - lastActivityRef.current;
            return timeSinceActivity < inactivityTimeout;
        }
    };
};

/**
 * Hook simplificado para verificar se passou o tempo de inatividade
 */
export const useInactivityCheck = (inactivityTimeout: number = 12 * 60 * 60 * 1000) => {
    const getInactivityStatus = useCallback(() => {
        const lastActivityTime = localStorage.getItem('lastActivityTime');
        const lastLoginTime = localStorage.getItem('lastLoginTime');

        // Usa o mais recente entre atividade e login
        const referenceTime = lastActivityTime
            ? Math.max(
                parseInt(lastActivityTime, 10),
                parseInt(lastLoginTime || '0', 10)
            )
            : parseInt(lastLoginTime || '0', 10);

        if (!referenceTime) {
            return { isInactive: false, timeSinceActivity: 0 };
        }

        const timeSinceActivity = Date.now() - referenceTime;
        const isInactive = timeSinceActivity >= inactivityTimeout;

        return {
            isInactive,
            timeSinceActivity,
            lastActivityTime: referenceTime
        };
    }, [inactivityTimeout]);

    return getInactivityStatus;
};
