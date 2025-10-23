import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_ActionSuggestions: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const addNotification = useAppStore(state => state.add_notification);

  const fetchSuggestions = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/action_suggestions`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { user_id: currentUser?.id },
      }
    );
    return response.data;
  };

  const [markComplete] = useMutation({
    mutationFn: (suggestionId: string) => 
      axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/action_suggestions/${suggestionId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      ),
    onSuccess: () => {
      queryCache.refetch(['suggestions', currentUser?.id]);
      addNotification({
        id: `complete-${Date.now()}`,
        message: 'Tip completed successfully!',
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
  });

  const query = useQuery({
    queryKey: ['suggestions', currentUser?.id],
    queryFn: fetchSuggestions,
    enabled:!!currentUser?.id,
    staleTime: 300000, // 5 minutes
  });

  if (query.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading personalized tips...</h2>
          <div className="animate-spin h-8 w-8 text-blue-500 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to load suggestions</h2>
          <p className="text-gray-700 mb-4">{query.error instanceof Error? query.error.message : 'Unknown error'}</p>
          <button
            onClick={query.refetch}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Your Eco-Tips</h1>
        
        {query.data?.length === 0? (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">No personalized tips available</h2>
            <p className="text-gray-700">Check back later or explore other sections for more suggestions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {query.data.map((suggestion) => (
              <div key={suggestion.id} className="bg-white shadow-lg border border-gray-100 rounded-xl p-6 transition-all hover:shadow-xl hover:scale-102">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">{suggestion.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{suggestion.description}</p>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Impact Estimate:</span>
                      <span className="text-sm text-gray-600">{suggestion.impact_estimate || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => markComplete.mutate(suggestion.id)}
                    className={`group relative w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-xl transition-colors duration-200 ${
                      markComplete.isPending? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={markComplete.isPending}
                  >
                    {markComplete.isPending? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Marking complete...
                      </span>
                    ) : (
                      'Complete Tip'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UV_ActionSuggestions;