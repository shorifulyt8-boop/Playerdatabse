import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player, Team } from '../types';
import { Trophy, Users, TrendingUp, Timer, User, ShieldCheck, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function PublicAuctionView() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [nextPlayer, setNextPlayer] = useState<Player | null>(null);
  const [lastSold, setLastSold] = useState<{ player: Player, team: Team } | null>(null);
  const [showStatus, setShowStatus] = useState<'sold' | 'unsold' | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchInitialData();

    const playerSub = supabase
      .channel('public-auction')
      .on('postgres_changes', { event: 'UPDATE', table: 'players', schema: 'public' }, (payload) => {
        const updatedPlayer = payload.new as Player;
        
        if (updatedPlayer.status === 'sold' || updatedPlayer.status === 'unsold') {
          handlePlayerStatusChange(updatedPlayer);
        } else {
          fetchAuctionState();
        }
      })
      .subscribe();

    const teamSub = supabase
      .channel('public-teams')
      .on('postgres_changes', { event: '*', table: 'teams', schema: 'public' }, () => fetchTeams())
      .subscribe();

    return () => {
      supabase.removeChannel(playerSub);
      supabase.removeChannel(teamSub);
    };
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([fetchAuctionState(), fetchTeams()]);
  };

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('name');
    if (data) setTeams(data);
  };

  const fetchAuctionState = async () => {
    const { data: available } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(2);

    if (available && available.length > 0) {
      setCurrentPlayer(available[0]);
      setNextPlayer(available[1] || null);
    } else {
      setCurrentPlayer(null);
      setNextPlayer(null);
    }
  };

  const handlePlayerStatusChange = async (player: Player) => {
    if (player.status === 'sold') {
      const { data: team } = await supabase.from('teams').select('*').eq('id', player.team_id).single();
      if (team) {
        setLastSold({ player, team });
        setShowStatus('sold');
      }
    } else if (player.status === 'unsold') {
      setShowStatus('unsold');
    }

    // Wait for animation, then reset and fetch next
    setTimeout(() => {
      setShowStatus(null);
      fetchAuctionState();
    }, 4000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col gap-8 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Stats & Next */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" />
              Auction Stats
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-black text-white">{teams.length}</p>
                <p className="text-zinc-500 text-[10px] uppercase font-bold">Active Teams</p>
              </div>
              <div className="h-px bg-zinc-800" />
              <div>
                <p className="text-2xl font-black text-white">
                  {currentPlayer ? 'Live' : 'Paused'}
                </p>
                <p className="text-zinc-500 text-[10px] uppercase font-bold">Status</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Timer size={14} className="text-blue-500" />
              Up Next
            </h3>
            {nextPlayer ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 font-bold text-xl">
                  {nextPlayer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{nextPlayer.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">{nextPlayer.category}</p>
                </div>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm italic">No more players in queue</p>
            )}
          </div>
        </div>

        {/* Center Column: Current Player (Main Stage) */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {currentPlayer && !showStatus ? (
              <motion.div
                key={currentPlayer.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-12 backdrop-blur-xl text-center relative overflow-hidden group"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                
                <div className="mb-8 relative inline-block">
                  <div className="w-48 h-48 bg-zinc-800 rounded-[48px] mx-auto flex items-center justify-center text-zinc-600 border-4 border-zinc-800 group-hover:border-emerald-500/20 transition-colors duration-500">
                    <User size={80} />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter italic">
                    Current Player
                  </div>
                </div>

                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic italic">
                  {currentPlayer.name}
                </h2>
                <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-sm mb-8">
                  {currentPlayer.category}
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="bg-zinc-800/50 rounded-3xl p-6 border border-zinc-700/50">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Base Price</p>
                    <p className="text-2xl font-black text-white font-mono">
                      ${currentPlayer.base_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20">
                    <p className="text-emerald-500 text-[10px] uppercase font-bold mb-1">Current Bid</p>
                    <p className="text-2xl font-black text-emerald-500 font-mono">
                      ${currentPlayer.base_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : showStatus === 'sold' && lastSold ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-500 rounded-[40px] p-12 text-center text-black relative overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.5)]"
              >
                <motion.div 
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-10 -right-10 opacity-20"
                >
                  <Trophy size={200} />
                </motion.div>
                
                <div className="relative z-10">
                  <ShieldCheck size={80} className="mx-auto mb-6" />
                  <h2 className="text-8xl font-black uppercase italic tracking-tighter mb-4">SOLD!</h2>
                  <p className="text-2xl font-bold mb-8 opacity-80">{lastSold.player.name}</p>
                  
                  <div className="bg-black/10 rounded-3xl p-8 backdrop-blur-sm inline-block min-w-[300px]">
                    <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-60">Bought By</p>
                    <p className="text-4xl font-black uppercase tracking-tighter">{lastSold.team.name}</p>
                    <p className="text-2xl font-mono mt-4 font-bold">${lastSold.player.sold_price?.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ) : showStatus === 'unsold' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-800 rounded-[40px] p-12 text-center text-white relative overflow-hidden"
              >
                <XCircle size={80} className="mx-auto mb-6 text-zinc-500" />
                <h2 className="text-8xl font-black uppercase italic tracking-tighter mb-4 text-zinc-500">UNSOLD</h2>
                <p className="text-2xl font-bold mb-8 text-zinc-400">Player returned to pool</p>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-24 backdrop-blur-xl text-center">
                <p className="text-zinc-600 font-bold uppercase tracking-widest">Waiting for next player...</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Leaderboard/Teams */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={14} className="text-purple-500" />
              Team Budgets
            </h3>
            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                  <p className="text-xs font-bold text-zinc-300 truncate pr-2">{team.name}</p>
                  <p className="text-xs font-mono font-bold text-emerald-500">
                    ${(team.remaining_budget / 1000000).toFixed(1)}M
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
