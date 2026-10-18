import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { 
  Home, 
  FileText, 
  Sprout, 
  TrendingUp, 
  Cloud, 
  LogOut, 
  Mic, 
  MicOff,
  Languages,
  Eye
} from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isListening, startListening, stopListening, language, setLanguage } = useVoice();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/policies', icon: FileText, label: 'Policies' },
    { path: '/cultivation', icon: Sprout, label: 'Cultivation' },
    { path: '/price-predictor', icon: TrendingUp, label: 'Price Predictor' },
    { path: '/weather', icon: Cloud, label: 'Weather' },
  ];

  const languages = [
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'en-IN', name: 'English' },
    { code: 'pa-IN', name: 'Punjabi' },
    { code: 'gu-IN', name: 'Gujarati' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'ml-IN', name: 'Malayalam' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-green-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <Sprout className="h-3 w-3 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
              </div>
              <span className="text-xl font-bold text-green-800">AgroVision</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            {/* Voice Control */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full ${
                isListening 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;