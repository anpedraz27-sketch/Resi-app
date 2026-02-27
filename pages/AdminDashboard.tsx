import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../components/ui/Toast';
import CalendarView from '../components/CalendarView';
import { Plus, Trash2, Edit2, Upload, Send, Save, Flame, Laptop, Waves, Coffee, Car, Dumbbell } from 'lucide-react';
import { Amenity } from '../types';
import { format } from 'date-fns';

interface AdminProps {
  activeSubTab: string;
}

const AdminDashboard: React.FC<AdminProps> = ({ activeSubTab }) => {
  const { amenities, bookings, notifications, settings, users, addAmenity, deleteAmenity, addNotification, updateSettings, importResidents, cancelBooking } = useStore();
  const { showToast } = useToast();

  // Internal forms state
  const [newAmenity, setNewAmenity] = useState({ name: '', capacity: 1, icon: 'Flame', description: '' });
  const [csvText, setCsvText] = useState('');
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [leadTime, setLeadTime] = useState(settings.bookingLeadTimeDays);

  // Icon Mapping for UI
  const iconMap: any = { Flame, Laptop, Waves, Coffee, Car, Dumbbell };

  const handleAddAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenity.name) return;
    await addAmenity(newAmenity);
    showToast('Amenity created successfully', 'success');
    setNewAmenity({ name: '', capacity: 1, icon: 'Flame', description: '' });
  };

  const handleImport = async () => {
    if (!csvText) return;
    const count = await importResidents(csvText);
    showToast(`Successfully imported ${count} residents`, 'success');
    setCsvText('');
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) return;
    await addNotification(announcement.title, announcement.message);
    showToast('Announcement sent to all residents', 'success');
    setAnnouncement({ title: '', message: '' });
  };

  const handleSaveSettings = async () => {
    await updateSettings({ bookingLeadTimeDays: leadTime });
    showToast('System settings updated', 'success');
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(id);
      showToast('Booking cancelled', 'success');
    }
  }

  // --- RENDER SECTIONS ---

  if (activeSubTab === 'dashboard') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Residents', val: users.filter(u => u.role === 'resident').length },
          { label: 'Active Amenities', val: amenities.length },
          { label: 'Upcoming Bookings', val: bookings.filter(b => b.status === 'confirmed').length },
          { label: 'Active Alerts', val: notifications.length }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-card shadow-soft">
            <p className="text-slate-500 text-sm font-medium tracking-wide">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.val}</p>
          </div>
        ))}

        {/* Quick Announcement */}
        <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-card shadow-soft">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Send Announcement</h3>
          <div className="space-y-4">
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Title"
              value={announcement.title}
              onChange={e => setAnnouncement({ ...announcement, title: e.target.value })}
            />
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none h-24"
              placeholder="Message to all residents..."
              value={announcement.message}
              onChange={e => setAnnouncement({ ...announcement, message: e.target.value })}
            />
            <button
              onClick={handleSendAnnouncement}
              className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-6 py-2 rounded-button font-medium flex items-center gap-2 transition-colors"
            >
              <Send size={18} /> Send Blast
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubTab === 'amenities') {
    return (
      <div className="space-y-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">Add New Space</h3>
          <form onSubmit={handleAddAmenity} className="grid gap-4 md:grid-cols-2 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1 uppercase">Name</label>
              <input
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                value={newAmenity.name}
                onChange={e => setNewAmenity({ ...newAmenity, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 uppercase">Capacity</label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                value={newAmenity.capacity}
                onChange={e => setNewAmenity({ ...newAmenity, capacity: parseInt(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1 uppercase">Icon</label>
              <div className="flex gap-2">
                {Object.keys(iconMap).map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewAmenity({ ...newAmenity, icon: iconName })}
                    className={`p-3 rounded-lg border ${newAmenity.icon === iconName ? 'bg-sky-500 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    {React.createElement(iconMap[iconName], { size: 20 })}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="md:col-span-2 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
              <Plus size={18} /> Create Amenity
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {amenities.map(am => {
            const Icon = iconMap[am.icon] || Flame;
            return (
              <div key={am.id} className="bg-white border border-slate-100 p-6 rounded-card shadow-soft relative group">
                <button
                  onClick={() => { deleteAmenity(am.id); showToast('Amenity deleted', 'info'); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
                  <Icon size={24} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">{am.name}</h4>
                <p className="text-slate-500 text-sm mt-1">{am.description || 'No description provided.'}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Max Capacity: {am.capacity} people</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeSubTab === 'residents') {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
          <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
            <Upload size={20} className="text-sky-500" /> Bulk Import
          </h3>
          <p className="text-sm text-slate-400 mb-4">Paste CSV data: <code className="bg-slate-950 px-1 rounded">Name, Unit, Email</code></p>
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-48 font-mono text-sm"
            placeholder="John Doe, 101, john@example.com&#10;Jane Smith, 102, jane@example.com"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
          <button
            onClick={handleImport}
            className="w-full mt-4 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-lg font-medium"
          >
            Import Residents
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Resident Directory</h3>
          </div>
          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {users.filter(u => u.role === 'resident').map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50">
                <div>
                  <p className="text-white font-medium">{r.fullName}</p>
                  <p className="text-sm text-slate-500">{r.email}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                  Unit {r.unitNumber}
                </div>
              </div>
            ))}
            {users.filter(u => u.role === 'resident').length === 0 && (
              <div className="p-8 text-center text-slate-500">No residents found.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeSubTab === 'bookings') {
    return (
      <div className="space-y-6">
        <CalendarView bookings={bookings} />

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-semibold text-white">All Active Bookings</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {bookings.filter(b => b.status === 'confirmed').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(b => {
              const amenity = amenities.find(a => a.id === b.amenityId);
              const resident = users.find(u => u.id === b.userId);
              return (
                <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-sky-900/30 text-sky-500 flex items-center justify-center font-bold">
                      {format(new Date(b.date), 'dd')}
                    </div>
                    <div>
                      <p className="text-white font-medium">{amenity?.name}</p>
                      <p className="text-sm text-slate-400">
                        {b.startTime} - {b.endTime} • {resident?.fullName} (Unit {resident?.unitNumber})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBooking(b.id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2 rounded border border-red-900/50 hover:bg-red-900/20 transition-colors"
                  >
                    Cancel Booking
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (activeSubTab === 'settings') {
    return (
      <div className="max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <SettingsIcon /> Global Configuration
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Booking Lead Time (Anticipation)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Minimum number of days in advance a resident must book a space.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  value={leadTime}
                  onChange={(e) => setLeadTime(parseInt(e.target.value))}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center"
                />
                <span className="text-slate-400">Days</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleSaveSettings}
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null;
};

const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
export default AdminDashboard;