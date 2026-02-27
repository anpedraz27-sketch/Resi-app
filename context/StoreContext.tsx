import React, { createContext, useContext, useState, useEffect } from 'react';
import { Amenity, Booking, Notification, AppSettings, User } from '../types';
import { MOCK_AMENITIES, MOCK_BOOKINGS, MOCK_NOTIFICATIONS, MOCK_SETTINGS, MOCK_USERS } from '../mockData';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

interface StoreContextType {
  amenities: Amenity[];
  bookings: Booking[];
  notifications: Notification[];
  settings: AppSettings;
  users: User[];

  // Actions
  addAmenity: (amenity: Omit<Amenity, 'id'>) => Promise<void>;
  updateAmenity: (id: string, data: Partial<Amenity>) => Promise<void>;
  deleteAmenity: (id: string) => Promise<void>;

  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<{ success: boolean, error?: string }>;
  cancelBooking: (id: string) => Promise<void>;

  addNotification: (title: string, message: string) => Promise<void>;

  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  importResidents: (data: string) => Promise<number>; // Returns count of added
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const StoreProviderContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Local state acting as DB cache
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(MOCK_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch data when component mounts or user changes
  useEffect(() => {
    fetchAmenities();
    fetchUsers();
    fetchNotifications();

    // Only fetch bookings if we have a user (to avoid empty lists on first load)
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchAmenities = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      if (data) setAmenities(data as Amenity[]);
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      if (data) {
        setUsers(data.map((p: any) => ({
          id: p.id,
          email: '', // Not exposed in profiles table currently
          fullName: p.full_name || 'Unknown',
          role: p.role,
          unitNumber: p.apartment
        })));
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchBookings = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('bookings').select('*');
      if (error) throw error;
      if (data) {
        setBookings(data.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          amenityId: b.amenity_id,
          date: b.booking_date,
          startTime: b.start_time,
          endTime: b.end_time,
          status: b.status
        })));
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.content,
          createdAt: n.created_at,
          isRead: false
        })));
      }
    } catch (e) {
      console.error('Error fetching announcements:', e);
    }
  };

  const addAmenity = async (data: Omit<Amenity, 'id'>) => {
    try {
      if (!supabase) {
        // Fallback for demo/no-connection
        const newAmenity: Amenity = { ...data, id: `am-${Date.now()}` };
        setAmenities(prev => [...prev, newAmenity]);
        return;
      }

      const { data: created, error } = await supabase
        .from('amenities')
        .insert([{
          name: data.name,
          capacity: data.capacity,
          icon: data.icon,
          description: data.description,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      if (created) setAmenities(prev => [...prev, created as Amenity]);
    } catch (error) {
      console.error('Error adding amenity:', error);
      throw error;
    }
  };

  const updateAmenity = async (id: string, data: Partial<Amenity>) => {
    // TODO: Implement update in Supabase
    setAmenities(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAmenity = async (id: string) => {
    try {
      if (!supabase) {
        setAmenities(prev => prev.filter(a => a.id !== id));
        return;
      }

      // Soft delete or hard delete? Schema has is_active but let's hard delete for now to match UI
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAmenities(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting amenity:', error);
    }
  };

  const addBooking = async (data: Omit<Booking, 'id' | 'status'>): Promise<{ success: boolean, error?: string }> => {
    try {
      if (!supabase) {
        const newBooking: Booking = {
          ...data,
          id: `bk-${Date.now()}`,
          status: 'confirmed',
        };
        setBookings(prev => [...prev, newBooking]);
        return { success: true };
      }

      const { data: created, error } = await supabase
        .from('bookings')
        .insert([{
          user_id: data.userId,
          amenity_id: data.amenityId,
          booking_date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          status: 'confirmed'
        }])
        .select()
        .single();

      if (error) throw error;
      if (created) {
        setBookings(prev => [...prev, {
          id: created.id,
          userId: created.user_id,
          amenityId: created.amenity_id,
          date: created.booking_date,
          startTime: created.start_time,
          endTime: created.end_time,
          status: created.status
        }]);
        return { success: true };
      }
      return { success: false, error: "No data returned from DB" };
    } catch (e: any) {
      console.error('Error adding booking:', e);
      return { success: false, error: e.message || "Unknown error" };
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      if (!supabase) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (e) {
      console.error('Error cancelling booking:', e);
    }
  };

  const addNotification = async (title: string, message: string) => {
    try {
      if (!supabase) {
        const newNotif: Notification = {
          id: `not-${Date.now()}`,
          title,
          message,
          createdAt: new Date().toISOString(),
          isRead: false
        };
        setNotifications(prev => [newNotif, ...prev]);
        return;
      }

      const { data: created, error } = await supabase
        .from('announcements')
        .insert([{
          title,
          content: message,
          is_published: true
        }])
        .select()
        .single();

      if (error) throw error;
      if (created) {
        setNotifications(prev => [{
          id: created.id,
          title: created.title,
          message: created.content,
          createdAt: created.created_at,
          isRead: false
        }, ...prev]);
      }
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const importResidents = async (csvData: string): Promise<number> => {
    // Expected format: Name, Unit, Email
    const lines = csvData.split('\n');
    let count = 0;
    const newUsers: User[] = [];

    lines.forEach(line => {
      const [name, unit, email] = line.split(',').map(s => s.trim());
      if (name && email) {
        newUsers.push({
          id: `res-${Date.now()}-${count}`,
          fullName: name,
          unitNumber: unit,
          email: email,
          role: 'resident'
        });
        count++;
      }
    });

    setUsers(prev => [...prev, ...newUsers]);
    return count;
  };

  return (
    <StoreContext.Provider value={{
      amenities,
      bookings,
      notifications,
      settings,
      users,
      addAmenity,
      updateAmenity,
      deleteAmenity,
      addBooking,
      cancelBooking,
      addNotification,
      updateSettings,
      importResidents
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StoreProviderContent>
      {children}
    </StoreProviderContent>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
