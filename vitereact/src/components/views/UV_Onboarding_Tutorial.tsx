import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_Onboarding_Tutorial: React.FC = () => {
  const navigate = useNavigate();
  
  // Global state access (individual selectors)
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const logoutUser = useAppStore(state => state.logout_user);
  
  // Local state for tutorial
  const [currentStep, setCurrentStep] = useState(0);
  const [completionStatus, setCompletionStatus] = useState(false);

  // Tutorial steps configuration
  const tutorialSteps = [
    {
      title: 'Welcome to eco3 Dashboard',
      description: 'Your central hub for tracking environmental impact and progress',
      highlightElement: 'dashboard',
      image: 'dashboard-icon',
      cta: 'Next: Learn how to track your actions'
    },
    {
      title: 'Track Your Eco Actions',
      description: 'Log daily activities to measure your carbon footprint reduction',
      highlightElement: 'tracker',
      image: 'tracker-icon',
      cta: 'Next: Explore community challenges'
    },
    {
      title: 'Join the Eco Community',
      description: 'Participate in challenges and share progress with like-minded users',
      highlightElement: 'community',
      image: 'community-icon',
      cta: 'Finish Tutorial'
    }
  ];

  // Handle completion status
  useEffect(() => {
    if (completionStatus) {
      navigate('/dashboard');
    }
  }, [completionStatus, navigate]);

  // Handle skip tutorial
  const handleSkip = () => {
    setCompletionStatus(true);
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompletionStatus(true);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Final step completion
  const handleComplete = () => {
    setCompletionStatus(true);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                eco3 Onboarding
              </h1>
              <button
                onClick={handleSkip}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Skip Tutorial
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              {/* Step Content */}
              <div className="p-8">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-2xl">{tutorialSteps[currentStep].title}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-800">
                    {tutorialSteps[currentStep].title}
                  </h2>
                  <p className="mt-2 text-gray-600 text-center">
                    {tutorialSteps[currentStep].description}
                  </p>
                </div>
                
                {/* Step Navigation */}
                <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                  >
                    Back
                  </button>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSkip}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Skip
                    </button>
                    
                    {currentStep < tutorialSteps.length - 1? (
                      <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleComplete}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all"
                      >
                        Finish Tutorial
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white shadow-inner border-t border-gray-200 py-4">
          <div className="max-w-2xl mx-auto px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} eco3. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
};

export default UV_Onboarding_Tutorial;