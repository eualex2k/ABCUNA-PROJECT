import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../types';

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: (() => void)[] = [];
  private currentUserId: string | null = null;
  private channel: any = null;

  // Observer Pattern to update UI components
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    this.loadFromSupabase();
    this.setupRealtime(userId);
  }

  private async loadFromSupabase() {
    if (!this.currentUserId) return;

    const { data, error } = await supabase
      .from('user_notifications')
      .select(`
        id,
        read,
        created_at,
        notification:notifications (
          id,
          title,
          message,
          type,
          link
        )
      `)
      .eq('user_id', this.currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    this.notifications = data
      .filter((item: any) => item.notification)
      .map((item: any) => ({
        id: item.id,
        notificationId: item.notification.id,
        title: item.notification.title,
        message: item.notification.message,
        type: item.notification.type as NotificationType,
        date: item.created_at,
        read: item.read,
        link: item.notification.link,
        userId: this.currentUserId!
      }));

    this.notifyListeners();
  }

  private setupRealtime(userId: string) {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    this.channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          this.loadFromSupabase(); // Reload when new notification arrives
        }
      )
      .subscribe();
  }

  getAll(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Envia uma notificação (Cria no DB)
   */
  async add(data: { title: string; message: string; type: NotificationType; link?: string; targetUserIds?: string[]; broadcast?: boolean }) {
    let targets = data.targetUserIds || [this.currentUserId].filter(Boolean) as string[];

    // Se for broadcast, busca todos os associados (exclui candidatos exceto se especificado)
    if (data.broadcast) {
      const { data: allUsers } = await supabase.from('profiles').select('id');
      if (allUsers) targets = allUsers.map((u: any) => u.id);
    }

    if (targets.length === 0) return;

    try {
      // 1. Cria os registros de notificação no banco de dados
      const { data: notificationId, error: rpcError } = await supabase.rpc('notify_users', {
        target_user_ids: targets,
        notif_title: data.title,
        notif_message: data.message,
        notif_type: data.type,
        notif_link: data.link || null
      });

      if (rpcError) throw rpcError;

      // 2. Dispara a Edge Function para enviar o Push (Web Push API)
      console.log(`Triggering push for ${targets.length} targets...`);

      const { data: funcResult, error: funcError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          notificationId,
          userIds: targets
        }
      });

      if (funcError) {
        console.error('Failed to trigger push edge function:', funcError);
      } else {
        console.log('Push function result:', funcResult);
      }

    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications[index].read = true;
        this.notifyListeners();
      }
    }
  }

  async markAllAsRead() {
    if (!this.currentUserId) return;

    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', this.currentUserId)
      .eq('read', false);

    if (!error) {
      this.notifications.forEach(n => n.read = true);
      this.notifyListeners();
    }
  }

  async clearAll() {
    if (!this.currentUserId) return;

    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', this.currentUserId);

    if (!error) {
      this.notifications = [];
      this.notifyListeners();
    }
  }
}

export const notificationService = new NotificationManager();