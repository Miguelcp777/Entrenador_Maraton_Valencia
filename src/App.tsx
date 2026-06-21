import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopAppBar from './components/TopAppBar';
import BottomNavBar from './components/BottomNavBar';
import Login from './pages/Login';

// Carga diferida de las páginas para reducir el bundle inicial.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyWeek = lazy(() => import('./pages/MyWeek'));
const Today = lazy(() => import('./pages/Today'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const Settings = lazy(() => import('./pages/Settings'));
const CoachChat = lazy(() => import('./pages/CoachChat'));
const StravaCallback = lazy(() => import('./pages/StravaCallback'));

function PageFallback() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}

function AppLayout() {
  return (
    <div className="w-full max-w-[430px] mx-auto flex flex-col bg-[#09090b] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-white/5 overflow-hidden" style={{ height: '100dvh' }}>
      <TopAppBar />
      <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto pb-24">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/week" element={<MyWeek />} />
            <Route path="/today" element={<Today />} />
            <Route path="/coach" element={<CoachChat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/strava/callback" element={<StravaCallback />} />
          </Routes>
        </Suspense>
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
