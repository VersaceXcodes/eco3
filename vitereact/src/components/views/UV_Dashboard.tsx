import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Define types for API response
interface ImpactSummary {
  co2_saved: number;
  water_saved: number;
  tree_equivalents: number;
  trend_dates: string[];
  trend_values: number[];
}

// Component
const UV_Dashboard: React.FC = () => {
  // Zustand auth state access (CRITICAL: individual selectors)
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isLoadingAuth = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const logoutUser = useAppStore(state => state.logout_user);

  // URL parameters
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const timeframe = searchParams.get('timeframe') || 'weekly';
  const category = searchParams.get('category') || '';

  // State for filters
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [currentCategory, setCurrentCategory] = useState(category);

  // Query for dashboard data
  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-data', currentTimeframe, currentCategory],
    queryFn: async () => {
      try {
        const response = await axios.get<ImpactSummary>(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user_impact_summary`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              timeframe: currentTimeframe,
              category: currentCategory || undefined
            }
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    // Query options
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Sync URL parameters with state
  useEffect(() => {
    setCurrentTimeframe(timeframe);
    setCurrentCategory(category);
  }, [location.search]);

  // Handle filter changes
  const handleTimeframeChange = (newTimeframe: string) => {
    const urlParams = new URLSearchParams();
    urlParams.set('timeframe', newTimeframe);
    if (currentCategory) urlParams.set('category', currentCategory);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    setCurrentTimeframe(newTimeframe);
    refetch();
  };

  const handleCategoryChange = (newCategory: string) => {
    const urlParams = new URLSearchParams();
    urlParams.set('timeframe', currentTimeframe);
    if (newCategory) urlParams.set('category', newCategory);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    setCurrentCategory(newCategory);
    refetch();
  };

  // Handle logout
  const handleLogout = () => {
    logoutUser();
  };

  // Render loading state
  if (isLoading || isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-red-500 mb-4">{error?.message || 'Failed to fetch dashboard data'}</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!error && data && (data.trend_values.length === 0 ||!data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">No Data Available</h2>
          <p className="text-gray-600 mb-6">It looks like you haven't logged any eco-actions yet.</p>
          <div className="space-y-4">
            <Link
              to="/tracker"
              className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors"
            >
              Start Logging Actions
            </Link>
            <Link
              to="/community"
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              Join Challenges
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 sm:pl-4">Impact Dashboard</h1>
            
            {/* User profile */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={currentUser?.profile_image_url || 'https://picsum.photos/200/300?random=1'}
                  alt={currentUser?.full_name || 'User Profile'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">CO₂ Saved</h3>
            <p className="text-3xl font-bold text-gray-700">{data?.co2_saved.toLocaleString()} kg</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Water Saved</h3>
            <p className="text-3xl font-bold text-gray-700">{data?.water_saved.toLocaleString()} liters</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tree Equivalents</h3>
            <p className="text-3xl font-bold text-gray-700">{data?.tree_equivalents.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Timeframe filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleTimeframeChange('daily')}
                  className={`px-4 py-2 rounded-md ${currentTimeframe === 'daily'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Daily
                </button>
                <button
                  onClick={() => handleTimeframeChange('weekly')}
                  className={`px-4 py-2 rounded-md ${currentTimeframe === 'weekly'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => handleTimeframeChange('yearly')}
                  className={`px-4 py-2 rounded-md ${currentTimeframe === 'yearly'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Yearly
                </button>
              </div>
            </div>
            
            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-4 py-2 rounded-md ${currentCategory === ''? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  All Categories
                </button>
                <button
                  onClick={() => handleCategoryChange('transport')}
                  className={`px-4 py-2 rounded-md ${currentCategory === 'transport'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Transport
                </button>
                <button
                  onClick={() => handleCategoryChange('energy')}
                  className={`px-4 py-2 rounded-md ${currentCategory === 'energy'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Energy
                </button>
                <button
                  onClick={() => handleCategoryChange('diet')}
                  className={`px-4 py-2 rounded-md ${currentCategory === 'diet'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Diet
                </button>
                <button
                  onClick={() => handleCategoryChange('waste')}
                  className={`px-4 py-2 rounded-md ${currentCategory === 'waste'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  Waste
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trend graph */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Impact Trend</h3>
          
          {/* Simple SVG graph for demonstration */}
          <svg width="100%" height="300" className="text-blue-500">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: '1' }} />
                <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: '1' }} />
              </linearGradient>
            </defs>
            
            {/* Graph background */}
            <rect width="100%" height="300" fill="#F3F4F6" rx="md" />
            
            {/* Data points */}
            {data?.trend_values && data.trend_dates && (
              <polyline
                points={data.trend_values
                 .map((value, index) => {
                    const x = (index / (data.trend_values.length - 1)) * 100 + '%';
                    const y = (1 - value / Math.max(...data.trend_values)) * 100 + '%';
                    return `${x} ${y}`;
                  })
                 .join(' ')}
                fill="none"
                stroke="url(#grad1)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* X-axis labels */}
            {data?.trend_dates && (
              <g>
                {data.trend_dates.map((date, index) => (
                  <text
                    key={index}
                    x={index === 0? '0%' : index === data.trend_dates.length - 1? '100%' : `${(index / (data.trend_dates.length - 1)) * 100}%`}
                    y="95%"
                    textAnchor={index === data.trend_dates.length - 1? 'end' : 'middle'}
                    className="text-sm text-gray-500"
                  >
                    {date}
                  </text>
                ))}
              </g>
            )}
            
            {/* Y-axis labels */}
            <g>
              {[100, 75, 50, 25, 0].map((value, index) => (
                <text
                  key={index}
                  x="-10%"
                  y={`${value}%`}
                  textAnchor="middle"
                  className="text-sm text-gray-500"
                >
                  {value}%
                </text>
              ))}
            </g>
          </svg>
          
          <p className="mt-4 text-gray-600 text-sm">
            {data?.trend_dates?.length > 0 
             ? `Last updated: ${new Date(data.trend_dates[data.trend_dates.length - 1]).toLocaleString()}`
              : 'No trend data available'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Action</h3>
            <p className="text-gray-600 mb-4">Record your eco-friendly activities</p>
            <Link
              to="/tracker"
              className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors w-full text-center"
            >
              Track Now
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Join Challenge</h3>
            <p className="text-gray-600 mb-4">Participate in community challenges</p>
            <Link
              to="/community"
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors w-full text-center"
            >
              Explore Challenges
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Learn More</h3>
            <p className="text-gray-600 mb-4">Access educational resources</p>
            <Link
              to="/learn"
              className="bg-yellow-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 transition-colors w-full text-center"
            >
              Visit Learning Hub
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UV_Dashboard;