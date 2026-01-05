import { useEffect, useRef, useCallback } from 'react';

interface UseUserActivityOptions {
    onInactive?: () => void;
    inactivityTimeout?: number; // em milissegundos
    enabled?: boolean;
}

/**
 * Hook para monitorar atividade do usuário
 * Detecta: cliques, teclas, movimentos do mouse, scroll, touch
 */
export const useUserActivity = ({
    onInactive,
    inactivityTimeout = 12 * 60 * 60 * 1000, // 12 horas padrão
    enabled = true
}: UseUserActivityOptions = {}) => {
    const lastActivityRef = useRef<number>(Date.now());
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Atualiza o timestamp da última atividade
    const updateActivity = useCallback(() => {
        const now = Date.now();
        lastActivityRef.current = now;
        localStorage.setItem('lastActivityTime', now.toString());
    }, []);

    // Verifica se o usuário está inativo
    const checkInactivity = useCallback(() => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityRef.current;

        if (timeSinceActivity >= inactivityTimeout && onInactive) {
            onInactive();
        }
    }, [inactivityTimeout, onInactive]);

    // Reseta o timer de inatividade
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        updateActivity();

        // Configura novo timer
        inactivityTimerRef.current = setTimeout(() => {
            checkInactivity();
        }, inactivityTimeout);
    }, [inactivityTimeout, updateActivity, checkInactivity]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Restaura última atividade do localStorage se existir
        const savedActivity = localStorage.getItem('lastActivityTime');
        if (savedActivity) {
            lastActivityRef.current = parseInt(savedActivity, 10);
        } else {
            updateActivity();
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
            resetInactivityTimer();
        };

        // Adiciona listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Verifica inatividade periodicamente (a cada minuto)
        checkIntervalRef.current = setInterval(checkInactivity, 60 * 1000);

        // Inicia o timer inicial
        resetInactivityTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });

            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }

            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [enabled, resetInactivityTimer, checkInactivity, updateActivity]);

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
