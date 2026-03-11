import React, { useState, useEffect } from 'react';
import AuctionDashboard from './components/AuctionDashboard';
import TeamView from './components/TeamView';
import PlayerRegistration from './components/PlayerRegistration';
import TeamManagement from './components/TeamManagement';
import PublicAuctionView from './components/PublicAuctionView';
import Login, { UserRole } from './components/Login';
import { LayoutDashboard, Users, Trophy, UserPlus, LogOut, Monitor, Settings } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'auction' | 'teams' | 'registration' | 'public' | 'squad-mgmt'>('auction');
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  // Load role from session storage if exists
  useEffect(() => {
    const savedRole = sessionStorage.getItem('userRole') as UserRole;
    const savedTeamId = sessionStorage.getItem('userTeamId');
    if (savedRole) {
      setRole(savedRole);
      if (savedTeamId) setUserTeamId(savedTeamId);
      
      if (savedRole === 'public') setActiveTab('public');
      if (savedRole === 'team') setActiveTab('teams');
    }
  }, []);

  const handleLogin = (newRole: UserRole, teamId?: string) => {
    setRole(newRole);
    sessionStorage.setItem('userRole', newRole);
    if (teamId) {
      setUserTeamId(teamId);
      sessionStorage.setItem('userTeamId', teamId);
    }

    if (newRole === 'public') setActiveTab('public');
    else if (newRole === 'team') setActiveTab('teams');
    else setActiveTab('auction');
  };

  const handleLogout = () => {
    setRole(null);
    setUserTeamId(null);
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userTeamId');
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Trophy className="text-black" size={24} />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">
                Auction<span className="text-emerald-500">Pro</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-2xl border border-zinc-700/50">
                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => setActiveTab('squad-mgmt')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'squad-mgmt' 
                          ? "bg-emerald-500 text-black shadow-lg" 
                          : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                      )}
                    >
                      <Settings size={18} />
                      Squads
                    </button>
                    <button
                      onClick={() => setActiveTab('registration')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'registration' 
                          ? "bg-emerald-500 text-black shadow-lg" 
                          : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                      )}
                    >
                      <UserPlus size={18} />
                      Players
                    </button>
                    <button
                      onClick={() => setActiveTab('auction')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'auction' 
                          ? "bg-emerald-500 text-black shadow-lg" 
                          : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                      )}
                    >
                      <LayoutDashboard size={18} />
                      Admin
                    </button>
                  </>
                )}
                
                {(role === 'admin' || role === 'team') && (
                  <button
                    onClick={() => setActiveTab('teams')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                      activeTab === 'teams' 
                        ? "bg-emerald-500 text-black shadow-lg" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                    )}
                  >
                    <Users size={18} />
                    View Squads
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('public')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'public' 
                      ? "bg-emerald-500 text-black shadow-lg" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                  )}
                >
                  <Monitor size={18} />
                  Dashboard
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'auction' && role === 'admin' && <AuctionDashboard />}
        {activeTab === 'teams' && <TeamView />}
        {activeTab === 'registration' && role === 'admin' && <PlayerRegistration />}
        {activeTab === 'squad-mgmt' && role === 'admin' && <TeamManagement />}
        {activeTab === 'public' && <PublicAuctionView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm font-medium">
            © 2026 Cricket Auction Pro. Real-time sports management system.
          </p>
        </div>
      </footer>
    </div>
  );
}
