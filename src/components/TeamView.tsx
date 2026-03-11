import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Player, Team } from '../types';
import { Download, Users, User, ChevronRight, FileText } from 'lucide-react';
import { generateSquadPDF, generateAllSquadsPDF } from '../lib/pdf';
import { cn } from '../lib/utils';

export default function TeamView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const playerSub = supabase
      .channel('players-team-view')
      .on('postgres_changes', { event: '*', table: 'players', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(playerSub);
    };
  }, []);

  const fetchData = async () => {
    const { data: teamsData } = await supabase.from('teams').select('*').order('name');
    const { data: playersData } = await supabase.from('players').select('*').eq('status', 'sold');
    
    if (teamsData) {
      setTeams(teamsData);
      if (!selectedTeamId && teamsData.length > 0) setSelectedTeamId(teamsData[0].id);
    }
    if (playersData) setPlayers(playersData);
    setLoading(false);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamPlayers = players.filter(p => p.team_id === selectedTeamId);

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Team List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="px-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Team</h3>
          <button
            onClick={() => generateAllSquadsPDF(teams, players)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl border border-zinc-700 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <FileText size={14} />
            Export All Squads
          </button>
        </div>
        <div className="space-y-2">
          {teams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
              selectedTeamId === team.id 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50"
            )}
          >
            <span className="font-bold">{team.name}</span>
            <ChevronRight size={16} className={cn("transition-transform", selectedTeamId === team.id && "rotate-90")} />
          </button>
        ))}
        </div>
      </div>

      {/* Squad View */}
      <div className="lg:col-span-3 space-y-6">
        {selectedTeam ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-black tracking-tight">{selectedTeam.name}</h2>
                <p className="text-zinc-500 font-medium">Owner: <span className="text-zinc-300">{selectedTeam.owner}</span></p>
                <div className="flex gap-4 mt-4">
                  <div className="bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Remaining Budget</p>
                    <p className="text-lg font-mono text-emerald-400">${selectedTeam.remaining_budget.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Squad Size</p>
                    <p className="text-lg font-mono text-blue-400">{teamPlayers.length}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => generateSquadPDF(selectedTeam, teamPlayers)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors self-start md:self-center"
              >
                <Download size={18} />
                Export Squad PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamPlayers.length > 0 ? (
                teamPlayers.map(player => (
                  <div key={player.id} className="flex items-center gap-4 p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden border border-zinc-600">
                      {player.image_url ? (
                        <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={20} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-200">{player.name}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{player.role_details || player.category}</p>
                        {player.contact_number && (
                          <>
                            <span className="text-[10px] text-zinc-700">•</span>
                            <p className="text-[10px] text-zinc-500 font-mono">{player.contact_number}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase font-bold">Sold For</p>
                      <p className="font-mono text-emerald-400">${player.sold_price?.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                  <Users size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-medium">No players bought yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Select a team to view their squad
          </div>
        )}
      </div>
    </div>
  );
}
