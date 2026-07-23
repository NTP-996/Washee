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
  driverId?: string; // admin schedule view only
  driverName?: string; // admin schedule view only
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

export interface ReferralSummary {
  code: string;
  shareUrl: string;
  coupons: Coupon[];
}

export interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  slotId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  carLocationId: string;
  phoneNumber: string;
  driverName: string; // revealed after booking
  couponId?: string | null;
  createdAt: string;
}

export interface AdminFeedItem {
  id: string;
  status: string;
  userEmail: string;
  phoneNumber: string;
  date: string;
  startTime: string;
  price: number;
  driverName: string;
  locationLabel: string;
  locationAddress: string;
  createdAt: string;
}

// ---- driver portal (the driver meta: drivers own their schedules) ----

export interface DriverAuthResult {
  accessToken: string;
  username: string;
  fullName: string;
}

export interface DriverJob {
  id: string;
  status: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  phoneNumber: string;
  locationLabel: string;
  locationAddress: string;
  createdAt: string;
}

export interface AdminDriver {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  status: 'active' | 'inactive';
  openSlots: number;
  bookedSlots: number;
  createdAt: string;
}

export interface AdminCustomer {
  id: string;
  email: string;
  phone: string;
  referralCode: string;
  bookingsCount: number;
  activeBookings: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminSettings {
  standardPriceVnd: number;
}

export interface AdminSettingsUpdateResult {
  standardPriceVnd: number;
  repricedSlots: number;
}

export interface AdminCoupon {
  id: string;
  ownerUserId: string;
  ownerEmail: string;
  discountPercent: number;
  status: 'available' | 'redeemed' | 'expired';
  createdAt: string;
  sourceBooking: { id: string; refereeEmail: string; slotDate: string; slotStartTime: string };
  redeemedAt: string | null;
  redeemedBooking: { id: string; slotDate: string; slotStartTime: string } | null;
  voidedByAdminUsername: string | null;
  voidReason: string | null;
}

export interface AdminCouponSummary {
  totalCreated: number;
  available: number;
  redeemed: number;
  expired: number;
}

export interface CompleteBookingResult {
  bookingId: string;
  status: string;
  couponIssued: boolean;
}

// Standard error envelope: { error: { code, message, details? } }.
export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
