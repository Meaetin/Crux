export function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function supportsTriggers(): boolean {
  if (!supportsNotifications()) return false;
  try {
    return 'showTrigger' in Notification.prototype || 'TimestampTrigger' in window;
  } catch {
    return false;
  }
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!supportsNotifications()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!supportsNotifications()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}
