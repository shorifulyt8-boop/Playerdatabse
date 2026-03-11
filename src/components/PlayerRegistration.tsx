import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player, PlayerCategory } from '../types';
import { UserPlus, Upload, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

export default function PlayerRegistration() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Single Player Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Batsman' as PlayerCategory,
    base_price: 0,
  });

  useEffect(() => {
    fetchPlayers();
    
    const sub = supabase
      .channel('players-reg')
      .on('postgres_changes', { event: '*', table: 'players', schema: 'public' }, () => fetchPlayers())
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*').order('created_at', { ascending: false });
    if (data) setPlayers(data);
    setLoading(false);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.base_price <= 0) return;

    const { error } = await supabase.from('players').insert([
      { 
        name: formData.name, 
        category: formData.category, 
        base_price: formData.base_price,
        status: 'available'
      }
    ]);

    if (!error) {
      setFormData({ name: '', category: 'Batsman', base_price: 0 });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const playersToInsert = data.map(row => ({
          name: row.name || row.Name || row.PLAYER_NAME,
          category: (row.category || row.Category || 'Batsman') as PlayerCategory,
          base_price: Number(row.base_price || row.BasePrice || row.Price || 0),
          status: 'available'
        })).filter(p => p.name && p.base_price > 0);

        if (playersToInsert.length > 0) {
          const { error } = await supabase.from('players').insert(playersToInsert);
          if (error) throw error;
          alert(`Successfully imported ${playersToInsert.length} players!`);
        } else {
          alert("No valid player data found in the file. Ensure columns are named 'name', 'category', and 'base_price'.");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing file. Please check the format.");
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      { name: 'Virat Kohli', category: 'Batsman', base_price: 2000000 },
      { name: 'Jasprit Bumrah', category: 'Bowler', base_price: 1500000 },
      { name: 'Hardik Pandya', category: 'All-rounder', base_price: 1800000 },
      { name: 'MS Dhoni', category: 'Wicket-keeper', base_price: 2000000 },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, "Auction_Player_Template.xlsx");
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;
    await supabase.from('players').delete().eq('id', id);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Forms */}
        <div className="space-y-6">
          {/* Single Registration */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="text-emerald-500" />
              Single Player Registration
            </h3>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Player Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Virat Kohli"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as PlayerCategory })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    <option>Batsman</option>
                    <option>Bowler</option>
                    <option>All-rounder</option>
                    <option>Wicket-keeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Base Price</label>
                  <input
                    type="number"
                    value={formData.base_price || ''}
                    onChange={e => setFormData({ ...formData, base_price: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Register Player
              </button>
            </form>
          </div>

          {/* Bulk Registration */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="text-blue-500" />
                Bulk Registration
              </h3>
              <button 
                onClick={downloadTemplate}
                className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
              >
                <Download size={12} />
                Template
              </button>
            </div>
            <p className="text-zinc-500 text-sm mb-6">Upload an Excel (.xlsx) or CSV file with columns: <b>name</b>, <b>category</b>, <b>base_price</b>.</p>
            
            <label className={cn(
              "relative group cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl p-10 transition-all hover:border-blue-500/50 hover:bg-blue-500/5",
              isUploading && "opacity-50 pointer-events-none"
            )}>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              {isUploading ? (
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              ) : (
                <Upload className="text-zinc-600 group-hover:text-blue-500 mb-4 transition-colors" size={40} />
              )}
              <p className="font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {isUploading ? "Processing File..." : "Click to upload Excel/CSV"}
              </p>
              <p className="text-xs text-zinc-600 mt-2">Max file size: 5MB</p>
            </label>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Registered Players</h3>
            <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-400">
              Total: {players.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-3 custom-scrollbar">
            {players.length > 0 ? (
              players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{player.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{player.category}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="text-[10px] font-mono text-emerald-500">${player.base_price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      player.status === 'available' ? "bg-emerald-500/10 text-emerald-500" : 
                      player.status === 'sold' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-700 text-zinc-400"
                    )}>
                      {player.status}
                    </div>
                    <button
                      onClick={() => deletePlayer(player.id)}
                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-zinc-600">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>No players registered yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
