import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_SignUp: React.FC = () => {
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileImageURL, setProfileImageURL] = useState('');
  
  // Auth store access
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const errorMessage = useAppStore(state => state.authentication_state.error_message);
  const clearAuthError = useAppStore(state => state.clear_auth_error);
  const registerUser = useAppStore(state => state.register_user);
  
  // Form validation state
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    profileImageURL: '',
  });

  // Handle input changes with error clearing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearAuthError();
    
    // Simple client-side validation
    let error = '';
    switch(name) {
      case 'username':
        if (value.length < 1) error = 'Username is required';
        else if (value.length > 50) error = 'Username must be 50 characters or less';
        break;
      case 'email':
        if (value.length < 1) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (value.length < 8) error = 'Password must be at least 8 characters';
        break;
      case 'fullName':
        if (value.length > 100) error = 'Full name must be 100 characters or less';
        break;
      case 'profileImageURL':
        if (value &&!/^https?:\/\//.test(value)) error = 'Invalid image URL';
        break;
    }
    
    setFieldErrors(prev => ({...prev, [name]: error }));
    
    // Update state
    switch(name) {
      case 'username': setUsername(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'fullName': setFullName(value); break;
      case 'profileImageURL': setProfileImageURL(value); break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    // Final validation
    const errors = {};
    let isValid = true;
    
    if (!username || username.length < 1 || username.length > 50) {
      errors.username = 'Username must be 1-50 characters';
      isValid = false;
    }
    
    if (!email ||!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Valid email required';
      isValid = false;
    }
    
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    if (fullName && fullName.length > 100) {
      errors.fullName = 'Full name must be 100 characters or less';
      isValid = false;
    }
    
    if (profileImageURL &&!/^https?:\/\//.test(profileImageURL)) {
      errors.profileImageURL = 'Valid image URL required';
      isValid = false;
    }
    
    setFieldErrors(errors);
    
    if (!isValid) return;

    try {
      await registerUser(email, password, fullName, profileImageURL);
      // Redirect to onboarding quiz on success
      window.location.href = '/onboarding/quiz';
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Create Your Account
            </h2>
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={handleInputChange}
                placeholder="Your username"
                className={`relative block w-full px-4 py-2 border ${
                  fieldErrors.username? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {fieldErrors.username && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={`relative block w-full px-4 py-2 border ${
                  fieldErrors.email? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handleInputChange}
                placeholder="•••••••"
                className={`relative block w-full px-4 py-2 border ${
                  fieldErrors.password? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>
            
            {/* Full Name (Optional) */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name (Optional)
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`relative block w-full px-4 py-2 border ${
                  fieldErrors.fullName? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {fieldErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
              )}
            </div>
            
            {/* Profile Image URL (Optional) */}
            <div className="space-y-2">
              <label htmlFor="profileImageURL" className="block text-sm font-medium text-gray-700">
                Profile Image URL (Optional)
              </label>
              <input
                id="profileImageURL"
                name="profileImageURL"
                type="text"
                value={profileImageURL}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className={`relative block w-full px-4 py-2 border ${
                  fieldErrors.profileImageURL? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {fieldErrors.profileImageURL && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.profileImageURL}</p>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
            
            {/* Social Login */}
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-600">
                Or continue with:
              </div>
              <div className="mt-2 space-x-4">
                <button
                  disabled
                  className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <img src="/google-icon.svg" alt="Google" className="h-6 w-6" />
                </button>
                <button
                  disabled
                  className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <img src="/apple-icon.svg" alt="Apple" className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Social login services currently unavailable
              </p>
            </div>
            
            {/* Login Link */}
            <div className="text-sm text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_SignUp;