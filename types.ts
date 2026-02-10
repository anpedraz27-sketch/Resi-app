export type UserRole = 'admin' | 'resident';

export interface User {
  id: string;
  email: string;
  fullName: string;
  unitNumber?: string;
  role: UserRole;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  capacity: number;
  icon: string; // Lucide icon name
}

export interface Booking {
  id: string;
  userId: string;
  amenityId: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'confirmed' | 'cancelled';
  user?: User; // Joined data
  amenity?: Amenity; // Joined data
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface AppSettings {
  bookingLeadTimeDays: number;
}
