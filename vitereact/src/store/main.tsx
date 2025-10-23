import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { io } from 'socket.io-client';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  profile_image_url: string | null;
  created_at: string;
}

interface AuthState {
  currentUser: User | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

interface Preferences {
  theme: 'dark' | 'light';
  unitSystem: 'metric' | 'imperial';
  dataExportFormat: 'csv' | 'pdf';
  optOutDataSharing: boolean;
}

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

interface AppState {
  auth: AuthState;
  preferences: Preferences;
  notifications: NotificationsState;
  socket: ReturnType<typeof io> | null;
}

// Store creation
export const useAppStore = create(
  persist(
    (set) => {
      let socket: ReturnType<typeof io> | null = null;

      // Initialize WebSocket connection
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      socket = io(apiUrl);

      // Realtime event handlers
      socket.on('challenge_leaderboard_update', (data: any) => {
        console.log('Received leaderboard update:', data);
        // Update relevant state when implementation details are known
      });

      socket.on('impact_metric_update', (data: any) => {
        console.log('Received impact metric update:', data);
        // Update relevant state when implementation details are known
      });

      // Cleanup on store destruction
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };

      // Initial state
      return {
        auth: {
          currentUser: null,
          authToken: null,
          isAuthenticated: false,
          isLoading: true,
          errorMessage: null,
        },
        preferences: {
          theme: 'light',
          unitSystem: 'metric',
          dataExportFormat: 'csv',
          optOutDataSharing: false,
        },
        notifications: {
          notifications: [],
          unreadCount: 0,
        },
        socket: socket,
      };
    },
    {
      name: 'eco3-store',
      partialize: (state) => ({
        auth: {
          currentUser: state.auth.currentUser,
          authToken: state.auth.authToken,
          isAuthenticated: state.auth.isAuthenticated,
          isLoading: false,
          errorMessage: null,
        },
        preferences: state.preferences,
      }),
    }
  )
);

// Auth methods
export const useAppStore = useAppStore.extend((self) => ({
  login: async (email: string, password: string) => {
    try {
      self.set({ auth: {...self.auth, isLoading: true, errorMessage: null } });
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { user, token } = response.data;
      self.set((state) => ({
        auth: {
         ...state.auth,
          currentUser: user,
          authToken: token,
          isAuthenticated: true,
          isLoading: false,
          errorMessage: null,
        },
      }));
    } catch (error) {
      self.set((state) => ({
        auth: {
         ...state.auth,
          isAuthenticated: false,
          isLoading: false,
          errorMessage: 'Login failed',
        },
      }));
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      self.set({ auth: {...self.auth, isLoading: true, errorMessage: null } });
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register`,
        { email, password, full_name: name }
      );
      const { user, token } = response.data;
      self.set((state) => ({
        auth: {
         ...state.auth,
          currentUser: user,
          authToken: token,
          isAuthenticated: true,
          isLoading: false,
          errorMessage: null,
        },
      }));
    } catch (error) {
      self.set((state) => ({
        auth: {
         ...state.auth,
          errorMessage: 'Registration failed',
          isLoading: false,
        },
      }));
    }
  },

  logout: () => {
    self.set(() => ({
      auth: {
        currentUser: null,
        authToken: null,
        isAuthenticated: false,
        isLoading: false,
        errorMessage: null,
      },
    }));
  },

  checkAuth: async () => {
    const { authToken } = self.auth;
    if (!authToken) {
      self.set((state) => ({ auth: {...state.auth, isLoading: false } }));
      return;
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const { user } = response.data;
      self.set((state) => ({
        auth: {
         ...state.auth,
          currentUser: user,
          isAuthenticated: true,
          isLoading: false,
          errorMessage: null,
        },
      }));
    } catch (error) {
      self.set((state) => ({
        auth: {
         ...state.auth,
          currentUser: null,
          authToken: null,
          isAuthenticated: false,
          isLoading: false,
          errorMessage: 'Token invalid',
        },
      }));
    }
  },

  // Preferences methods
  setPreferences: (prefs: Preferences) => {
    self.set({ preferences: prefs });
  },

  // Notifications methods
  addNotification: (notification: Notification) => {
    self.set((state) => ({
      notifications: {
        notifications: [...state.notifications.notifications, notification],
        unreadCount: state.notifications.unreadCount + 1,
      },
    }));
  },

  markNotificationRead: (id: string) => {
    self.set((state) => ({
      notifications: {
        notifications: state.notifications.notifications.map((n) =>
          n.id === id? {...n, read: true } : n
        ),
        unreadCount: state.notifications.notifications.filter((n) =>!n.read).length,
      },
    }));
  },
}));

// Export types for component usage
export type {
  User,
  AuthState,
  Preferences,
  Notification,
  NotificationsState,
  AppState,
};
