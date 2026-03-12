import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player, Team } from '../types';
import { Trophy, Users, TrendingUp, Timer, User, ShieldCheck, XCircle, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
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
      .on('postgres_changes', { event: '*', table: 'players', schema: 'public' }, (payload) => {
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

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

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
        triggerConfetti();
      }
    } else if (player.status === 'unsold') {
      setShowStatus('unsold');
    }

    // Wait for animation, then reset and fetch next
    setTimeout(() => {
      setShowStatus(null);
      fetchAuctionState();
    }, 6000); // Increased duration for better impact
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
                    {currentPlayer.image_url ? (
                      <img 
                        src={currentPlayer.image_url} 
                        alt={currentPlayer.name} 
                        className="w-full h-full object-cover rounded-[44px]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={80} />
                    )}
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter italic">
                    Current Player
                  </div>
                </div>

                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">
                  {currentPlayer.name}
                </h2>
                <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-sm mb-8">
                  {currentPlayer.category}
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="bg-zinc-800/50 rounded-3xl p-6 border border-zinc-700/50">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Base Price</p>
                    <p className="text-2xl font-black text-zinc-400 font-mono">
                      ${currentPlayer.base_price.toLocaleString()}
                    </p>
                  </div>
                  <motion.div 
                    key={currentPlayer.current_bid}
                    initial={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                    animate={{ scale: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                    className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20"
                  >
                    <p className="text-emerald-500 text-[10px] uppercase font-bold mb-1">Current Bid</p>
                    <p className="text-2xl font-black text-emerald-500 font-mono">
                      ${(currentPlayer.current_bid || currentPlayer.base_price).toLocaleString()}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            ) : showStatus === 'sold' && lastSold ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="relative min-h-[500px] flex items-center justify-center rounded-[40px] overflow-hidden bg-zinc-950 border border-blue-500/30 shadow-[0_0_100px_rgba(59,130,246,0.2)]"
              >
                {/* Animated Background Layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]" 
                />

                <div className="relative z-10 p-12 text-center w-full">
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex justify-center gap-4 mb-6">
                      <motion.div
                        animate={{ rotate: [-10, 10, -10] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Star className="text-yellow-500 fill-yellow-500" size={32} />
                      </motion.div>
                      <Trophy className="text-blue-500" size={48} />
                      <motion.div
                        animate={{ rotate: [10, -10, 10] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Star className="text-yellow-500 fill-yellow-500" size={32} />
                      </motion.div>
                    </div>

                    <motion.h2 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.3 }}
                      className="text-9xl font-black uppercase italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 leading-none"
                    >
                      SOLD
                    </motion.h2>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex flex-col items-center"
                    >
                      <p className="text-3xl font-bold text-white mb-8 tracking-tight">{lastSold.player.name}</p>
                      
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative bg-zinc-900 rounded-3xl p-8 px-16 border border-white/10">
                          <p className="text-xs font-black uppercase tracking-[0.3em] mb-3 text-blue-400">Acquired By</p>
                          <p className="text-5xl font-black uppercase tracking-tighter text-white mb-4">{lastSold.team.name}</p>
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
                          <p className="text-4xl font-mono font-black text-emerald-400">
                            ${lastSold.player.sold_price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 p-8">
                  <ShieldCheck className="text-blue-500/30" size={40} />
                </div>
                <div className="absolute bottom-0 right-0 p-8">
                  <Sparkles className="text-blue-500/30" size={40} />
                </div>
              </motion.div>
            ) : showStatus === 'unsold' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-800 rounded-[40px] p-12 text-center text-white relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <XCircle size={100} className="mx-auto mb-6 text-zinc-600" />
                </motion.div>
                <h2 className="text-8xl font-black uppercase italic tracking-tighter mb-4 text-zinc-600">UNSOLD</h2>
                <p className="text-2xl font-bold mb-8 text-zinc-500">Player returned to pool</p>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-24 backdrop-blur-xl text-center min-h-[500px] flex items-center justify-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <p className="text-zinc-600 font-bold uppercase tracking-widest">Waiting for next player...</p>
                </div>
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
