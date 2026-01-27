import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import LogoutButton from './components/LogoutButton';
import Dashboard from './components/Dashboard';
import { initAmsApi } from './api/amsInit';

const MainApp = () => {
  const { isAuthenticated, logout } = useAuth();
  
  // Initialize API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initAmsApi({
        onUnauthorized: () => {
          logout();
        }
      }).catch(err => {
        console.error('[App] Failed to initialize API:', err);
      });
    }
  }, [isAuthenticated, logout]);
  const [wpNumber, setWpNumber] = useState<string>('1234');
  const [isLoading, setIsLoading] = useState(false);
  const [loadedWp, setLoadedWp] = useState<string>('1234');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleLoginSuccess = () => {
    // The login function will be called from LoginPage after successful authentication
    // We just need to trigger a re-render, which will happen automatically via context
  };

  const loadData = () => {
    if (!wpNumber.trim()) return;
    
    setIsLoading(true);
    // Simulate API call - replace with actual API call later
    setTimeout(() => {
      setLoadedWp(wpNumber);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadData();
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main application if authenticated
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <img
            src="/images/59eee07c-20f1-4d39-b757-85758d019d18.avif"
            alt="iCare AMS Logo"
            className="h-14 w-auto"
          />
          
          {/* WP Input - Center */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="wp-number" className="text-sm font-medium text-gray-700">
                WP #
              </label>
              <input
                id="wp-number"
                type="text"
                value={wpNumber}
                onChange={(e) => setWpNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter WP number"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-32 text-sm"
              />
            </div>
            <button
              onClick={loadData}
              disabled={isLoading || !wpNumber.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Load
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden sm:block">
                {lastUpdated.toLocaleTimeString('en-US')}
              </span>
            )}
          </div>
          
          {/* Logout Button */}
          <LogoutButton onLogout={logout} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard wpNumber={loadedWp} />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
