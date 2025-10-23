import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  subtitleTracks: SubtitleTrack[];
  isSaved: boolean;
}

interface SubtitleTrack {
  language: string;
  url: string;
  label: string;
}

const UV_Learn_Video: React.FC = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  
  // Authentication check
  const currentUser = useAppStore(state => state.auth.currentUser);
  const isLoadingAuth = useAppStore(state => state.auth.isLoading);
  useEffect(() => {
    if (!currentUser &&!isLoadingAuth) {
      navigate('/login');
    }
  }, [currentUser, isLoadingAuth, navigate]);

  // Fetch video data
  const { data: videoData, isLoading, error, isFetching } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => 
      axios.get<VideoData>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/educational_content/${videoId}`
      ).then(res => res.data)
  });

  // Mutation to save the video
  const [saveVideo, { isLoading: isSaving }] = useMutation({
    mutationFn: (newData) => 
      axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/educational_content/${videoId}/save`,
        { userId: currentUser?.id }
      )
  });

  // Subtitle state
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Video element ref
  const videoRef = React.createRef<HTMLVideoElement>();

  // Handle subtitle display
  useEffect(() => {
    if (videoRef.current && videoData?.subtitleTracks) {
      const track = videoData.subtitleTracks.find(t => t.language === selectedLanguage);
      if (track) {
        videoRef.current.textTracks?.[0]?.mode = 'showing';
      }
    }
  }, [videoData, selectedLanguage, videoRef]);

  const handleSave = () => {
    saveVideo({ userId: currentUser?.id, videoId });
  };

  if (isLoading || isFetching) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="text-gray-600 text-xl">Loading video...</span>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white p-6 rounded-lg shadow-lg text-gray-700">
        <h2 className="text-2xl font-bold mb-4">Error Loading Video</h2>
        <p className="text-gray-600">{error.message}</p>
        <button 
          onClick={() => navigate('/learn')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          Back to Learning Hub
        </button>
      </div>
    </div>;
  }

  if (!videoData) {
    return <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white p-6 rounded-lg shadow-lg text-gray-700">
        <h2 className="text-2xl font-bold mb-4">Video Not Found</h2>
        <button 
          onClick={() => navigate('/learn')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          Back to Learning Hub
        </button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{videoData.title}</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                videoData.isSaved? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving? 'Saving...' : (videoData.isSaved? 'Saved' : 'Save for Later')}
            </button>
          </div>
          
          <div className="relative mb-8">
            <video
              ref={videoRef}
              className="w-full rounded-md"
              controls
              src={videoData.videoUrl}
              poster={videoData.posterUrl}
              width={640}
              height={360}
            >
              {videoData.subtitleTracks.map(track => (
                <track
                  key={track.language}
                  kind="subtitles"
                  src={track.url}
                  srclang={track.language}
                  label={track.label}
                  default={selectedLanguage === track.language}
                />
              ))}
            </video>
            
            <div className="absolute bottom-4 left-4 right-4 p-2 bg-black/70 text-white rounded-md">
              {currentSubtitle && <p className="text-sm">{currentSubtitle}</p>}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-xl font-semibold text-gray-800">Description</h2>
              <p className="mt-2 text-gray-600">{videoData.description}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-xl font-semibold text-gray-800">Subtitles</h2>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {videoData.subtitleTracks.map(track => (
                  <option key={track.language} value={track.language}>
                    {track.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => navigate('/learn')}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-9-9m0 0l-6 6m6-6l9-9m-9 9h24" stroke="currentColor" strokeWidth={2} />
            </svg>
            Back to Learning Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default UV_Learn_Video;