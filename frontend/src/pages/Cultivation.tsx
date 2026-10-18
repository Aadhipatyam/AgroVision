import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sprout, 
  Calendar, 
  Droplets, 
  Bug, 
  Zap, 
  Thermometer,
  Leaf,
  Target,
  Clock,
  Search,
  Bot
} from 'lucide-react';

const Cultivation: React.FC = () => {
  const { user } = useAuth();
  const [selectedSeason, setSelectedSeason] = useState('kharif');
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const crops = [
    { id: 'wheat', name: 'Wheat', icon: '🌾' },
    { id: 'rice', name: 'Rice', icon: '🍚' },
    { id: 'corn', name: 'Corn', icon: '🌽' },
    { id: 'cotton', name: 'Cotton', icon: '🌸' },
    { id: 'sugarcane', name: 'Sugarcane', icon: '🎋' },
    { id: 'soybean', name: 'Soybean', icon: '🫘' },
    { id: 'tomato', name: 'Tomato', icon: '🍅' },
    { id: 'potato', name: 'Potato', icon: '🥔' },
  ];

  const cultivationTips = {
    kharif: [
      {
        title: 'Soil Preparation',
        description: 'Prepare soil before monsoon. Ensure proper drainage and add organic matter.',
        icon: Sprout,
        color: 'bg-green-100 text-green-600',
        timing: 'May-June'
      },
      {
        title: 'Sowing Time',
        description: 'Sow seeds after first monsoon shower. Maintain proper spacing.',
        icon: Calendar,
        color: 'bg-blue-100 text-blue-600',
        timing: 'June-July'
      },
      {
        title: 'Water Management',
        description: 'Monitor water levels. Ensure drainage during heavy rains.',
        icon: Droplets,
        color: 'bg-cyan-100 text-cyan-600',
        timing: 'July-September'
      },
      {
        title: 'Pest Control',
        description: 'Regular monitoring for pests. Use integrated pest management.',
        icon: Bug,
        color: 'bg-red-100 text-red-600',
        timing: 'July-October'
      }
    ],
    rabi: [
      {
        title: 'Land Preparation',
        description: 'Prepare land after harvesting kharif crops. Add fertilizers.',
        icon: Sprout,
        color: 'bg-green-100 text-green-600',
        timing: 'October-November'
      },
      {
        title: 'Sowing',
        description: 'Sow wheat, barley, and other rabi crops. Maintain line sowing.',
        icon: Calendar,
        color: 'bg-blue-100 text-blue-600',
        timing: 'November-December'
      },
      {
        title: 'Irrigation',
        description: 'Provide adequate irrigation. Critical stages need proper water.',
        icon: Droplets,
        color: 'bg-cyan-100 text-cyan-600',
        timing: 'December-March'
      },
      {
        title: 'Harvesting',
        description: 'Harvest at proper maturity. Avoid losses due to weather.',
        icon: Target,
        color: 'bg-orange-100 text-orange-600',
        timing: 'March-April'
      }
    ]
  };

  const modernTechniques = [
    {
      title: 'Precision Agriculture',
      description: 'Use GPS and sensors for precise application of inputs',
      icon: Target,
      benefits: ['Reduced input costs', 'Higher yields', 'Environmental protection']
    },
    {
      title: 'Drip Irrigation',
      description: 'Efficient water management system for optimal crop growth',
      icon: Droplets,
      benefits: ['Water conservation', 'Reduced labor', 'Better crop quality']
    },
    {
      title: 'Integrated Pest Management',
      description: 'Sustainable approach to pest control using multiple methods',
      icon: Bug,
      benefits: ['Reduced pesticide use', 'Cost effective', 'Environmental friendly']
    },
    {
      title: 'Soil Health Monitoring',
      description: 'Regular testing and monitoring of soil nutrients',
      icon: Leaf,
      benefits: ['Optimal fertilizer use', 'Better soil health', 'Higher productivity']
    }
  ];

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate AI API call - In production, replace with actual OpenAI/Gemini API
      const response = await simulateAiResponse(aiQuery, selectedCrop);
      setAiResponse(response);
    } catch (error) {
      console.error('AI query failed:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAiResponse = async (query: string, crop: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI responses based on query keywords
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('disease') || lowerQuery.includes('pest')) {
      return `For ${crop} disease management:
      
1. **Common Diseases**: Leaf blight, root rot, and fungal infections are common in ${crop}.
2. **Prevention**: Use certified disease-free seeds, maintain proper spacing, and ensure good drainage.
3. **Treatment**: Apply appropriate fungicides like copper sulfate or neem-based solutions.
4. **Monitoring**: Check plants weekly for early symptoms like yellowing leaves or spots.
5. **Organic Solutions**: Use compost tea, beneficial bacteria, and crop rotation.

Would you like specific recommendations for any particular disease?`;
    }
    
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('nutrition')) {
      return `Fertilizer recommendations for ${crop}:
      
1. **Soil Testing**: Always start with soil pH and nutrient testing.
2. **NPK Ratio**: For ${crop}, use 120:60:40 kg/ha of N:P:K.
3. **Application Schedule**:
   - Basal: 50% N, 100% P, 100% K at sowing
   - Top dressing: 25% N at tillering, 25% N at flowering
4. **Organic Options**: Compost (5-10 tons/ha), vermicompost (3-5 tons/ha)
5. **Micronutrients**: Zinc and iron supplements if deficiency symptoms appear.

Adjust based on your soil test results!`;
    }
    
    if (lowerQuery.includes('irrigation') || lowerQuery.includes('water')) {
      return `Water management for ${crop}:
      
1. **Critical Stages**: Germination, tillering, flowering, and grain filling need adequate water.
2. **Irrigation Schedule**: 
   - Light irrigation every 3-4 days initially
   - Deep irrigation weekly during growth phase
   - Reduce frequency during maturity
3. **Water Requirements**: ${crop} needs 450-650mm water throughout the season.
4. **Efficient Methods**: Drip irrigation can save 30-50% water compared to flood irrigation.
5. **Monitoring**: Check soil moisture at 6-inch depth before irrigating.

Consider installing soil moisture sensors for precision irrigation!`;
    }
    
    if (lowerQuery.includes('yield') || lowerQuery.includes('production')) {
      return `Yield optimization strategies for ${crop}:
      
1. **Variety Selection**: Choose high-yielding, disease-resistant varieties suitable for your region.
2. **Plant Population**: Maintain optimal plant density - not too crowded, not too sparse.
3. **Nutrient Management**: Balanced fertilization based on soil testing.
4. **Pest Control**: Integrated pest management to minimize crop losses.
5. **Harvest Timing**: Harvest at optimal maturity for maximum yield and quality.
6. **Expected Yield**: With good practices, expect 40-60 quintals/hectare for ${crop}.

Focus on soil health for sustainable high yields!`;
    }
    
    // Default response
    return `Here's general advice for ${crop} cultivation:
    
1. **Soil Preparation**: Deep plowing and adding organic matter improves soil structure.
2. **Seed Selection**: Use certified, high-quality seeds from reliable sources.
3. **Planting**: Follow recommended spacing and depth for optimal growth.
4. **Care**: Regular monitoring, timely irrigation, and balanced nutrition.
5. **Protection**: Implement IPM strategies for pest and disease control.
6. **Harvest**: Time harvesting correctly to maximize yield and quality.

For specific questions about diseases, fertilizers, or irrigation, please ask more detailed questions!`;
  };

  const currentTips = cultivationTips[selectedSeason as keyof typeof cultivationTips];
  const selectedCropData = crops.find(crop => crop.id === selectedCrop);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cultivation Techniques
          </h1>
          <p className="text-gray-600">
            AI-powered agricultural practices and expert guidance
          </p>
        </motion.div>

        {/* AI Assistant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg p-6 mb-8 text-white"
        >
          <div className="flex items-center mb-4">
            <Bot className="h-8 w-8 mr-3" />
            <h2 className="text-xl font-semibold">AI Cultivation Assistant</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.icon} {crop.name}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about diseases, fertilizers, irrigation..."
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
              />
              <button
                onClick={handleAiQuery}
                disabled={isLoading}
                className="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Thinking...' : 'Ask AI'}
              </button>
            </div>
          </div>
          
          {aiResponse && (
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI Response for {selectedCropData?.name}:</h3>
              <div className="text-sm whitespace-pre-line">{aiResponse}</div>
            </div>
          )}
        </motion.div>

        {/* Season Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Season</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedSeason('kharif')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedSeason === 'kharif'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kharif Season
            </button>
            <button
              onClick={() => setSelectedSeason('rabi')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedSeason === 'rabi'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rabi Season
            </button>
          </div>
        </motion.div>

        {/* Seasonal Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {currentTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className={`p-3 rounded-full ${tip.color} mb-4 inline-block`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tip.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {tip.description}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{tip.timing}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Modern Techniques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Modern Farming Techniques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modernTechniques.map((technique, index) => {
              const Icon = technique.icon;
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {technique.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-3">
                    {technique.description}
                  </p>
                  <div className="space-y-1">
                    {technique.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-lg p-6 text-white"
        >
          <h2 className="text-xl font-semibold mb-4">Expert Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <Zap className="h-8 w-8 mb-2" />
              <h3 className="font-semibold mb-2">Smart Monitoring</h3>
              <p className="text-sm">Use IoT sensors and mobile apps for real-time crop monitoring</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <Thermometer className="h-8 w-8 mb-2" />
              <h3 className="font-semibold mb-2">Climate Adaptation</h3>
              <p className="text-sm">Choose climate-resilient varieties and adaptive practices</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <Leaf className="h-8 w-8 mb-2" />
              <h3 className="font-semibold mb-2">Sustainable Practices</h3>
              <p className="text-sm">Focus on soil health and sustainable farming methods</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Cultivation;