import React, { createContext, useContext, useState, useEffect } from 'react';
import { Amenity, Booking, Notification, AppSettings, User } from '../types';
import { MOCK_AMENITIES, MOCK_BOOKINGS, MOCK_NOTIFICATIONS, MOCK_SETTINGS, MOCK_USERS } from '../mockData';
import { useAuth } from './AuthContext';

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
  const [amenities, setAmenities] = useState<Amenity[]>(MOCK_AMENITIES);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = useState<AppSettings>(MOCK_SETTINGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // In a real app, useEffect here would fetch initial data from Supabase
  
  const addAmenity = async (data: Omit<Amenity, 'id'>) => {
    const newAmenity: Amenity = { ...data, id: `am-${Date.now()}` };
    setAmenities(prev => [...prev, newAmenity]);
  };

  const updateAmenity = async (id: string, data: Partial<Amenity>) => {
    setAmenities(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAmenity = async (id: string) => {
    setAmenities(prev => prev.filter(a => a.id !== id));
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
