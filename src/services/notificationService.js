import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class NotificationService {
  constructor() {
    this.client = null;
    this.subscriptions = [];
  }

  connect(onMessageCallback) {
    if (this.client && this.client.active) return;

    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP]', str),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    this.client.onConnect = () => {
      console.log('Connected to WebSocket');
      // Subscribe kênh riêng của user
      const sub = this.client.subscribe('/user/queue/notifications', (message) => {
        const notif = JSON.parse(message.body);
        console.log('New notification:', notif);
        if (onMessageCallback) onMessageCallback(notif);
        // Hiển thị toast popup
        toast.info(notif.message || 'New notification', { autoClose: 5000 });
      });
      this.subscriptions.push(sub);
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message']);
      console.error('Details:', frame.body);
    };

    this.client.activate();
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    if (this.client) this.client.deactivate();
  }
}

export const notificationService = new NotificationService();

export async function fetchNotifications({ page = 1, size = 20, filter = "all" } = {}) {
  const base = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");

  try {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));
    if (filter && filter !== "all") qs.set("filter", filter);

    const res = await fetch(`${base}/notifications?${qs.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const box = data?.data ?? data;
    const items = box?.items ?? box ?? [];
    const total = box?.total ?? (Array.isArray(items) ? items.length : 0);
    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
}