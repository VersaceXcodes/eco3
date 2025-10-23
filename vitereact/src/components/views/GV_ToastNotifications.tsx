import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/main';

const GV_ToastNotifications: React.FC = () => {
  const notifications = useAppStore(state => state.notifications.notifications);
  const markNotificationRead = useAppStore(state => state.markNotificationRead);
  
  // Ref to track component mount status
  const mountedRef = useRef(true);

  // Auto-dismiss timeout management
  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    notifications.forEach(notification => {
      if (!notification.read) {
        const timeoutId = setTimeout(() => {
          if (mountedRef.current) {
            markNotificationRead(notification.id);
          }
        }, 5000);

        timeoutIds.push(timeoutId);
      }
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
      mountedRef.current = false;
    };
  }, [notifications, markNotificationRead]);

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
      {notifications
       .filter(notification =>!notification.read)
       .map(notification => (
          <div
            key={notification.id}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-4 transform transition-transform duration-300 ease-in-out"
            style={{ 
              transform: 'translateY(100%)',
              animation: 'slideIn 0.3s ease-in-out forwards'
            }}
            onClick={() => markNotificationRead(notification.id)}
          >
            <div className="text-sm text-gray-700">
              {notification.message}
            </div>
          </div>
        ))}
    </div>
  );
};

export default GV_ToastNotifications;