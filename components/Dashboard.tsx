
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, ChevronRight, LogIn, LogOut, User as UserIcon, CloudSync } from 'lucide-react';
import { useTrips } from '../store';

export const Dashboard: React.FC<{ onNavigate: (view: 'itinerary') => void }> = ({ onNavigate }) => {
  const { state, addTrip, deleteTrip, setActiveTrip, user, login, logout } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '', coverImage: '' });

  const calculateDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) return;
    addTrip({
      title: formData.title,
      startDate: formData.startDate,
      endDate: formData.endDate,
      coverImage: formData.coverImage || `https://picsum.photos/seed/${formData.title}/800/400`
    });
    setIsModalOpen(false);
    setFormData({ title: '', startDate: '', endDate: '', coverImage: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">My Journeys</h2>
          <p className="text-white/60">Start planning your next adventure</p>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 p-2 pr-4 rounded-full border border-white/10">
              <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full" />
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Synced</p>
                <p className="text-[10px] font-bold text-white/40">{user.email}</p>
              </div>
              <button onClick={logout} className="p-2 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-black text-xs rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <LogIn size={14} /> SIGN IN TO SYNC
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.trips.map((trip) => {
          const daysLeft = calculateDaysLeft(trip.startDate);
          return (
            <motion.div
              key={trip.id}
              whileHover={{ y: -5 }}
              className="bg-[#2C2C2E] rounded-3xl overflow-hidden group border border-[#38383A] transition-all hover:border-[#D4AF37]/30 shadow-sm"
            >
              <div className="relative h-48">
                <img src={trip.coverImage} className="w-full h-full object-cover" alt={trip.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                   {daysLeft > 0 ? `${daysLeft} days left` : 'On progress'}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{trip.title}</h3>
                <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
                  <Calendar size={14} />
                  <span>{trip.startDate} ~ {trip.endDate}</span>
                </div>

                <button 
                  onClick={() => { setActiveTrip(trip.id); onNavigate('itinerary'); }}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors font-semibold group"
                >
                  View Itinerary <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          );
        })}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-[#38383A] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all rounded-3xl flex flex-col items-center justify-center gap-3 min-h-[400px]"
        >
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
            <Plus size={24} />
          </div>
          <span className="font-semibold text-white/60">New Journey</span>
        </button>
      </div>

      {/* Create Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#2C2C2E] w-full max-w-md rounded-3xl p-8 border border-[#38383A]"
          >
            <h3 className="text-2xl font-bold mb-6">Create New Trip</h3>
            <form onSubmit={handleCreateTrip} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Trip Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. US 2026 Road Trip" 
                  className="w-full bg-[#3A3A3C] border border-[#48484A] rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#3A3A3C] border border-[#48484A] rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={formData.endDate} 
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#3A3A3C] border border-[#48484A] rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Cover Image URL</label>
                <input 
                  type="url" 
                  value={formData.coverImage} 
                  onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..." 
                  className="w-full bg-[#3A3A3C] border border-[#48484A] rounded-xl px-4 py-3 focus:border-[#D4AF37] outline-none text-white"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-[#3A3A3C] hover:bg-[#48484A] rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#D4AF37] text-black hover:opacity-90 rounded-xl font-bold transition-opacity"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
