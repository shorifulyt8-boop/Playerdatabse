import React, { useState } from 'react';
import { Shield, Users, Monitor, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export type UserRole = 'admin' | 'team' | 'public';

interface LoginProps {
  onLogin: (role: UserRole, teamId?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (selectedRole === 'admin') {
      if (password === 'admin123') { // Simple demo password
        onLogin('admin');
      } else {
        setError('Invalid admin password');
      }
    } else if (selectedRole === 'team') {
      const { data: team, error: loginError } = await supabase
        .from('teams')
        .select('*')
        .eq('login_id', loginId)
        .eq('password', password)
        .single();

      if (loginError || !team) {
        setError('Invalid Team ID or Password');
      } else {
        onLogin('team', team.id);
      }
    } else if (selectedRole === 'public') {
      onLogin('public');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Atmospheric Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />

      <div className="w-full max-w-6xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold tracking-widest uppercase mb-4">
            Professional Auction Management
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9]">
            SA Premier<span className="text-emerald-500"> League 2026</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto font-medium">
            The ultimate platform for real-time player auctions and team management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Admin Card */}
          <div 
            onClick={() => {
              setSelectedRole('admin');
              setLoginId('');
              setPassword('');
              setError('');
            }}
            className={cn(
              "relative group cursor-pointer backdrop-blur-md border rounded-[2.5rem] p-10 transition-all duration-700 hover:-translate-y-2",
              selectedRole === 'admin' 
                ? "border-emerald-500/50 bg-emerald-500/[0.03] shadow-[0_0_50px_rgba(16,185,129,0.15)]" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
            )}
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
              <Shield className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tight">Auction Admin</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Complete control over players, bidding cycles, and final team rosters.</p>
            
            {selectedRole === 'admin' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="password"
                    placeholder="Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold ml-1">{error}</p>}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLogin(); }}
                  className="w-full bg-emerald-500 text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95"
                >
                  ACCESS ADMIN <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Team Card */}
          <div 
            onClick={() => {
              if (selectedRole !== 'team') {
                setSelectedRole('team');
                setLoginId('');
                setPassword('');
                setError('');
              }
            }}
            className={cn(
              "relative group cursor-pointer backdrop-blur-md border rounded-[2.5rem] p-10 transition-all duration-700 hover:-translate-y-2",
              selectedRole === 'team' 
                ? "border-blue-500/50 bg-blue-500/[0.03] shadow-[0_0_50px_rgba(59,130,246,0.15)]" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
            )}
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 group-hover:-rotate-6">
              <Users className="text-blue-500" size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tight">Team Owner</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Manage your budget, track your squad, and participate in live bidding.</p>
            
            {selectedRole === 'team' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="space-y-3">
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="text"
                      placeholder="Team Login ID"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-xs font-bold ml-1">{error}</p>}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLogin(); }}
                  className="w-full bg-blue-500 text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-400 transition-all shadow-[0_10px_20px_rgba(59,130,246,0.2)] active:scale-95"
                >
                  ACCESS TEAM <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Public Dashboard Card */}
          <div 
            onClick={() => {
              setSelectedRole('public');
              onLogin('public');
            }}
            className={cn(
              "relative group cursor-pointer backdrop-blur-md border rounded-[2.5rem] p-10 transition-all duration-700 hover:-translate-y-2",
              selectedRole === 'public' 
                ? "border-purple-500/50 bg-purple-500/[0.03] shadow-[0_0_50px_rgba(168,85,247,0.15)]" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
            )}
          >
            <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500">
              <Monitor className="text-purple-500" size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tight">Public View</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Live auction dashboard for spectators, big screens, and media coverage.</p>
            <div className="mt-12 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-[0.2em] text-purple-500 uppercase">No login required</span>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-black transition-all duration-500 group-hover:scale-110">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5 pt-12">
          <div className="flex items-center gap-8">
            <div className="text-center md:text-left">
              <p className="text-white font-black text-2xl tracking-tighter">100%</p>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Real-time Sync</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-white font-black text-2xl tracking-tighter">4K</p>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Ready Display</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-white font-black text-2xl tracking-tighter">∞</p>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Scalability</p>
            </div>
          </div>
          <p className="text-zinc-600 text-xs font-medium tracking-wide">
            Powered by AuctionPro Engine v2.6.0
          </p>
        </div>
      </div>
    </div>
  );
}
