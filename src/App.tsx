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
    <div className="w-full max-w-[430px] mx-auto min-h-screen pb-24 relative bg-[#09090b] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-white/5 overflow-hidden">
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
      <div className="w-full max-w-[430px] mx-auto fixed bottom-0 left-0 right-0 z-50">
        <BottomNavBar />
      </div>
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
