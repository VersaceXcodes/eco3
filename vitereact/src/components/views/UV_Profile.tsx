import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { updateUserInputSchema } from '@/types/generated/zodSchemas';
import { Link } from 'react-router-dom';

const UV_Profile: React.FC = () => {
  // Zustand store access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const setAuthError = useAppStore(state => state.set_auth_error);
  const clearAuthError = useAppStore(state => state.clear_auth_error);

  // Form state
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [ecoGoals, setEcoGoals] = useState(currentUser?.eco_goals || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.profile_image_url || 'https://picsum.photos/200');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Delete account confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newData) => {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser?.id}`,
        newData,
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
      clearAuthError();
    },
    onError: (error) => {
      setAuthError('Failed to update profile');
      setFormError('Failed to update profile');
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser?.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Logout user after successful deletion
      useAppStore(state => state.logout_user)();
    },
    onError: (error) => {
      setAuthError('Failed to delete account');
      setFormError('Failed to delete account');
    }
  });

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFormError(null);
    
    try {
      // Validate using Zod schema
      const validatedData = updateUserInputSchema.parse({
        full_name: fullName,
        location: location,
        eco_goals: ecoGoals
      });
      
      // Update profile
      await updateProfileMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Validation failed');
      }
    }
  };

  // Delete account confirmation
  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
    setShowDeleteConfirmation(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white shadow-lg shadow-gray-200/5 rounded-xl overflow-hidden mb-10">
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <Link 
                  to="/settings"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit Settings
                </Link>
              </div>
              
              {/* Profile Picture */}
              <div className="mt-8 flex items-center justify-center">
                <img 
                  src={avatarUrl} 
                  alt="Profile picture"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white shadow-lg shadow-gray-200/5 rounded-xl p-6 mb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-lg font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-lg font-semibold text-gray-900 mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Eco Goals */}
              <div>
                <label htmlFor="ecoGoals" className="block text-lg font-semibold text-gray-900 mb-2">
                  Eco Goals
                </label>
                <textarea
                  id="ecoGoals"
                  value={ecoGoals}
                  onChange={(e) => setEcoGoals(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="group relative w-auto px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateProfileMutation.isLoading? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
            
            {formError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-6 w-6 flex-shrink-0 mr-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18.31 7.04a9.498 9.498 0 00-12.998 0M15 5a3 3 0 11-6 0 3 3 0 016 0zm-4.78 9.02a4.995 4.995 0 01-7.472.322l-.610 1.307A5.002 5.002 0 005.69 21h3.328a5.002 5.002 0 018.897-4.015.999 1 0 001.195-.01l.607-1.307a4.99 4.99 0 00-.816-2.722z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white shadow-lg shadow-gray-200/5 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Danger Zone</h2>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-700">Delete Account</h3>
                <p className="mt-2 text-red-700">
                  Once your account is deleted, all of your data will be permanently removed. 
                  This action cannot be undone.
                </p>
                
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 md:w-2/3 lg:w-1/2 p-6 shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <svg className="h-12 w-12 text-red-600 mb-4" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8V6a4 4 0 00-8 0v2m0 16v6m9-9v-3m-9 3v3m0 0v6m0-6V6m9 9v3m-9 3v-3m9-9v9" />
              </svg>
              
              <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
              <p className="mt-2 text-gray-700">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="text-gray-600 hover:text-gray-700 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isLoading}
                  className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteAccountMutation.isLoading? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
      )}
    </>
  );
};

export default UV_Profile;