import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Team } from '../types';
import { Users, UserPlus, Trash2, Shield, Key, DollarSign, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    budget: 10000000,
    login_id: '',
    password: ''
  });

  useEffect(() => {
    fetchTeams();
    const sub = supabase
      .channel('teams-mgmt')
      .on('postgres_changes', { event: '*', table: 'teams', schema: 'public' }, () => fetchTeams())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (data) setTeams(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.owner || !formData.login_id || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from('teams').insert([
      {
        name: formData.name,
        owner: formData.owner,
        budget: formData.budget,
        remaining_budget: formData.budget,
        login_id: formData.login_id,
        password: formData.password
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      setFormData({
        name: '',
        owner: '',
        budget: 10000000,
        login_id: '',
        password: ''
      });
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Are you sure? This will delete the team and all its auction history.")) return;
    await supabase.from('teams').delete().eq('id', id);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="text-emerald-500" />
              Create New Squad
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Squad Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Mumbai Mavericks"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Owner Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="text"
                    value={formData.owner}
                    onChange={e => setFormData({...formData, owner: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Owner Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Initial Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="number"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: parseInt(e.target.value)})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Login Credentials</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text"
                      value={formData.login_id}
                      onChange={e => setFormData({...formData, login_id: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Login ID"
                    />
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Password"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl mt-4 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                Create Squad
              </button>
            </form>
          </div>
        </div>

        {/* Teams List */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-blue-500" />
              Registered Squads
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-zinc-800/30 border border-zinc-800 rounded-2xl p-6 group hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{team.name}</h3>
                      <p className="text-xs text-zinc-500">Owner: {team.owner}</p>
                    </div>
                    <button 
                      onClick={() => deleteTeam(team.id)}
                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Budget</p>
                      <p className="text-sm font-mono text-emerald-500">${team.budget.toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Login ID</p>
                      <p className="text-sm font-mono text-blue-500">{team.login_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-bold">
                    <Key size={10} />
                    Password: <span className="text-zinc-400">{team.password}</span>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-2 py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                  <Users size={48} className="mx-auto text-zinc-800 mb-4" />
                  <p className="text-zinc-600 font-medium">No squads registered yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
