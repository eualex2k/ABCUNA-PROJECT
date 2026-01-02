import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import * as webpush from "jsr:@negrel/webpush@0.5.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function createVapidKeys(publicStr: string, privateStr: string) {
    const b64ToBuf = (b64: string) => {
        const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    };
    const bufToB64 = (buf: Uint8Array) => btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const pubBytes = b64ToBuf(publicStr);
    const x = pubBytes.slice(1, 33);
    const y = pubBytes.slice(33, 65);

    const jwk = {
        kty: "EC",
        crv: "P-256",
        x: bufToB64(x),
        y: bufToB64(y),
        d: privateStr,
        ext: true,
        key_ops: ["sign"]
    };

    const privateKey = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign"]
    );

    const publicKey = await crypto.subtle.importKey(
        "raw",
        pubBytes,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
    );

    return { privateKey, publicKey };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const requestBody = await req.json()
        const { notificationId, userIds } = requestBody

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }
                }
            }
        )

        let notification;
        if (notificationId) {
            const { data, error } = await supabaseClient
                .from('notifications')
                .select('*')
                .eq('id', notificationId)
                .single();
            if (error) {
                console.error('Notification fetch error:', error);
                notification = {
                    title: 'Nova Notificação',
                    message: 'Detalhes não encontrados.',
                    link: '/'
                };
            } else {
                notification = data;
            }
        } else {
            notification = {
                title: 'Teste de Notificação',
                message: 'Esta é uma mensagem de teste do servidor',
                link: '/'
            };
        }

        let query = supabaseClient.from('push_subscriptions').select('*')
        if (userIds && userIds.length > 0) {
            query = query.in('user_id', userIds)
        }
        const { data: subscriptions, error: dbError } = await query

        if (dbError) throw new Error(`Database Error: ${dbError.message}`)
        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ success: true, sent_count: 0, message: 'No subscriptions found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const publicVapidKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY')
        const privateVapidKey = Deno.env.get('VAPID_PRIVATE_KEY')

        if (!publicVapidKey || !privateVapidKey) {
            throw new Error('VAPID keys not configured in environment variables');
        }

        const vapidCryptoKeys = await createVapidKeys(publicVapidKey, privateVapidKey);

        const appServer = await webpush.ApplicationServer.new({
            contactInformation: 'mailto:suporte@abcuna.com.br',
            vapidKeys: vapidCryptoKeys,
        });

        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                if (!sub.endpoint || !sub.p256dh || !sub.auth) {
                    throw new Error('Incomplete subscription data');
                }

                const subscriber = appServer.subscribe({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                });

                await subscriber.pushTextMessage(
                    JSON.stringify({
                        title: notification.title,
                        message: notification.message,
                        link: notification.link || '/'
                    }),
                    { ttl: 86400, urgency: "normal" }
                );

                return { success: true, userId: sub.user_id }
            } catch (err: any) {
                const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
                const errorStack = err instanceof Error ? err.stack : undefined;
                console.error(`Erro ao enviar para ${sub.user_id}:`, errorMsg);

                if (errorMsg?.includes('410') || errorMsg?.includes('404')) {
                    await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id);
                }
                return { success: false, userId: sub.user_id, error: errorMsg, details: errorStack }
            }
        }))

        const sentCount = results.filter(r => r.success).length;

        return new Response(JSON.stringify({
            success: true,
            sent_count: sentCount,
            failed_count: results.length - sentCount,
            details: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Fatal Edge Function Error:', error.message)
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Unknown error',
            stack: error.stack
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so client can parse the JSON error
        })
    }
})
})
