import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = (onNewNotification) => {
  useEffect(() => {
    // Kết nối WebSocket khi component mount
    notificationService.connect(onNewNotification);

    return () => {
      // Ngắt kết nối khi unmount
      notificationService.disconnect();
    };
  }, [onNewNotification]);
};
