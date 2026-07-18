// Shared API contract (mirrors backend v1 /api). Kept in sync with the Go DTOs.

export type LocationShortcut = 'home' | 'work' | 'coffee' | 'other';

export interface User {
  id: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy?: string | null;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CarLocation {
  id: string;
  label: string;
  shortcut: LocationShortcut | null; // only ever set when isDefault is true
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface CalendarSlot {
  id: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  durationMinutes: number;
  price: number;
  status: 'available' | 'booked' | 'blocked';
}

export interface Coupon {
  id: string;
  discountPercent: number;
  status: 'available' | 'redeemed' | 'expired';
  createdAt: string;
}

export interface BookingRequest {
  slotId: string;
  carLocationId: string;
  couponId?: string;
}

// Standard error envelope: { error: { code, message, details? } }.
export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
