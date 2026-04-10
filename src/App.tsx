import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TopAppBar from './components/TopAppBar';
import BottomNavBar from './components/BottomNavBar';
import Dashboard from './pages/Dashboard';
import MyWeek from './pages/MyWeek';
import Today from './pages/Today';
import CalendarView from './pages/CalendarView';
import Settings from './pages/Settings';
import CoachChat from './pages/CoachChat';
import StravaCallback from './pages/StravaCallback';
import Login from './pages/Login';

function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/week" element={<MyWeek />} />
          <Route path="/today" element={<Today />} />
          <Route path="/coach" element={<CoachChat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/strava/callback" element={<StravaCallback />} />
        </Routes>
      </main>
      <BottomNavBar />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage on mount
    const authStatus = localStorage.getItem('antigravity_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
