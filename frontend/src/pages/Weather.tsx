import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Cloud,
  Sun,
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Compass,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface WeatherPayload {
  location: {
    state: string;
    district: string;
    coordinates?: { latitude: number; longitude: number };
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: string;
    visibility: number;
    uvIndex: number;
    condition: string;
  };
  forecast: {
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitationProbability: number;
  }[];
  agriculturalAdvisory: {
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
  }[];
  dataSource: { provider: string; lastUpdated: string };
}

interface Place {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}

const Weather: React.FC = () => {
  const { user } = useAuth();
  const [selectedState, setSelectedState] = useState('west-bengal');
  const [pickedDistrict, setPickedDistrict] = useState('');

  const states = [
    { id: 'andhra-pradesh', name: 'Andhra Pradesh' },
    { id: 'arunachal-pradesh', name: 'Arunachal Pradesh' },
    { id: 'assam', name: 'Assam' },
    { id: 'bihar', name: 'Bihar' },
    { id: 'chhattisgarh', name: 'Chhattisgarh' },
    { id: 'goa', name: 'Goa' },
    { id: 'gujarat', name: 'Gujarat' },
    { id: 'haryana', name: 'Haryana' },
    { id: 'himachal-pradesh', name: 'Himachal Pradesh' },
    { id: 'jharkhand', name: 'Jharkhand' },
    { id: 'karnataka', name: 'Karnataka' },
    { id: 'kerala', name: 'Kerala' },
    { id: 'madhya-pradesh', name: 'Madhya Pradesh' },
    { id: 'maharashtra', name: 'Maharashtra' },
    { id: 'manipur', name: 'Manipur' },
    { id: 'meghalaya', name: 'Meghalaya' },
    { id: 'mizoram', name: 'Mizoram' },
    { id: 'nagaland', name: 'Nagaland' },
    { id: 'odisha', name: 'Odisha' },
    { id: 'punjab', name: 'Punjab' },
    { id: 'rajasthan', name: 'Rajasthan' },
    { id: 'sikkim', name: 'Sikkim' },
    { id: 'tamil-nadu', name: 'Tamil Nadu' },
    { id: 'telangana', name: 'Telangana' },
    { id: 'tripura', name: 'Tripura' },
    { id: 'uttar-pradesh', name: 'Uttar Pradesh' },
    { id: 'uttarakhand', name: 'Uttarakhand' },
    { id: 'west-bengal', name: 'West Bengal' },
    { id: 'delhi', name: 'Delhi' },
    { id: 'jammu-kashmir', name: 'Jammu & Kashmir' },
    { id: 'ladakh', name: 'Ladakh' },
  ];

  const stateDistricts: { [key: string]: string[] } = {
    'punjab': ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Hoshiarpur', 'Gurdaspur', 'Faridkot'],
    'haryana': ['Gurgaon', 'Faridabad', 'Hisar', 'Panipat', 'Karnal', 'Ambala', 'Yamunanagar', 'Rohtak', 'Sonipat', 'Kurukshetra'],
    'uttar-pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad'],
    'maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Jalgaon'],
    'karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga'],
    'tamil-nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul'],
    'gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Bharuch'],
    'rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'],
    'west-bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Kharagpur', 'Haldia', 'Raiganj'],
    'bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
    'odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
    'madhya-pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
    'chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund'],
    'jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar'],
    'assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Sivasagar'],
    'kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod'],
    'telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
    'andhra-pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Anantapur', 'Vizianagaram'],
    'himachal-pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundarnagar', 'Chamba'],
    'uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Kotdwar', 'Ramnagar', 'Jaspur'],
    'goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem'],
    'manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati', 'Ukhrul', 'Chandel', 'Tamenglong', 'Jiribam', 'Kangpokpi'],
    'meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara', 'Ampati', 'Resubelpara', 'Khliehriat', 'Williamnagar', 'Mawkyrwat'],
    'tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia', 'Khowai', 'Ambassa', 'Ranir Bazaar', 'Sonamura', 'Kumarghat'],
    'mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit', 'Lawngtlai', 'Saitual', 'Khawzawl'],
    'nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Kiphire', 'Longleng', 'Peren'],
    'arunachal-pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Bomdila', 'Ziro', 'Along', 'Basar', 'Khonsa', 'Tezu'],
    'sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Jorethang', 'Nayabazar', 'Rangpo', 'Singtam', 'Yuksom', 'Pelling'],
    'delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi'],
    'jammu-kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kupwara', 'Pulwama', 'Rajouri', 'Kathua', 'Udhampur', 'Doda'],
    'ladakh': ['Leh', 'Kargil', 'Nubra', 'Changthang', 'Zanskar', 'Drass', 'Sankoo', 'Turtuk', 'Diskit', 'Padum']
  };

  // Match the farmer's saved state name (e.g. "West Bengal") to a state id
  const findStateId = (name?: string) => {
    if (!name) return undefined;
    const key = name.trim().toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ');
    return states.find(
      (s) =>
        s.name.toLowerCase().replace(/&/g, 'and') === key ||
        s.id.replace(/-/g, ' ') === key
    )?.id;
  };

  // 1) On load, start with the farmer's own state
  useEffect(() => {
    const own = findStateId(user?.location?.state);
    if (own) setSelectedState(own);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2) District list for the selected state (the farmer's own district comes first)
  const mine = user?.location?.district?.trim();
  const isOwnState = findStateId(user?.location?.state) === selectedState;

  const districts = useMemo(() => {
    const list = [...(stateDistricts[selectedState] || [])];
    if (mine && isOwnState && !list.some((d) => d.toLowerCase() === mine.toLowerCase())) {
      list.unshift(mine);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, mine, isOwnState]);

  // The district is always one that belongs to the selected state, so the page never
  // asks for a mismatched pair such as "Tripura / Hyderabad".
  const selectedDistrict =
    districts.find((d) => d.toLowerCase() === pickedDistrict.toLowerCase()) ||
    (mine && isOwnState ? districts.find((d) => d.toLowerCase() === mine.toLowerCase()) : undefined) ||
    districts[0] ||
    '';

  // 3) Load live weather from the backend
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');
  const [stale, setStale] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (!selectedState || !selectedDistrict) return;
    let cancelled = false;
    setWLoading(true);
    setWError('');

    api
      .get<WeatherPayload>(
        `/weather/${encodeURIComponent(selectedState)}/${encodeURIComponent(selectedDistrict)}`
      )
      .then((res) => {
        if (cancelled) return;
        setWeather(res.data ?? null);
        setStale(Boolean(res.stale));
        setPlace((res.place as Place | null | undefined) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setWeather(null);
        setPlace(null);
        setWError(err.message || 'Could not load weather');
      })
      .finally(() => {
        if (!cancelled) setWLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedDistrict]);

  const iconFor = (condition: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('thunder')) return CloudRain;
    if (c === 'clear') return Sun;
    return Cloud;
  };

  const w = weather?.current;

  const currentWeather = {
    temperature: w ? Math.round(w.temperature) : '--',
    condition: w?.condition ?? '--',
    humidity: w ? Math.round(w.humidity) : '--',
    windSpeed: w ? Math.round(w.windSpeed) : '--',
    windDirection: w?.windDirection ?? '',
    visibility: w ? Math.round(w.visibility / 1000) : '--',
    pressure: w?.pressure ?? '--',
    uvIndex: w?.uvIndex ?? '--',
    icon: iconFor(w?.condition ?? ''),
  };

  const forecast = (weather?.forecast ?? []).map((d, i) => ({
    day: i === 0 ? 'Today' : new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
    high: Math.round(d.high),
    low: Math.round(d.low),
    condition: d.condition,
    icon: iconFor(d.condition),
    rain: d.precipitationProbability,
  }));

  const agriculturalAdvisory = (weather?.agriculturalAdvisory ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: a.priority,
    icon: a.type === 'irrigation' ? Droplets : a.type === 'pest' ? AlertTriangle : Calendar,
    color:
      a.priority === 'high'
        ? 'bg-red-100 text-red-600'
        : a.priority === 'medium'
        ? 'bg-yellow-100 text-yellow-600'
        : 'bg-green-100 text-green-600',
  }));

  const weatherMetrics = [
    { label: 'Temperature', value: `${currentWeather.temperature}°C`, icon: Thermometer },
    { label: 'Humidity', value: `${currentWeather.humidity}%`, icon: Droplets },
    { label: 'Wind Speed', value: `${currentWeather.windSpeed} km/h`, icon: Wind },
    { label: 'Visibility', value: `${currentWeather.visibility} km`, icon: Eye },
    { label: 'Pressure', value: `${currentWeather.pressure} hPa`, icon: Compass },
    { label: 'UV Index', value: currentWeather.uvIndex, icon: Sun },
  ];

  const selectedStateData = states.find(state => state.id === selectedState);

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
            Weather Forecast
          </h1>
          <p className="text-gray-600">
            Real-time weather data and agricultural advisory
          </p>
        </motion.div>

        {/* Location Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setPickedDistrict('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setPickedDistrict(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!districts.length}
              >
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {wLoading && <p className="text-sm text-gray-600 mb-4">Loading weather…</p>}
        {wError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{wError}</div>
        )}
        {weather && !wLoading && (
          <p className="text-xs text-gray-500 mb-4">
            Source: {weather.dataSource.provider} · Updated{' '}
            {new Date(weather.dataSource.lastUpdated).toLocaleString('en-IN')}
            {stale && ' · Showing last saved data (live service unavailable)'}
            {place &&
              ` · Showing weather for ${place.name}${place.region ? `, ${place.region}` : ''} (${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)})`}
          </p>
        )}

        {/* Current Weather */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Current Weather</h2>
              <p className="text-lg opacity-90">{selectedDistrict}, {selectedStateData?.name}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <currentWeather.icon className="h-12 w-12" />
                <span className="text-4xl font-bold">{currentWeather.temperature}°C</span>
              </div>
              <p className="text-lg opacity-90">{currentWeather.condition}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {weatherMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm opacity-90">{metric.label}</span>
                  </div>
                  <p className="font-semibold">{metric.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">7-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {forecast.map((day, index) => {
              const Icon = day.icon;
              return (
                <div key={index} className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                  <p className="text-sm font-medium text-gray-900 mb-2">{day.day}</p>
                  <Icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-500 mb-2">{day.condition}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{day.high}°</p>
                    <p className="text-xs text-gray-500">{day.low}°</p>
                    <p className="text-xs text-blue-600">{day.rain}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Agricultural Advisory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Agricultural Advisory</h2>
          {agriculturalAdvisory.length === 0 && !wLoading && (
            <p className="text-sm text-gray-500">No special advisories for the next few days.</p>
          )}
          <div className="space-y-4">
            {agriculturalAdvisory.map((advisory, index) => {
              const Icon = advisory.icon;
              return (
                <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className={`p-2 rounded-full ${advisory.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{advisory.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        advisory.priority === 'high' ? 'bg-red-100 text-red-600' :
                        advisory.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {advisory.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{advisory.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Weather;