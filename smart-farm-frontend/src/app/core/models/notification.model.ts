export type NotificationLevel = 'critical' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string; // uuid
  level: NotificationLevel;
  title: string;
  message?: string;
  createdAt: string; // ISO string
  read: boolean;
  source?: 'system' | 'sensor' | 'device' | 'action' | 'security' | 'maintenance';
  context?: any;
  actions?: Array<{
    label: string;
    action: 'navigate' | 'ack' | 'retry' | 'dismiss' | string;
    payload?: any;
  }>;
}
