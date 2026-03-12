import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Player, Team } from '../types';
import { Trophy, Users, DollarSign, CheckCircle, XCircle, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AuctionDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customBid, setCustomBid] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    if (updateStatus) {
      const timer = setTimeout(() => setUpdateStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateStatus]);

  useEffect(() => {
    fetchInitialData();
    
    // Real-time subscriptions
    const playerSubscription = supabase
      .channel('players-all')
      .on('postgres_changes', { event: '*', table: 'players', schema: 'public' }, (payload) => {
        setPlayers(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.id === (payload.new as Player).id);
          if (index !== -1) {
            updated[index] = payload.new as Player;
          } else if (payload.eventType === 'INSERT') {
            updated.push(payload.new as Player);
          }
          return updated;
        });
      })
      .subscribe();

    const teamSubscription = supabase
      .channel('teams-all')
      .on('postgres_changes', { event: '*', table: 'teams', schema: 'public' }, (payload) => {
        setTeams(prev => {
          const updated = [...prev];
          const index = updated.findIndex(t => t.id === (payload.new as Team).id);
          if (index !== -1) {
            updated[index] = payload.new as Team;
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(teamSubscription);
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: playersData } = await supabase.from('players').select('*').order('name');
    const { data: teamsData } = await supabase.from('teams').select('*').order('name');
    
    if (playersData) setPlayers(playersData);
    if (teamsData) setTeams(teamsData);
    setLoading(false);
  };

  const availablePlayers = players.filter(p => p.status === 'available');
  const currentPlayer = availablePlayers[currentPlayerIndex];

  const handleSold = async (teamId: string) => {
    if (!currentPlayer) return;
    
    const finalPrice = currentPlayer.current_bid || currentPlayer.base_price;
    const team = teams.find(t => t.id === teamId);
    if (!team || team.remaining_budget < finalPrice) {
      alert("Insufficient budget!");
      return;
    }

    const { error: playerError } = await supabase
      .from('players')
      .update({ 
        status: 'sold', 
        team_id: teamId, 
        sold_price: finalPrice 
      })
      .eq('id', currentPlayer.id);

    const { error: teamError } = await supabase
      .from('teams')
      .update({ 
        remaining_budget: team.remaining_budget - finalPrice 
      })
      .eq('id', teamId);

    if (playerError || teamError) {
      console.error("Error updating auction:", playerError || teamError);
    } else {
      // Move to next player if available
      if (currentPlayerIndex >= availablePlayers.length - 1) {
        setCurrentPlayerIndex(0);
      }
    }
  };

  const handleIncreaseBid = async (amount: number) => {
    if (!currentPlayer) return;
    const currentPrice = currentPlayer.current_bid || currentPlayer.base_price;
    const newBid = currentPrice + amount;

    const { error } = await supabase
      .from('players')
      .update({ current_bid: newBid })
      .eq('id', currentPlayer.id);
    
    if (error) {
      console.error("Error increasing bid:", error);
      setUpdateStatus({ type: 'error', msg: 'Update failed' });
    } else {
      setUpdateStatus({ type: 'success', msg: `Bid increased to $${newBid.toLocaleString()}` });
    }
  };

  const handleCustomBid = async () => {
    if (!currentPlayer || !customBid) return;
    const newBid = parseInt(customBid);
    if (isNaN(newBid)) return;

    const { error } = await supabase
      .from('players')
      .update({ current_bid: newBid })
      .eq('id', currentPlayer.id);
    
    if (error) {
      console.error("Error setting custom bid:", error);
      setUpdateStatus({ type: 'error', msg: 'Update failed' });
    } else {
      setUpdateStatus({ type: 'success', msg: `Bid set to $${newBid.toLocaleString()}` });
      setCustomBid('');
    }
  };

  const handleResetBid = async () => {
    if (!currentPlayer) return;
    const { error } = await supabase
      .from('players')
      .update({ current_bid: currentPlayer.base_price })
      .eq('id', currentPlayer.id);
    
    if (error) {
      console.error("Error resetting bid:", error);
      setUpdateStatus({ type: 'error', msg: 'Reset failed' });
    } else {
      setUpdateStatus({ type: 'success', msg: 'Bid reset to base price' });
    }
  };

  const handleUnsold = async () => {
    if (!currentPlayer) return;
    await supabase
      .from('players')
      .update({ status: 'unsold' })
      .eq('id', currentPlayer.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Current Player Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Live Auction
            </h2>
            <div className="px-4 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium border border-emerald-500/20">
              {availablePlayers.length} Players Remaining
            </div>
          </div>

          {currentPlayer ? (
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-48 h-48 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700 relative">
                  {currentPlayer.image_url ? (
                    <img 
                      src={currentPlayer.image_url} 
                      alt={currentPlayer.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                      }}
                    />
                  ) : (
                    <User size={80} className="text-zinc-600" />
                  )}
                </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-4xl font-black tracking-tight">{currentPlayer.name}</h3>
                  <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm mt-1">{currentPlayer.category}</p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="bg-zinc-800/50 px-6 py-3 rounded-2xl border border-zinc-700">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Base Price</p>
                    <p className="text-2xl font-mono text-zinc-400">${currentPlayer.base_price.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
                    <p className="text-emerald-500 text-xs uppercase font-bold mb-1">Current Bid</p>
                    <p className="text-2xl font-mono text-emerald-400 font-black">
                      ${(currentPlayer.current_bid || currentPlayer.base_price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3 justify-center md:justify-start items-center">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleIncreaseBid(50000)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold transition-all"
                    >
                      +50K
                    </button>
                    <button 
                      onClick={() => handleIncreaseBid(100000)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold transition-all"
                    >
                      +100K
                    </button>
                    <button 
                      onClick={() => handleIncreaseBid(500000)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold transition-all"
                    >
                      +500K
                    </button>
                  </div>

                  <div className="h-8 w-px bg-zinc-800 mx-2" />

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">$</span>
                      <input 
                        type="number"
                        value={customBid}
                        onChange={(e) => setCustomBid(e.target.value)}
                        placeholder="Custom Bid"
                        className="w-36 pl-6 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleCustomBid}
                      className="px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase italic hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Set Bid
                    </button>
                  </div>

                  <div className="h-8 w-px bg-zinc-800 mx-2" />

                  <button 
                    onClick={handleResetBid}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold transition-all"
                  >
                    Reset
                  </button>
                  
                  <button 
                    onClick={handleUnsold}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <XCircle size={14} />
                    Unsold
                  </button>

                  {updateStatus && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "ml-auto px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest",
                        updateStatus.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {updateStatus.msg}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800 mb-4">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold">Auction Complete!</h3>
              <p className="text-zinc-400 mt-2">All players have been processed.</p>
            </div>
          )}
        </div>

        {/* Bidding Controls */}
        {currentPlayer && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="text-emerald-500" />
              Assign to Team
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleSold(team.id)}
                  disabled={team.remaining_budget < currentPlayer.base_price}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all group",
                    team.remaining_budget >= currentPlayer.base_price
                      ? "bg-zinc-800/30 border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                      : "bg-zinc-900/20 border-zinc-800 opacity-50 cursor-not-allowed"
                  )}
                >
                  <p className="font-bold text-zinc-200 group-hover:text-white transition-colors">{team.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">Budget: ${team.remaining_budget.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Team Standings */}
      <div className="space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm sticky top-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="text-blue-500" />
            Team Budgets
          </h3>
          <div className="space-y-4">
            {teams.map(team => {
              const playersCount = players.filter(p => p.team_id === team.id).length;
              const budgetPercent = (team.remaining_budget / team.budget) * 100;
              
              return (
                <div key={team.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold text-sm">{team.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{playersCount} Players Bought</p>
                    </div>
                    <p className="font-mono text-sm text-emerald-400">${team.remaining_budget.toLocaleString()}</p>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        budgetPercent > 50 ? "bg-emerald-500" : budgetPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${budgetPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
