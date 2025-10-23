import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import { z } from 'zod';

// Define local state types
type ActiveModal = 'quiz' | 'tutorial' | 'confirm' | 'share' | null;
type QuizData = {
  transport: number;
  diet: number;
  energy: number;
  waste: number;
};

// Mock Zod schema for quiz data (since actual schema is missing)
const QuizDataSchema = z.object({
  transport: z.number(),
  diet: z.number(),
  energy: z.number(),
  waste: z.number(),
});

const GV_Modals: React.FC = () => {
  // Zustand store access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const setAuthError = useAppStore(state => state.set_auth_error);
  
  // Local state management
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [quizData, setQuizData] = useState<QuizData>({
    transport: 0,
    diet: 0,
    energy: 0,
    waste: 0,
  });
  const [tutorialProgress, setTutorialProgress] = useState<number>(0);
  const [confirmationData, setConfirmationData] = useState({
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [shareData, setShareData] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });

  // Modal handlers
  const handleQuizChange = (category: keyof QuizData, value: number) => {
    setQuizData(prev => ({...prev, [category]: value }));
  };

  const handleQuizSubmit = async () => {
    try {
      // Validate quiz data
      const validated = QuizDataSchema.parse(quizData);
      
      // Mock API call (actual endpoint missing)
      console.log('Submitting quiz data:', validated);
      
      // Example conversion (as per dataMapper in spec)
      const baselineData = {
        transport: validated.transport * 0.5,
        diet: validated.diet * 0.8,
        energy: validated.energy,
        waste: validated.waste * 1.2,
      };
      
      // In real implementation, would call:
      // await axios.post(`/api/users/${currentUser?.id}/carbon_baseline`, baselineData)
      
      // Close modal and update tutorial progress
      setActiveModal(null);
      setTutorialProgress(prev => Math.min(100, prev + 40));
    } catch (error) {
      setAuthError('Error submitting quiz');
    }
  };

  const handleTutorialProgress = (progress: number) => {
    setTutorialProgress(Math.min(100, progress));
  };

  const handleConfirmAction = async () => {
    try {
      await confirmationData.onConfirm();
      setActiveModal(null);
    } catch (error) {
      setAuthError('Action confirmation failed');
    }
  };

  const handleShare = (platform: string) => {
    console.log(`Sharing to ${platform}:`, shareData);
    setActiveModal(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activeModal && e.key === 'Escape') {
      setActiveModal(null);
    }
  };

  React.useEffect(() => {
    if (activeModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Set focus to modal root
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  return (
    <>
      {/* Quiz Modal */}
      {activeModal === 'quiz' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl w-11/12 sm:w-4/5 md:w-3/4 lg:w-1/2 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Carbon Footprint Quiz</h2>
            
            <div className="space-y-8">
              {/* Transport Slider */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Transport</h3>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={quizData.transport} 
                  onChange={(e) => handleQuizChange('transport', Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">{quizData.transport} km</p>
              </div>
              
              {/* Diet Slider */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Diet</h3>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={quizData.diet} 
                  onChange={(e) => handleQuizChange('diet', Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">{quizData.diet} servings</p>
              </div>
              
              {/* Energy Slider */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Energy</h3>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={quizData.energy} 
                  onChange={(e) => handleQuizChange('energy', Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">{quizData.energy} kWh</p>
              </div>
              
              {/* Waste Slider */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Waste</h3>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={quizData.waste} 
                  onChange={(e) => handleQuizChange('waste', Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">{quizData.waste} kg</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleQuizSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {activeModal === 'tutorial' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl w-11/12 sm:w-4/5 md:w-3/4 lg:w-1/2 p-6">
            <div className="flex items-start mb-6">
              <div className="w-full">
                <div className="progress bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="progress-bar bg-blue-500 rounded-full h-2.5"
                    style={{ width: `${tutorialProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{tutorialProgress}% Complete</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to eco3</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Track your carbon footprint across four main categories: Transport, Energy, 
                Diet, and Waste. Use the tracker to log daily activities and see your impact.
              </p>
              
              <div className="flex justify-between">
                <button
                  onClick={() => handleTutorialProgress(tutorialProgress + 20)}
                  className="px-4 py-2 bg-gray-200 rounded-md text-gray-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleTutorialProgress(tutorialProgress + 20)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {activeModal === 'confirm' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl w-11/12 sm:w-4/5 md:w-3/4 lg:w-1/2 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Action</h2>
            
            <p className="text-gray-700 mb-6">{confirmationData.message}</p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={confirmationData.onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Sharing Modal */}
      {activeModal === 'share' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl w-11/12 sm:w-4/5 md:w-3/4 lg:w-1/2 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Share Your Progress</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">{shareData.title}</h3>
                <p className="text-gray-600">{shareData.content}</p>
                {shareData.imageUrl && (
                  <img 
                    src={shareData.imageUrl} 
                    alt="Share preview" 
                    className="mt-4 rounded-lg"
                  />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleShare('instagram')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Instagram
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500"
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      })}
    </>
  );
};

export default GV_Modals;