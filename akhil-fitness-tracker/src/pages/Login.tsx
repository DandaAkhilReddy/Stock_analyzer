import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Dumbbell,
  Target,
  TrendingUp,
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Body Analysis',
      description: 'Advanced body composition tracking with AI'
    },
    {
      icon: Target,
      title: 'Calorie Tracking',
      description: 'Smart calorie deficit calculations'
    },
    {
      icon: TrendingUp,
      title: 'Progress Monitoring',
      description: 'Visual progress tracking with photos'
    },
    {
      icon: Sparkles,
      title: 'Indian Recipes',
      description: 'Vegetarian meal plans tailored for you'
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 shadow-2xl">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black gradient-text mb-2">
              Welcome to ReddyFit
            </h1>
            <p className="text-gray-600 text-lg">
              Your AI-Powered Fitness Transformation
            </p>
          </div>

          {/* Sign In Box */}
          <div className="glass-card p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Get Started
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in to track your fitness journey
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 rounded-xl px-6 py-3 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary-500"></div>
                  <span className="text-gray-700 font-semibold">Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-semibold">Continue with Google</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              <strong>Demo Mode:</strong> Sign in with any Google account to explore all features
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="flex-1 bg-gradient-to-br from-primary-50 to-secondary-50 p-12 hidden lg:flex items-center justify-center">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Transform Your Body with AI
          </h2>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 200}ms`, animationFillMode: 'forwards' }}
              >
                <div className="p-3 rounded-xl bg-white shadow-lg">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Your Goal</p>
                <p className="text-2xl font-bold text-gray-800">69.9kg</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Target Date</p>
                <p className="text-2xl font-bold text-primary-600">Jan 2026</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">AI-Powered tracking to reach your goals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}