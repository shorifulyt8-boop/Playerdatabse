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
    
    const team = teams.find(t => t.id === teamId);
    if (!team || team.remaining_budget < currentPlayer.base_price) {
      alert("Insufficient budget!");
      return;
    }

    const { error: playerError } = await supabase
      .from('players')
      .update({ 
        status: 'sold', 
        team_id: teamId, 
        sold_price: currentPlayer.base_price 
      })
      .eq('id', currentPlayer.id);

    const { error: teamError } = await supabase
      .from('teams')
      .update({ 
        remaining_budget: team.remaining_budget - currentPlayer.base_price 
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
                    <p className="text-2xl font-mono text-emerald-400">${currentPlayer.base_price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-4 flex gap-4 justify-center md:justify-start">
                  <button 
                    onClick={handleUnsold}
                    className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <XCircle size={18} />
                    Mark Unsold
                  </button>
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
