// UV_Onboarding_Quiz.tsx
import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_Onboarding_Quiz: React.FC = () => {
  // Local state for quiz answers
  const [transportScore, setTransportScore] = useState(0);
  const [dietScore, setDietScore] = useState(0);
  const [energyScore, setEnergyScore] = useState(0);
  const [wasteScore, setWasteScore] = useState(0);
  
  // Progress tracking
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const totalQuestions = 4;
  
  // Access current user from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Temporary storage of quiz results
    const quizResults = {
      transport: transportScore,
      diet: dietScore,
      energy: energyScore,
      waste: wasteScore
    };
    
    // In a real implementation, this would update the user profile
    // via PATCH /api/users/{user_id} with the quiz results
    
    // Navigate to next step
    window.location.href = '/onboarding/tutorial';
  };

  // Update scores and track completion
  const handleTransportChange = (value: number) => {
    setTransportScore(value);
    if (value > 0) setCompletedQuestions(prev => prev + 1);
  };

  const handleDietChange = (value: number) => {
    setDietScore(value);
    if (value > 0) setCompletedQuestions(prev => prev + 1);
  };

  const handleEnergyChange = (value: number) => {
    setEnergyScore(value);
    if (value > 0) setCompletedQuestions(prev => prev + 1);
  };

  const handleWasteChange = (value: number) => {
    setWasteScore(value);
    if (value > 0) setCompletedQuestions(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Carbon Footprint Quiz
            </h2>
            
            {/* Progress Bar */}
            <div className="relative pb-4 mb-8">
              <div className="overflow-hidden bg-gray-200 rounded-full h-2">
                <div 
                  className={`w-${(completedQuestions/totalQuestions)*100}% bg-blue-600 rounded-full h-2 transition-all duration-300`}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {completedQuestions}/{totalQuestions} questions completed
              </p>
            </div>
            
            {/* Transport Question */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800">
                Transport
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  How do you typically commute?
                </label>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleTransportChange(5)}
                    className="group flex-1 p-4 border border-gray-300 rounded-lg hover:z-10 transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium">Car</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleTransportChange(3)}
                    className="group flex-1 p-4 border border-gray-300 rounded-lg hover:z-10 transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium">Public Transit</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleTransportChange(1)}
                    className="group flex-1 p-4 border border-gray-300 rounded-lg hover:z-10 transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium">Bike/Walk</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Diet Question */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800">
                Diet
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  How often do you eat meat?
                </label>
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="diet" 
                      value="daily"
                      onChange={() => handleDietChange(8)}
                      className="mr-2 appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Daily</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="diet" 
                      value="occasionally"
                      onChange={() => handleDietChange(4)}
                      className="mr-2 appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Occasionally</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="diet" 
                      value="rarely"
                      onChange={() => handleDietChange(2)}
                      className="mr-2 appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Rarely</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Energy Question */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800">
                Energy
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  What type of energy do you use?
                </label>
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => e.target.checked? handleEnergyChange(6) : handleEnergyChange(0)}
                      className="mr-2 appearance-checkbox h-4 w-4 border border-gray-300 rounded bg-white checked:bg-blue-500 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Renewable Energy</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => e.target.checked? handleEnergyChange(3) : handleEnergyChange(0)}
                      className="mr-2 appearance-checkbox h-4 w-4 border border-gray-300 rounded bg-white checked:bg-blue-500 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Energy Efficient Appliances</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Waste Question */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Waste
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  How do you handle waste?
                </label>
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="waste" 
                      value="recycle"
                      onChange={() => handleWasteChange(5)}
                      className="mr-2 appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Recycle Regularly</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="waste" 
                      value="compost"
                      onChange={() => handleWasteChange(3)}
                      className="mr-2 appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Compost Organic Waste</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="waste" 
                      value="reduce"
                      onChange={() => handleWasteChange(2)}
                      className="mr-2 appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Reduce Packaging</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                form="quiz-form"
                disabled={completedQuestions < totalQuestions}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium text-sm 
                  transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                  focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completedQuestions < totalQuestions? 'Complete Quiz' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UV_Onboarding_Quiz;