// Shared API contract (mirrors backend v1 /api). Kept in sync with the Go DTOs.

export type LocationShortcut = 'home' | 'work' | 'coffee' | 'other';

export interface User {
  id: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy?: string | null;
  preferredLang: 'en' | 'vi';
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
  status: 'available' | 'booked' | 'blocked';
  driverId?: string; // admin schedule view only
  driverName?: string; // admin schedule view only
}

// ---- wash packages / car types ----

export interface CarType {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
}

export interface PackagePrice {
  carTypeId: string;
  carTypeKey: string;
  carTypeName: string;
  priceVnd: number;
}

export interface WashPackage {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  prices: PackagePrice[];
  eligibleDriverCount: number;
  createdAt: string;
  updatedAt: string;
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
  phone: string;
  packageId: string;
  carTypeId: string;
  couponId?: string;
}

export interface ReviewSummary {
  washRating: number;
  driverRating: number;
  comment: string;
}

export interface ReviewRequest {
  washRating: number;
  driverRating: number;
  comment?: string;
}

export interface ReferralSummary {
  code: string;
  shareUrl: string;
  coupons: Coupon[];
}

// The assigned driver's aggregate rating, visible on every one of the
// customer's own bookings (never a general driver directory — dispatch is
// automatic, so there's nothing to browse).
export interface DriverRating {
  washAvg: number;
  driverAvg: number;
  count: number;
}

export interface Booking {
  id: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'awaiting_payment'
    | 'declined'
    | 'cancelled'
    | 'completed';
  slotId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  carLocationId: string;
  phoneNumber: string;
  driverId: string;
  driverName: string; // revealed after booking
  driverRating: DriverRating;
  packageId: string;
  packageTitle: string;
  carTypeId: string;
  carTypeName: string;
  couponId?: string | null;
  declineReason?: string | null; // set only when status is "declined"
  startedAt?: string | null; // set once the driver starts the job
  finishedAt?: string | null; // set once the driver finishes, awaiting payment
  review: ReviewSummary | null;
  createdAt: string;
}

// One message in a booking's chat thread (customer <-> assigned driver).
export interface ChatMessage {
  id: string;
  senderRole: 'customer' | 'driver';
  body: string;
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
  packageTitle: string;
  carTypeName: string;
  locationLabel: string;
  locationAddress: string;
  declineReason?: string | null;
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
  packageTitle: string;
  carTypeName: string;
  phoneNumber: string;
  locationLabel: string;
  locationAddress: string;
  declineReason?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
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
  avgWashRating: number;
  avgDriverRating: number;
  reviewCount: number;
  packageIds: string[];
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

// POST /api/admin/notifications receipt — devices targeted, provider accepts/rejects.
export interface AdminNotifyResult {
  devices: number;
  sent: number;
  failed: number;
}

// Standard error envelope: { error: { code, message, details? } }.
export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

// One row of the admin reviews list (GET /api/admin/reviews).
export interface AdminReviewRow {
  id: string;
  bookingId: string;
  driverName: string;
  customerEmail: string;
  washRating: number;
  driverRating: number;
  comment: string;
  createdAt: string;
}

// One row of the admin audit trail (GET /api/admin/audit-logs).
export interface AuditLogRow {
  id: string;
  occurredAt: string; // RFC3339
  actorType: 'admin' | 'driver' | 'user' | 'system';
  actorId?: string | null;
  actorLabel?: string | null;
  action: string; // e.g. 'admin.driver_create', 'driver.slot_publish'
  entityType?: string | null;
  entityId?: string | null;
  detail: Record<string, unknown>;
  requestId?: string | null;
  ip?: string | null;
}
