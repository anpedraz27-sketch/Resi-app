import { Amenity, Booking, Notification, User, AppSettings } from './types';
import { addDays, format } from 'date-fns';

export const MOCK_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@edificio.com',
    fullName: 'Building Manager',
    role: 'admin',
  },
  {
    id: 'res-1',
    email: 'vecino@edificio.com',
    fullName: 'Juan Perez',
    unitNumber: '4B',
    role: 'resident',
  },
  {
    id: 'res-2',
    email: 'maria@edificio.com',
    fullName: 'Maria Garcia',
    unitNumber: '2A',
    role: 'resident',
  }
];

export const MOCK_AMENITIES: Amenity[] = [
  {
    id: 'am-1',
    name: 'Roof Garden / Grill',
    description: 'Shared BBQ area with city views.',
    capacity: 10,
    icon: 'Flame',
  },
  {
    id: 'am-2',
    name: 'Coworking Space',
    description: 'Quiet area with high-speed wifi.',
    capacity: 5,
    icon: 'Laptop',
  },
  {
    id: 'am-3',
    name: 'Swimming Pool',
    description: 'Heated indoor pool.',
    capacity: 8,
    icon: 'Waves',
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    userId: 'res-1',
    amenityId: 'am-2',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '12:00',
    status: 'confirmed',
  },
  {
    id: 'bk-2',
    userId: 'res-2',
    amenityId: 'am-1',
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '22:00',
    status: 'confirmed',
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'not-1',
    title: 'Water Maintenance',
    message: 'Water will be cut off tomorrow from 2pm to 4pm for maintenance.',
    createdAt: new Date().toISOString(),
    isRead: false,
  }
];

export const MOCK_SETTINGS: AppSettings = {
  bookingLeadTimeDays: 1,
};
