import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { VoiceProvider } from './contexts/VoiceContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Policies from './pages/Policies';
import Cultivation from './pages/Cultivation';
import PricePredictor from './pages/PricePredictor';
import Weather from './pages/Weather';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <VoiceProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/policies"
                element={
                  <ProtectedRoute>
                    <Policies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cultivation"
                element={
                  <ProtectedRoute>
                    <Cultivation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/price-predictor"
                element={
                  <ProtectedRoute>
                    <PricePredictor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/weather"
                element={
                  <ProtectedRoute>
                    <Weather />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </VoiceProvider>
    </AuthProvider>
  );
}

export default App;
