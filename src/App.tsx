import React, { useState } from 'react';
import AuctionDashboard from './components/AuctionDashboard';
import TeamView from './components/TeamView';
import PlayerRegistration from './components/PlayerRegistration';
import { LayoutDashboard, Users, Trophy, UserPlus } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'auction' | 'teams' | 'registration'>('auction');

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
            
            <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-2xl border border-zinc-700/50">
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
                Registration
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
                Auction
              </button>
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
                Squads
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'auction' && <AuctionDashboard />}
        {activeTab === 'teams' && <TeamView />}
        {activeTab === 'registration' && <PlayerRegistration />}
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
