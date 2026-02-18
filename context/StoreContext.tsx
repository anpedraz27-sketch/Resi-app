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

  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<void>;
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
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = useState<AppSettings>(MOCK_SETTINGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Fetch initial data from Supabase
  useEffect(() => {
    fetchAmenities();
  }, []);

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

  const addBooking = async (data: Omit<Booking, 'id' | 'status'>) => {
    const newBooking: Booking = {
      ...data,
      id: `bk-${Date.now()}`,
      status: 'confirmed',
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const cancelBooking = async (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const addNotification = async (title: string, message: string) => {
    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
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
