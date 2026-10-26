import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { api } from '../lib/api';
import Navbar from '../components/Navbar';
import VoiceCommand from '../components/VoiceCommand';
import Assistant from '../components/Assistant';

import {
  FileText,
  Sprout,
  TrendingUp,
  Cloud,
  MapPin,
  Ruler,
  Wheat,
  AlertCircle,
  Thermometer,
  Droplets
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { speak } = useVoice();

  const [liveWeather, setLiveWeather] = useState<{ temperature: number; humidity: number } | null>(null);

  // Real temperature and humidity for the farmer's own district
  useEffect(() => {
    const state = user?.location?.state;
    const district = user?.location?.district;
    if (!state) return;
    let cancelled = false;

    const path = `/weather/${encodeURIComponent(state)}${district ? `/${encodeURIComponent(district)}` : ''}`;
    api
      .get<{ current: { temperature: number; humidity: number } }>(path)
      .then((res) => {
        if (!cancelled && res.data) setLiveWeather(res.data.current);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = [
    { icon: Thermometer, label: 'Temperature', value: liveWeather ? `${Math.round(liveWeather.temperature)}°C` : '--', color: 'text-orange-600' },
    { icon: Droplets, label: 'Humidity', value: liveWeather ? `${Math.round(liveWeather.humidity)}%` : '--', color: 'text-blue-600' },
    { icon: TrendingUp, label: 'Crop Price', value: '₹2,850/qtl', color: 'text-green-600' },
    { icon: AlertCircle, label: 'Alerts', value: '2 New', color: 'text-red-600' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Government Policies', path: '/policies', color: 'bg-blue-100 text-blue-600' },
    { icon: Sprout, label: 'Cultivation Tips', path: '/cultivation', color: 'bg-green-100 text-green-600' },
    { icon: TrendingUp, label: 'Price Predictor', path: '/price-predictor', color: 'bg-purple-100 text-purple-600' },
    { icon: Cloud, label: 'Weather Forecast', path: '/weather', color: 'bg-orange-100 text-orange-600' },
  ];

  const handleCardClick = (action: string) => {
    speak(`${action} section पर जा रहे हैं`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <VoiceCommand />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's your agricultural overview for today</p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Farm Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">
                  {user?.location ? `${user.location.district}, ${user.location.state}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Ruler className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Farm Size</p>
                <p className="font-medium text-gray-900">{user?.farmDetails?.size}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Wheat className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Primary Crop</p>
                <p className="font-medium text-gray-900">{user?.farmDetails?.primaryCrop}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.a
                  key={index}
                  href={action.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(action.label)}
                  className="flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors cursor-pointer group"
                >
                  <div className={`p-3 rounded-full ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-900 text-center">{action.label}</p>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* AI Assistant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8"
        >
          <Assistant />
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Alerts</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Weather Alert</p>
                <p className="text-xs text-gray-600">Heavy rainfall expected in next 48 hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Price Update</p>
                <p className="text-xs text-gray-600">Wheat prices increased by 5% this week</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;