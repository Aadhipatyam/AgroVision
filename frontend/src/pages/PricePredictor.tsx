import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Calendar,
  MapPin,
  Wheat,
  Search,
  Bot,
  RefreshCw
} from 'lucide-react';

const PricePredictor: React.FC = () => {
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [selectedMarket, setSelectedMarket] = useState('punjab');
  const [predictionPeriod, setPredictionPeriod] = useState('7');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const crops = [
    { id: 'wheat', name: 'Wheat', icon: '🌾' },
    { id: 'rice', name: 'Rice', icon: '🍚' },
    { id: 'corn', name: 'Corn', icon: '🌽' },
    { id: 'cotton', name: 'Cotton', icon: '🌸' },
    { id: 'sugarcane', name: 'Sugarcane', icon: '🎋' },
    { id: 'soybean', name: 'Soybean', icon: '🫘' },
    { id: 'onion', name: 'Onion', icon: '🧅' },
    { id: 'tomato', name: 'Tomato', icon: '🍅' },
    { id: 'potato', name: 'Potato', icon: '🥔' },
  ];

  const markets = [
    { id: 'andhra-pradesh', name: 'Andhra Pradesh', state: 'AP' },
    { id: 'bihar', name: 'Bihar', state: 'BR' },
    { id: 'gujarat', name: 'Gujarat', state: 'GJ' },
    { id: 'haryana', name: 'Haryana', state: 'HR' },
    { id: 'karnataka', name: 'Karnataka', state: 'KA' },
    { id: 'kerala', name: 'Kerala', state: 'KL' },
    { id: 'madhya-pradesh', name: 'Madhya Pradesh', state: 'MP' },
    { id: 'maharashtra', name: 'Maharashtra', state: 'MH' },
    { id: 'odisha', name: 'Odisha', state: 'OR' },
    { id: 'punjab', name: 'Punjab', state: 'PB' },
    { id: 'rajasthan', name: 'Rajasthan', state: 'RJ' },
    { id: 'tamil-nadu', name: 'Tamil Nadu', state: 'TN' },
    { id: 'telangana', name: 'Telangana', state: 'TG' },
    { id: 'uttar-pradesh', name: 'Uttar Pradesh', state: 'UP' },
    { id: 'west-bengal', name: 'West Bengal', state: 'WB' },
  ];

  const [priceData, setPriceData] = useState({
    current: 2850,
    predicted: 2920,
    change: 70,
    changePercent: 2.46,
    trend: 'up',
    confidence: 92
  });

  const historicalData = [
    { month: 'Jan', price: 2650 },
    { month: 'Feb', price: 2700 },
    { month: 'Mar', price: 2750 },
    { month: 'Apr', price: 2800 },
    { month: 'May', price: 2850 },
    { month: 'Jun', price: 2920 },
  ];

  const marketInsights = [
    {
      title: 'Demand Outlook',
      value: 'High',
      description: 'Strong export demand expected',
      color: 'text-green-600'
    },
    {
      title: 'Supply Status',
      value: 'Moderate',
      description: 'Average harvest this season',
      color: 'text-yellow-600'
    },
    {
      title: 'Weather Impact',
      value: 'Positive',
      description: 'Favorable conditions ahead',
      color: 'text-green-600'
    },
    {
      title: 'Government Policy',
      value: 'Supportive',
      description: 'MSP increase announced',
      color: 'text-blue-600'
    }
  ];

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await simulateAiPriceResponse(aiQuery, selectedCrop, selectedMarket);
      setAiResponse(response);
    } catch (error) {
      console.error('AI query failed:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPrediction = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call to refresh price data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate new mock data
      const newPrice = Math.round(2800 + (Math.random() - 0.5) * 200);
      const newPredicted = Math.round(newPrice + (Math.random() - 0.5) * 150);
      const change = newPredicted - newPrice;
      
      setPriceData({
        current: newPrice,
        predicted: newPredicted,
        change: change,
        changePercent: Number(((change / newPrice) * 100).toFixed(2)),
        trend: change > 0 ? 'up' : 'down',
        confidence: Math.round(85 + Math.random() * 10)
      });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const simulateAiPriceResponse = async (query: string, crop: string, market: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const lowerQuery = query.toLowerCase();
    const selectedCropData = crops.find(c => c.id === crop);
    const selectedMarketData = markets.find(m => m.id === market);
    
    if (lowerQuery.includes('price') && lowerQuery.includes('prediction')) {
      return `Price prediction analysis for ${selectedCropData?.name} in ${selectedMarketData?.name}:

**Current Market Analysis:**
- Current Price: ₹${priceData.current}/quintal
- Predicted Price (${predictionPeriod} days): ₹${priceData.predicted}/quintal
- Expected Change: ${priceData.change > 0 ? '+' : ''}₹${priceData.change} (${priceData.changePercent}%)

**Key Factors Influencing Prices:**
1. **Seasonal Demand**: Peak demand expected due to festival season
2. **Weather Conditions**: Favorable weather supporting good harvest
3. **Export Opportunities**: Strong international demand
4. **Government Policies**: MSP support providing price floor
5. **Storage Capacity**: Adequate storage facilities available

**Recommendation**: ${priceData.trend === 'up' ? 'Consider holding stock for better prices' : 'Current prices are favorable for selling'}

Confidence Level: ${priceData.confidence}%`;
    }
    
    if (lowerQuery.includes('market') && lowerQuery.includes('trend')) {
      return `Market trend analysis for ${selectedCropData?.name}:

**Short-term Trends (1-2 weeks):**
- Prices expected to ${priceData.trend === 'up' ? 'increase' : 'decrease'} by ${Math.abs(priceData.changePercent)}%
- High volatility due to seasonal factors

**Medium-term Outlook (1-3 months):**
- Stable demand from processing industries
- Government procurement likely to support prices
- Export demand remains strong

**Long-term Forecast (3-6 months):**
- New crop arrival may pressure prices
- Overall trend depends on monsoon performance
- Global commodity prices influencing local markets

**Trading Strategy**: Monitor daily price movements and consider gradual selling/buying approach.`;
    }
    
    if (lowerQuery.includes('best') && lowerQuery.includes('time')) {
      return `Best time to sell ${selectedCropData?.name} in ${selectedMarketData?.name}:

**Optimal Selling Windows:**
1. **Immediate (Next 7 days)**: ${priceData.trend === 'up' ? 'Wait for price increase' : 'Good time to sell'}
2. **Short-term (2-4 weeks)**: Prices expected to ${priceData.trend === 'up' ? 'peak' : 'stabilize'}
3. **Festival Season**: Premium prices during major festivals

**Market Timing Tips:**
- Monitor daily arrivals in major mandis
- Track weather forecasts for production areas
- Watch government policy announcements
- Consider storage costs vs. expected price gains

**Current Recommendation**: ${priceData.trend === 'up' ? 'Hold for 1-2 weeks for better prices' : 'Sell now as prices may decline'}`;
    }
    
    if (lowerQuery.includes('compare') && lowerQuery.includes('market')) {
      return `Market comparison for ${selectedCropData?.name}:

**Top Performing Markets:**
1. **Maharashtra**: ₹${priceData.current + 50}/quintal (+1.8%)
2. **Punjab**: ₹${priceData.current}/quintal (baseline)
3. **Haryana**: ₹${priceData.current - 30}/quintal (-1.1%)
4. **Uttar Pradesh**: ₹${priceData.current - 50}/quintal (-1.8%)

**Transportation Considerations:**
- Factor in transport costs (₹50-100/quintal)
- Consider quality premiums in different markets
- Check market infrastructure and payment terms

**Recommendation**: Consider selling in nearby premium markets if transport costs are justified.`;
    }
    
    return `General market insights for ${selectedCropData?.name}:

**Current Market Status:**
- Price: ₹${priceData.current}/quintal
- Market sentiment: ${priceData.trend === 'up' ? 'Bullish' : 'Bearish'}
- Trading volume: Moderate to High

**Key Market Drivers:**
1. Seasonal demand patterns
2. Weather conditions in growing regions
3. Government policy support
4. Export-import dynamics
5. Storage and logistics costs

**Price Factors:**
- Quality premiums for better grades
- Moisture content affecting prices
- Market infrastructure and competition

For specific questions about timing, trends, or market comparisons, please ask more detailed questions!`;
  };

  const selectedCropData = crops.find(crop => crop.id === selectedCrop);
  const selectedMarketData = markets.find(market => market.id === selectedMarket);

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
            AI Price Predictor
          </h1>
          <p className="text-gray-600">
            AI-powered crop price predictions and market analysis
          </p>
        </motion.div>

        {/* AI Price Assistant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 mb-8 text-white"
        >
          <div className="flex items-center mb-4">
            <Bot className="h-8 w-8 mr-3" />
            <h2 className="text-xl font-semibold">AI Market Analyst</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask about price predictions, market trends, best selling time..."
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
            />
            <button
              onClick={handleAiQuery}
              disabled={isLoading}
              className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Analyzing...' : 'Ask AI'}
            </button>
          </div>
          
          {aiResponse && (
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI Market Analysis:</h3>
              <div className="text-sm whitespace-pre-line">{aiResponse}</div>
            </div>
          )}
        </motion.div>

        {/* Selection Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Crop
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.icon} {crop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Market
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prediction Period
              </label>
              <select
                value={predictionPeriod}
                onChange={(e) => setPredictionPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="7">Next 7 days</option>
                <option value="15">Next 15 days</option>
                <option value="30">Next 30 days</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRefreshPrediction}
                disabled={isRefreshing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Price Prediction Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-lg p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-full">
                <span className="text-2xl">{selectedCropData?.icon}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedCropData?.name}</h2>
                <p className="text-sm opacity-90">{selectedMarketData?.name} Market</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">AI Confidence</p>
              <p className="text-lg font-semibold">{priceData.confidence}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Current Price</span>
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">₹{priceData.current}/qtl</p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Predicted Price</span>
                {priceData.trend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-green-200" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-200" />
                )}
              </div>
              <p className="text-2xl font-bold">₹{priceData.predicted}/qtl</p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Expected Change</span>
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className={`text-2xl font-bold ${priceData.change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {priceData.change > 0 ? '+' : ''}₹{priceData.change} ({priceData.changePercent}%)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Historical Price Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Price Trend Analysis</h2>
          <div className="h-64 flex items-end justify-between space-x-4">
            {historicalData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(data.price / 3000) * 200}px`,
                    minHeight: '20px'
                  }}
                ></div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900">₹{data.price}</p>
                  <p className="text-xs text-gray-500">{data.month}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Market Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Market Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketInsights.map((insight, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                <p className={`text-lg font-bold ${insight.color} mb-2`}>
                  {insight.value}
                </p>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 AI Trading Recommendation</h3>
            <p className="text-sm text-blue-800">
              Based on current market analysis, {priceData.trend === 'up' ? 'consider holding your stock for 1-2 weeks as prices are expected to increase' : 'current prices are favorable for selling as market may see downward pressure'}. 
              Monitor daily price movements and government policy announcements for optimal timing.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricePredictor;