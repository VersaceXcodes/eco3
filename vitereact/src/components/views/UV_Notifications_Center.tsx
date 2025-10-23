import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_Notifications_Center: React.FC = () => {
  // Store state and methods
  const notifications = useAppStore(state => state.notifications.notifications);
  const unreadCount = useAppStore(state => state.notifications.unreadCount);
  const addNotification = useAppStore(state => state.addNotification);
  const markNotificationRead = useAppStore(state => state.markNotificationRead);
  const authToken = useAppStore(state => state.auth.authToken);

  // Fetch notifications
  const { data: apiNotifications, isError, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return response.data.map(notification => ({
        id: notification.id,
        message: notification.content,
        read: notification.is_read,
        createdAt: new Date(notification.created_at).toISOString()
      }));
    },
    enabled:!!authToken,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  // Populate store on initial load
  useEffect(() => {
    if (apiNotifications && Array.isArray(apiNotifications)) {
      apiNotifications.forEach(notification => {
        addNotification(notification);
      });
    }
  }, [apiNotifications, addNotification]);

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications/mark_all_read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      useAppStore.set(state => ({
        notifications: {
          notifications: state.notifications.notifications.map(n => ({...n, read: true })),
          unreadCount: 0,
        },
      }));
    },
  });

  // Handle individual mark as read
  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsReadMutation.mutate}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllAsReadMutation.isPending? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="cx=12 cy=12 r=10" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V4c0-2.21 1.79-4 4-4s4 1.79 4 4v8c0 2.21-1.79 4-4 4-3.01 0-5.7-1.59-6.99-3.7S3 19.7 3 21.21v3C2 24.01 1.34 24 0.93l3.34 3-3.34-3c-.34-.34-.5-1-.5-1.5C0 22.34 1.34 24 3 24h6c1.66 0 3-1.34 3-3v-3M12 3v10m0 0v3m0-3V3m9 11v-3m0 0l-2 3m0 0l2-3m-2 3V4.872l.034-.03a9.048 9.048 0 008.95-.5M6.5 21H8a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h3.5a4.5 4.5 0 011.69-2.12a9.6 9.6 0 011.38-5.4M7 4v10a4 4 0 004 4h4a4 4 0 004-4V4M4 7a3 3 0 013 3v10a3 3 0 01-3 3V7z-1m5 3a5 5 0 015 5 5 5 0 01-5-5z-1M5 12a5 5 0 015 5 5 5 0 01-5-5m5-1 3a5 5 0 014 5 5 5 0 01-4-5z-1" />
                  </svg>
                  Marking all as read...
                </span>
              ) : (
                'Mark All as Read'
              )}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" role="status" aria-hidden="true">
              <circle className="relative w-full h-full cx="0" cy="0" r="96" />
              <path fill="currentColor" d="M11.683 12.017C16.17 16.683 14.456 20 11.817 22.33 8.333 24.917 4.08 23.303 2.928 21.308c-.757-.953-.45-2.106 0.231-2.887l13.997-6.485c.784-.773.923-.844.354-.745zM14.33 10.225l-1.707 1.689h2.915l-.305 2.326 2.915-.305 1.689-1.707L20.475 14H5.525L11.683 10.017z" />
            </svg>
            <span className="sr-only">Loading notifications...</span>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8A4 4 0 018 12" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 0v-4l.01-12a9 9 0 0111.99 0v12m-11.99-1l-1 2a1 1 0 01-.41 1.41L12 17l10.99-1.01a1 1 0 011 1.42L12 21.01l-11.99-1.01a1 1 0 01-.28-1.42z" />
              </svg>
              <p className="text-sm text-red-700">Failed to load notifications. Please try again later.</p>
            </div>
          </div>
        )}

        {!isLoading && notifications.length === 0 &&!isError && (
          <div className="text-center py-12">
            <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 3m0 0l2-3m-2 3V4.872l.034-.03a9.048 9.048 0 008.95-.5M6.5 21H8a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h3.5a4.5 4.5 0 011.69-2.12a9.6 9.6 0 011.38-5.4M7 4v10a4 4 0 004 4h4a4 4 0 004-4V4M4 7a3 3 0 013 3v10a3 3 0 01-3 3V7z-1m5 3a5 5 0 015 5 5 5 0 01-5-5z-1M5 12a5 5 0 015 5 5 5 0 01-5-5m5-1 3a5 5 0 015 5 5 5 0 01-5-5z-1" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">No notifications</h2>
            <p className="mt-2 text-gray-600">You don't have any notifications yet. Check back later!</p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="space-y-6">
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id} className="group relative p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <p className={`text-base font-medium ${notification.read? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.message}
                      </p>
                      <time className={`absolute bottom-0 right-0 text-sm text-gray-500 ${notification.read? 'text-gray-400' : ''}`}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </time>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="absolute bottom-4 right-4 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UV_Notifications_Center;