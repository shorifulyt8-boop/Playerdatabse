import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player, PlayerCategory } from '../types';
import { UserPlus, Upload, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle, Loader2, Download, FileText, Camera, X, Search, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { generateAllPlayersPDF } from '../lib/pdf';

export default function PlayerRegistration() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Single Player Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Batsman' as PlayerCategory,
    base_price: 0,
    contact_number: '',
    role_details: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Update Photo State
  const [searchNumber, setSearchNumber] = useState('');
  const [foundPlayer, setFoundPlayer] = useState<Player | null>(null);
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);
  const [updateImagePreview, setUpdateImagePreview] = useState<string | null>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [storageStatus, setStorageStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      // Try to list files instead of getting bucket metadata (which often requires admin rights)
      const { data, error } = await supabase.storage.from('player-images').list('', { limit: 1 });
      if (error) {
        console.error('Storage check error:', error);
        // If the error is "Bucket not found", then it's definitely a configuration issue
        if (error.message.includes('not found')) {
          setStorageStatus('error');
        } else {
          // For other errors (like RLS), we'll assume it's OK but might have upload issues
          setStorageStatus('ok'); 
        }
      } else {
        setStorageStatus('ok');
      }
    } catch (err) {
      setStorageStatus('ok'); // Fallback to ok to not block the UI
    }
  };

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.base_price <= 0) return;

    setIsSubmitting(true);
    let image_url = '';

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('player-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert(`Upload failed: ${uploadError.message}. Please ensure you have created a PUBLIC bucket named 'player-images' in Supabase Storage.`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('player-images')
            .getPublicUrl(filePath);
          image_url = publicUrl;
          console.log('Generated Public URL:', image_url);
        }
      }

      const { error } = await supabase.from('players').insert([
        { 
          name: formData.name, 
          category: formData.category, 
          base_price: formData.base_price,
          status: 'available',
          contact_number: formData.contact_number,
          role_details: formData.role_details,
          image_url: image_url || null
        }
      ]);

      if (!error) {
        setFormData({ name: '', category: 'Batsman', base_price: 0, contact_number: '', role_details: '' });
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
          status: 'available',
          contact_number: String(row.contact_number || row.Contact || ''),
          role_details: String(row.role_details || row.Role || '')
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
      { name: 'Virat Kohli', category: 'Batsman', base_price: 2000000, contact_number: '01700000000', role_details: 'Right Hand Batsman' },
      { name: 'Jasprit Bumrah', category: 'Bowler', base_price: 1500000, contact_number: '01800000000', role_details: 'Right Arm Fast' },
      { name: 'Hardik Pandya', category: 'All-rounder', base_price: 1800000, contact_number: '01900000000', role_details: 'Right Hand Bat, Fast' },
      { name: 'MS Dhoni', category: 'Wicket-keeper', base_price: 2000000, contact_number: '01600000000', role_details: 'Right Hand Bat, WK' },
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

  const handleSearchPlayer = () => {
    if (!searchNumber) return;
    const player = players.find(p => p.contact_number === searchNumber);
    if (player) {
      setFoundPlayer(player);
      setUpdateImagePreview(player.image_url || null);
    } else {
      alert("Player not found with this contact number.");
      setFoundPlayer(null);
    }
  };

  const handleUpdateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpdateImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!foundPlayer || !updateImageFile) return;

    setIsUpdatingPhoto(true);
    try {
      const fileExt = updateImageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-images')
        .upload(filePath, updateImageFile);

      if (uploadError) {
        alert(`Upload failed: ${uploadError.message}. Make sure the 'player-images' bucket exists and is public.`);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('player-images')
        .getPublicUrl(filePath);

      console.log('Updated Public URL:', publicUrl);

      const { error: updateError } = await supabase.from('players')
        .update({ image_url: publicUrl })
        .eq('id', foundPlayer.id);

      if (updateError) throw updateError;

      alert("Photo updated successfully!");
      setFoundPlayer(null);
      setSearchNumber('');
      setUpdateImageFile(null);
      setUpdateImagePreview(null);
      fetchPlayers();
    } catch (err) {
      console.error(err);
      alert("Error updating photo.");
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(listSearch.toLowerCase()) || 
    (p.contact_number && p.contact_number.includes(listSearch))
  );

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
            
            {storageStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-red-500">Storage Not Configured</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Please create a <b>PUBLIC</b> bucket named <code className="bg-zinc-800 px-1 rounded">player-images</code> in your Supabase Storage to enable photo uploads.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden group">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-zinc-600 group-hover:text-emerald-500 transition-colors" size={32} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <p className="text-[10px] text-zinc-500 text-center mt-2 font-bold uppercase tracking-wider">Player Photo</p>
                </div>
              </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. 01700000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Role Details</label>
                  <input
                    type="text"
                    value={formData.role_details}
                    onChange={e => setFormData({ ...formData, role_details: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. Right Hand Batsman"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {isSubmitting ? 'Registering...' : 'Register Player'}
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
            <p className="text-zinc-500 text-sm mb-6">Upload an Excel (.xlsx) or CSV file with columns: <b>name</b>, <b>category</b>, <b>base_price</b>, <b>contact_number</b>, <b>role_details</b>.</p>
            
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

          {/* Update Photo Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon className="text-blue-500" size={20} />
              Update Player Photo
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    value={searchNumber}
                    onChange={e => setSearchNumber(e.target.value)}
                    placeholder="Search by Contact Number"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearchPlayer}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
                >
                  Find
                </button>
              </div>

              {foundPlayer && (
                <div className="mt-6 p-6 bg-zinc-800/50 border border-zinc-700 rounded-2xl animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden border border-zinc-600">
                      {foundPlayer.image_url ? (
                        <img src={foundPlayer.image_url} alt={foundPlayer.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-zinc-500">{foundPlayer.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{foundPlayer.name}</p>
                      <p className="text-sm text-zinc-500 uppercase font-bold tracking-wider">{foundPlayer.category}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-32 h-32 rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center overflow-hidden group">
                      {updateImagePreview ? (
                        <img src={updateImagePreview} alt="Update Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-zinc-600 group-hover:text-blue-500 transition-colors" size={32} />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpdateImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={handleUpdatePhoto}
                      disabled={isUpdatingPhoto || !updateImageFile}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isUpdatingPhoto ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      {isUpdatingPhoto ? 'Updating...' : 'Update Photo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold">Registered Players</h3>
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-400">
                Total: {players.length}
              </span>
            </div>
            <button
              onClick={() => generateAllPlayersPDF(players)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl border border-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <FileText size={14} />
              Export All Players
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              placeholder="Search by name or contact number..."
              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-3 custom-scrollbar">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold overflow-hidden border border-zinc-700">
                      {player.image_url ? (
                        <img 
                          src={player.image_url} 
                          alt={player.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        player.name.charAt(0)
                      )}
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
