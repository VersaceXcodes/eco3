import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UV_Settings: React.FC = () => {
  // Get current user and preferences from Zustand store
  const currentUser = useAppStore(state => state.auth.currentUser);
  const authToken = useAppStore(state => state.auth.authToken);
  const preferences = useAppStore(state => state.preferences);
  const setPreferences = useAppStore(state => state.setPreferences);

  // Local form state
  const [theme, setTheme] = useState(preferences.theme || 'light');
  const [unitSystem, setUnitSystem] = useState(preferences.unitSystem || 'metric');
  const [dataExportFormat, setDataExportFormat] = useState(preferences.dataExportFormat || 'csv');
  const [optOutDataSharing, setOptOutDataSharing] = useState(preferences.optOutDataSharing || false);
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mutation for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async () => {
      const updateData = {
        full_name: currentUser?.full_name,
        profile_image_url: currentUser?.profile_image_url,
        preferences: {
          theme,
          unitSystem,
          dataExportFormat: dataExportFormat,
          optOutDataSharing: optOutDataSharing
        }
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser?.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    },
    onSuccess: () => {
      setPreferences({
        theme,
        unitSystem,
        dataExportFormat,
        optOutDataSharing
      });
      setSuccess('Settings updated successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to update settings');
      setSuccess(null);
    }
  });

  // Mutation for deleting account
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser?.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: { password: deletePassword }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Clear auth state
      useAppStore.set({
        auth: {
          currentUser: null,
          authToken: null,
          isAuthenticated: false,
          isLoading: false,
          errorMessage: null
        }
      });
      window.location.href = '/';
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to delete account');
      setSuccess(null);
    }
  });

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-10">Settings</h1>
          
          {/* Preferences Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Theme */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">Theme</h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === 'light'}
                      onChange={() => setTheme('light')}
                      className="mr-2 focus:ring-blue-500"
                    />
                    Light
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={() => setTheme('dark')}
                      className="mr-2 focus:ring-blue-500"
                    />
                    Dark
                  </label>
                </div>
              </div>
              
              {/* Unit System */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">Unit System</h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="unitSystem"
                      value="metric"
                      checked={unitSystem === 'metric'}
                      onChange={() => setUnitSystem('metric')}
                      className="mr-2 focus:ring-blue-500"
                    />
                    Metric
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="unitSystem"
                      value="imperial"
                      checked={unitSystem === 'imperial'}
                      onChange={() => setUnitSystem('imperial')}
                      className="mr-2 focus:ring-blue-500"
                    />
                    Imperial
                  </label>
                </div>
              </div>
            </div>
            
            {/* Data Export Format */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Data Export Format</h3>
              <select
                value={dataExportFormat}
                onChange={(e) => setDataExportFormat(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
          
          {/* Privacy Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Privacy</h2>
            
            <div className="space-y-6">
              {/* Opt Out Data Sharing */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-700">Opt Out of Data Sharing</h4>
                    <p className="text-gray-500 mt-1">Control whether your data is shared with third parties</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={optOutDataSharing}
                      onChange={(e) => setOptOutDataSharing(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer transition-colors duration-200">
                      {optOutDataSharing && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full absolute left-0 top-0.5 bg-blue-500 transition-transform duration-200"></div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Delete Account */}
              <div>
                <h4 className="text-lg font-medium text-red-600 mb-3">Delete Account</h4>
                <p className="text-gray-600 mb-4">Permanently delete your account and all associated data</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-1/2">
                    <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Password Confirmation
                    </label>
                    <input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isMutating}
                      className="bg-red-600 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteAccountMutation.isMutating? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </span>
                      ) : (
                        'Delete Account'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Notifications</h2>
            
            <div className="space-y-6">
              {/* Notification Types */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-800">Daily Logging Reminders</h5>
                      <p className="text-gray-500 text-sm">Receive reminders to log your eco-actions</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer transition-colors duration-200">
                        {/* Toggle state logic would be implemented here */}
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-800">Challenge Updates</h5>
                      <p className="text-gray-500 text-sm">Get notified about challenge milestones and rankings</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only" />
                      <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer transition-colors duration-200">
                        {/* Toggle state logic would be implemented here */}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Notification Schedule */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-3">Notification Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notificationTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Reminder Time
                    </label>
                    <input
                      type="time"
                      id="notificationTime"
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="notificationDays" className="block text-sm font-medium text-gray-700 mb-2">
                      Days of the Week
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-1" />
                        Monday
                      </label>
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-1" />
                        Tuesday
                      </label>
                      {/* Additional days would be implemented here */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div className="fixed bottom-0 left-0 w-full bg-red-50 p-4 text-red-700 border-t border-red-200">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="fixed bottom-0 left-0 w-full bg-green-50 p-4 text-green-700 border-t border-green-200">
          <p>{success}</p>
        </div>
      )}
    </>
  );
};

export default UV_Settings;