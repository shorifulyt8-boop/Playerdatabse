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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Admin Card */}
        <div 
          onClick={() => {
            setSelectedRole('admin');
            setLoginId('');
            setPassword('');
          }}
          className={cn(
            "relative group cursor-pointer bg-zinc-900/50 border-2 rounded-3xl p-8 transition-all duration-500 hover:scale-105",
            selectedRole === 'admin' ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : "border-zinc-800 hover:border-zinc-700"
          )}
        >
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Shield className="text-emerald-500" size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Auction Admin</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">Manage players, start auctions, and finalize bids.</p>
          
          {selectedRole === 'admin' && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogin(); }}
                className="w-full bg-emerald-500 text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
              >
                Login <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Team Card */}
        <div 
          onClick={() => {
            setSelectedRole('team');
            setLoginId('');
            setPassword('');
          }}
          className={cn(
            "relative group cursor-pointer bg-zinc-900/50 border-2 rounded-3xl p-8 transition-all duration-500 hover:scale-105",
            selectedRole === 'team' ? "border-blue-500 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]" : "border-zinc-800 hover:border-zinc-700"
          )}
        >
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="text-blue-500" size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Team Owner</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">View your squad, budget, and auction history.</p>
          
          {selectedRole === 'team' && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="space-y-3">
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="text"
                    placeholder="Team Login ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogin(); }}
                className="w-full bg-blue-500 text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"
              >
                Login <ArrowRight size={16} />
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
            "relative group cursor-pointer bg-zinc-900/50 border-2 rounded-3xl p-8 transition-all duration-500 hover:scale-105",
            selectedRole === 'public' ? "border-purple-500 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.1)]" : "border-zinc-800 hover:border-zinc-700"
          )}
        >
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Monitor className="text-purple-500" size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Public View</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">Live auction display for screens and spectators.</p>
          <div className="mt-6 flex justify-end">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-black transition-all">
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
