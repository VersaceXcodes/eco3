import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { PostEntity } from '@/types'; // Hypothetical type definition

const UV_Learn_Hub: React.FC = () => {
  // Zustand state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const preferences = useAppStore(state => state.preferences);
  const socket = useAppStore(state => state.socket);

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    category: null,
    type: null,
    page: 1
  });
  const [savedContent, setSavedContent] = useState(new Set<string>());

  // Query for educational content
  const {
    data,
    error,
    isLoading,
    isFetching,
    isPreviousData,
    pageParam,
    pageCount,
    nextPagePageParam,
    canFetchNextPage,
    refetch,
  } = useQuery({
    queryKey: ['educational-content', filters],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${'/api/posts'}?` +
        new URLSearchParams({
          category: filters.category || '',
          type: filters.type || '',
          limit: '10',
          offset: (filters.page - 1) * 10,
          sort_by: 'created_at',
          sort_order: 'desc'
        })
      );

      if (!response.ok) throw new Error('Network response was not ok');

      const json = await response.json();
      
      return json.map(post => ({
       ...post,
        created_at: new Date(post.created_at),
        is_saved: savedContent.has(post.id)
      }));
    },
    staleTime: 60000 * 5, // 5 minutes
    keepPreviousData: true,
    retry: 1,
    enabled:!!currentUser,
    select: (data) => data.map(post => ({
     ...post,
      created_at: new Date(post.created_at),
      is_saved: savedContent.has(post.id)
    }))
  });

  // Handle save functionality
  const toggleSave = (contentId: string) => {
    setSavedContent(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });
  };

  // Handle filter changes
  const applyFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
     ...prev,
     ...newFilters,
      page: 1
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading educational content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="bg-red-100 border border-red-200 p-6 rounded-lg max-w-md mx-auto">
            <h2 className="text-lg font-bold text-red-800">Error loading content</h2>
            <p className="mt-2 text-sm text-red-700">{error.message}</p>
            <button
              onClick={refetch}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Learn Hub</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md ${viewMode === 'grid'? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md ${viewMode === 'list'? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  List
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="space-x-4 flex flex-wrap mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  onChange={(e) => applyFilters({ category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="transport">Transport</option>
                  <option value="energy">Energy</option>
                  <option value="diet">Diet</option>
                  <option value="waste">Waste</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  onChange={(e) => applyFilters({ type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="infographic">Infographic</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
          {data?.pages.flatMap(page => page).length === 0? (
            <div className="text-center px-6">
              <div className="bg-yellow-100 border border-yellow-200 p-6 rounded-lg max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-yellow-800">No content found</h2>
                <p className="mt-2 text-sm text-yellow-700">
                  Try adjusting your filters or check back later for new content.
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'grid'? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'gap-y-10'}`}>
              {data?.pages.flatMap(page => page).map(content => (
                <div
                  key={content.id}
                  className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-200 ${
                    viewMode === 'grid'? 'hover:shadow-xl hover:scale-105' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  {content.image_url && (
                    <div className="relative overflow-hidden rounded-lg aspect-video mb-4">
                      <img 
                        src={content.image_url} 
                        alt="Content thumbnail"
                        className="object-cover object-center w-full h-full"
                      />
                      {content.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                            <path d="M15.565 6.95a.545.545 0 0 0-.12.53l-1.89 3.25a.546.546 0 0 1-.63.05l-3 17.48a.54.54 0 0 1-.34 0l-3-17.48a.546.546 0 0 1.05-.63l1.89-3.25a.545.545 0 0 0.53-.12l5.7 2.7a.55.55 0 0 0.08-.27.55.55 0 0 0-.08-.28z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900">
                    <Link to={`/learn/article/${content.id}`} className="hover:underline">
                      {content.title}
                    </Link>
                  </h3>

                  {/* Type Badge */}
                  <div className={`mt-2 inline-flex items-center rounded-full ${content.type === 'article'? 'bg-blue-100 text-blue-800' : content.type === 'video'? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    <p className="text-sm font-semibold px-3 py-0.5">
                      {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                    </p>
                  </div>

                  {/* Content Snippet */}
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                    {content.content? content.content.substring(0, 150) + '...' : 'No description available'}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <time dateTime={content.created_at.toISOString()} className="text-sm text-gray-500">
                        {new Date(content.created_at).toLocaleDateString()}
                      </time>
                      <span className="text-sm text-gray-500">• {content.type}</span>
                    </div>
                    
                    {/* Save Button */}
                    <button
                      onClick={() => toggleSave(content.id)}
                      className={`p-2 rounded-full transition-colors ${
                        savedContent.has(content.id) 
                         ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      {savedContent.has(content.id)? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.55C10.4 20.24 4 15.33 4 9.5S10.4 0.08 12 0c1.6 0.73 3.15 1.55 4.15 2.55l1.55 1.55c.6 0.6 1.15 1.34 1.55 2.1C18.5 5.01 23 8.44 23 12.5 23 15.58 20.33 19 16.67 19c-.55 0-1.1-.02-1.65-.06L12 21.35V21H12v.35z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.5 3v10.87a.75.75 0 0 0 1.5 0v-10.87c-.02-.38-.09-.74-.19-1.1C15.55 1.83 6.02 1.83 5.5 1.83 4.54 1.83 3.7 2.55 3.18 3.5l1.4 4.06c.07.23.37.4.7.4h8.79c.32 0.59-.12.7-.4l1.4-4.06C15.46 2.55 16.46 1.83 16.5 1.83z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {canFetchNextPage && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => refetch({ pageParam: nextPagePageParam })}
                className="bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-md text-sm font-medium text-gray-700 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default UV_Learn_Hub;