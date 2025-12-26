import { Notification, NotificationType } from '../types';

const STORAGE_KEY = 'ABCUNA_NOTIFICATIONS';

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.notifications = JSON.parse(stored);
    } else {
      // Initial welcome notification
      this.add({
        title: 'Bem-vindo ao ABCUNA',
        message: 'Sistema de gestão integrado pronto para uso.',
        type: 'SYSTEM'
      });
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    this.notifyListeners();
  }

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

  getAll(): Notification[] {
    return [...this.notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  add(data: { title: string; message: string; type: NotificationType; link?: string }) {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title,
      message: data.message,
      type: data.type,
      date: new Date().toISOString(),
      read: false,
      link: data.link
    };
    this.notifications.unshift(newNotification);
    this.save();
  }

  markAsRead(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index].read = true;
      this.save();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.save();
  }

  clearAll() {
    this.notifications = [];
    this.save();
  }
}

export const notificationService = new NotificationManager();