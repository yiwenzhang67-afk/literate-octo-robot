import React, { useState, useEffect } from 'react';
import { ViewState, User } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { Journal } from './components/Journal';
import { MoodTracker } from './components/MoodTracker';
import { CBTCoach } from './components/CBTCoach';
import { Rewards } from './components/Rewards';
import { APP_NAME } from './constants';
import { Flame } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [initializing, setInitializing] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const storedUser = storageService.getUser();
    if (storedUser) {
      setUser(storedUser);
      setCurrentView(ViewState.DASHBOARD);
      updateStreak();
    }
    setInitializing(false);
  }, []);

  useEffect(() => {
    if (currentView === ViewState.DASHBOARD && user) {
        updateStreak();
    }
  }, [currentView, user]);

  const updateStreak = async () => {
    const s = await storageService.getStreak();
    setStreak(s);
  };

  const handleLogin = () => {
    const u = storageService.getUser();
    if (u) {
      setUser(u);
      setCurrentView(ViewState.DASHBOARD);
      updateStreak();
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setCurrentView(ViewState.LOGIN);
  };

  if (initializing) return <div className="flex items-center justify-center h-screen bg-stone-50 text-amber-600">加载中...</div>;

  if (!user) {
    return <Auth onLogin={handleLogin} initialView={currentView === ViewState.REGISTER ? ViewState.REGISTER : ViewState.LOGIN} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return (
          <div className="p-4 pb-24">
            <header className="mb-6 pt-2 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">早安, {user.username}</h1>
                    <p className="text-stone-500 text-sm">今天也要记得感恩哦</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                        <Flame size={14} fill="currentColor" />
                        <span>{streak} 天连续</span>
                    </div>
                </div>
            </header>
            
            <MoodTracker />
            
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setCurrentView(ViewState.JOURNAL)}>
                <h3 className="font-bold text-amber-800 mb-2">开始今日感恩日记</h3>
                <p className="text-amber-700/80 text-sm">记录下3件让你感到幸福的小事...</p>
            </div>
          </div>
        );
      case ViewState.JOURNAL:
        return <Journal />;
      case ViewState.CBT:
        return <CBTCoach />;
      case ViewState.PROFILE:
        return <Rewards user={user} onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl shadow-stone-200 overflow-hidden relative">
      {/* Simple Header for non-dashboard views if needed, or just content */}
      <div className="h-full overflow-y-auto no-scrollbar bg-[#fdfbf7]">
        {renderContent()}
      </div>
      <Navbar currentView={currentView} onChangeView={setCurrentView} />
    </div>
  );
};

export default App;