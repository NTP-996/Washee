import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'vi';

// Customer-facing app strings (auth / booking / profile). The marketing landing
// keeps its own separate dictionary; driver and admin surfaces stay English.
// Vietnamese copy is written for a friendly consumer car-wash voice, not
// machine-literal. Shares the `washee.lang` key with the legacy static site for
// a seamless carry-over.
const DICT = {
  en: {
    'nav.signin': 'Sign in',
    'nav.profile': 'Profile',
    'cta.book': 'Book a wash',
    'auth.login.title': 'Welcome back',
    'auth.signup.title': 'Create your account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.phone': 'Phone',
    'auth.referral': 'Referral code (optional)',
    'auth.login.submit': 'Sign in',
    'auth.signup.submit': 'Create account',
    'auth.toSignup': 'New to washee? Create an account',
    'auth.toLogin': 'Already have an account? Sign in',
    'auth.logout': 'Log out',
    'error.generic': 'Something went wrong',
    'booking.title': 'Book a wash',
    'booking.subtitle': 'Pick a day and time — a vetted pro comes to your car.',
    'booking.noLocation.pre': 'Add a car location in your',
    'booking.noLocation.link': 'profile',
    'booking.noLocation.post': 'first.',
    'booking.couponReady': 'referral coupon ready — applied when you confirm.',
    'booking.earn.pre': 'Earn 50% off:',
    'booking.earn.link': 'share your referral link',
    'booking.earn.post': "— you get a coupon after your friend's first wash.",
    'booking.selected': 'Selected',
    'booking.change': 'Change',
    'booking.carLocation': 'Car location',
    'booking.total': 'Total',
    'booking.confirm': 'Confirm booking',
    'booking.yourBookings': 'Your bookings',
    'booking.errBook': 'Could not book that slot',
    'booking.errCancel': 'Could not cancel that booking',
    'slots.title': 'Available times',
    'slots.empty1': 'No open times on this day.',
    'slots.empty2': 'Try another date.',
    'slots.select': 'Select',
    'slots.selected': 'Selected',
    'history.empty': 'No bookings yet.',
    'history.washer': 'Washer',
    'history.cancel': 'Cancel',
    'status.pending': 'Pending',
    'status.confirmed': 'Confirmed',
    'status.cancelled': 'Cancelled',
    'status.completed': 'Completed',
    'profile.title': 'Profile',
    'profile.language': 'Language',
    'auth.or': 'or',
    'auth.passkey': 'Face ID / passkey',
    'auth.google': 'Continue with Google',
    'auth.apple': 'Continue with Apple',
    'auth.passkeyFail': 'Passkey sign-in failed — try again or use your password.',
    'passkey.title': 'Passkeys',
    'passkey.subtitle':
      'Sign in with Face ID, fingerprint, or your device PIN — no password to type.',
    'passkey.add': 'Add a passkey',
    'passkey.none': 'No passkeys yet.',
    'passkey.remove': 'Remove',
    'passkey.unsupported': 'This device does not support passkeys.',
    'passkey.added': 'Passkey added.',
    'common.edit': 'Edit',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'account.title': 'Account',
    'account.editTitle': 'Edit account',
    'account.updateFailed': 'Failed to update',
    'referral.title': 'Your referral link',
    'referral.subtitle': "A friend's first wash earns you 50% off.",
    'referral.copy': 'Copy',
    'referral.copied': 'Copied',
    'referral.coupons': 'Coupons',
    'referral.empty': 'No coupons yet — share your link to earn one.',
    'coupon.available': 'Available',
    'coupon.redeemed': 'Redeemed',
    'coupon.expired': 'Expired',
    'loc.title': 'Saved car locations',
    'loc.add': '+ Add',
    'loc.empty': 'No saved locations yet.',
    'loc.default': 'Default',
    'loc.pin': 'Pin',
    'loc.label': 'Label',
    'loc.labelPlaceholder': 'Home, Office…',
    'loc.address': 'Address',
    'loc.latitude': 'Latitude',
    'loc.longitude': 'Longitude',
    'loc.useMy': 'Use my current location',
    'loc.geoFail': 'Could not read your current location',
    'loc.setDefault': 'Set as default (pinned)',
    'loc.tag': 'Quick-pick tag',
    'loc.none': 'None',
    'loc.addBtn': 'Add location',
    'loc.saveFail': 'Failed to save location',
    'shortcut.home': 'Home',
    'shortcut.work': 'Work',
    'shortcut.coffee': 'Coffee',
    'shortcut.other': 'Other',
  },
  vi: {
    'nav.signin': 'Đăng nhập',
    'nav.profile': 'Hồ sơ',
    'cta.book': 'Đặt lịch rửa xe',
    'auth.login.title': 'Chào mừng trở lại',
    'auth.signup.title': 'Tạo tài khoản',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.phone': 'Số điện thoại',
    'auth.referral': 'Mã giới thiệu (tùy chọn)',
    'auth.login.submit': 'Đăng nhập',
    'auth.signup.submit': 'Tạo tài khoản',
    'auth.toSignup': 'Chưa có tài khoản? Đăng ký',
    'auth.toLogin': 'Đã có tài khoản? Đăng nhập',
    'auth.logout': 'Đăng xuất',
    'error.generic': 'Đã có lỗi xảy ra',
    'booking.title': 'Đặt lịch rửa xe',
    'booking.subtitle': 'Chọn ngày và giờ — thợ rửa xe chuyên nghiệp sẽ đến tận nơi xe bạn đậu.',
    'booking.noLocation.pre': 'Hãy thêm vị trí xe trong',
    'booking.noLocation.link': 'hồ sơ',
    'booking.noLocation.post': 'của bạn trước nhé.',
    'booking.couponReady': '— phiếu giới thiệu của bạn đã sẵn sàng, sẽ áp dụng khi xác nhận.',
    'booking.earn.pre': 'Nhận ưu đãi giảm 50%:',
    'booking.earn.link': 'chia sẻ liên kết giới thiệu của bạn',
    'booking.earn.post':
      '— bạn sẽ nhận phiếu giảm giá sau lần rửa xe đầu tiên của người bạn giới thiệu.',
    'booking.selected': 'Đã chọn',
    'booking.change': 'Đổi',
    'booking.carLocation': 'Vị trí xe',
    'booking.total': 'Tổng cộng',
    'booking.confirm': 'Xác nhận đặt lịch',
    'booking.yourBookings': 'Lịch đã đặt của bạn',
    'booking.errBook': 'Không thể đặt khung giờ này',
    'booking.errCancel': 'Không thể hủy lịch này',
    'slots.title': 'Giờ còn trống',
    'slots.empty1': 'Ngày này không còn giờ trống.',
    'slots.empty2': 'Hãy thử ngày khác nhé.',
    'slots.select': 'Chọn',
    'slots.selected': 'Đã chọn',
    'history.empty': 'Bạn chưa có lịch đặt nào.',
    'history.washer': 'Thợ rửa xe',
    'history.cancel': 'Hủy',
    'status.pending': 'Chờ xác nhận',
    'status.confirmed': 'Đã xác nhận',
    'status.cancelled': 'Đã hủy',
    'status.completed': 'Hoàn tất',
    'profile.title': 'Hồ sơ',
    'profile.language': 'Ngôn ngữ',
    'auth.or': 'hoặc',
    'auth.passkey': 'Face ID / passkey',
    'auth.google': 'Tiếp tục với Google',
    'auth.apple': 'Tiếp tục với Apple',
    'auth.passkeyFail': 'Đăng nhập bằng passkey thất bại — thử lại hoặc dùng mật khẩu.',
    'passkey.title': 'Passkey',
    'passkey.subtitle':
      'Đăng nhập bằng Face ID, vân tay hoặc mã PIN của thiết bị — không cần nhập mật khẩu.',
    'passkey.add': 'Thêm passkey',
    'passkey.none': 'Chưa có passkey nào.',
    'passkey.remove': 'Xóa',
    'passkey.unsupported': 'Thiết bị này không hỗ trợ passkey.',
    'passkey.added': 'Đã thêm passkey.',
    'common.edit': 'Sửa',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'account.title': 'Tài khoản',
    'account.editTitle': 'Sửa tài khoản',
    'account.updateFailed': 'Cập nhật thất bại',
    'referral.title': 'Liên kết giới thiệu của bạn',
    'referral.subtitle': 'Bạn được giảm 50% khi người bạn giới thiệu rửa xe lần đầu.',
    'referral.copy': 'Sao chép',
    'referral.copied': 'Đã sao chép',
    'referral.coupons': 'Phiếu giảm giá',
    'referral.empty': 'Chưa có phiếu nào — chia sẻ liên kết để nhận nhé.',
    'coupon.available': 'Còn hiệu lực',
    'coupon.redeemed': 'Đã dùng',
    'coupon.expired': 'Hết hạn',
    'loc.title': 'Vị trí xe đã lưu',
    'loc.add': '+ Thêm',
    'loc.empty': 'Chưa có vị trí nào.',
    'loc.default': 'Mặc định',
    'loc.pin': 'Ghim',
    'loc.label': 'Tên gợi nhớ',
    'loc.labelPlaceholder': 'Nhà, Văn phòng…',
    'loc.address': 'Địa chỉ',
    'loc.latitude': 'Vĩ độ',
    'loc.longitude': 'Kinh độ',
    'loc.useMy': 'Dùng vị trí hiện tại của tôi',
    'loc.geoFail': 'Không thể đọc vị trí hiện tại của bạn',
    'loc.setDefault': 'Đặt làm mặc định (ghim)',
    'loc.tag': 'Thẻ chọn nhanh',
    'loc.none': 'Không dùng',
    'loc.addBtn': 'Thêm vị trí',
    'loc.saveFail': 'Không thể lưu vị trí',
    'shortcut.home': 'Nhà',
    'shortcut.work': 'Chỗ làm',
    'shortcut.coffee': 'Cà phê',
    'shortcut.other': 'Khác',
  },
} as const;

type Key = keyof (typeof DICT)['en'];

// Strings with insertions live here as typed template functions so word order
// can differ per language (e.g. "50% off" vs "Giảm 50%").
interface Templates {
  percentOff: (p: { percent: number }) => string;
  applyCoupon: (p: { percent: number }) => string;
  couponApplied: (p: { percent: number }) => string;
  bookingSuccess: (p: { date: string; time: string; driver: string }) => string;
  duration: (p: { minutes: number }) => string;
}

type TemplateKey = keyof Templates;

const TEMPLATES: Record<Lang, Templates> = {
  en: {
    percentOff: ({ percent }) => `${percent}% off`,
    applyCoupon: ({ percent }) => `Apply my ${percent}% off coupon`,
    couponApplied: ({ percent }) => `${percent}% referral coupon applied`,
    bookingSuccess: ({ date, time, driver }) =>
      `Booked ${date} at ${time} — ${driver} will come to your car.`,
    duration: ({ minutes }) => `${minutes}m`,
  },
  vi: {
    percentOff: ({ percent }) => `Giảm ${percent}%`,
    applyCoupon: ({ percent }) => `Dùng phiếu giảm ${percent}% của tôi`,
    couponApplied: ({ percent }) => `Đã áp dụng phiếu giới thiệu giảm ${percent}%`,
    bookingSuccess: ({ date, time, driver }) =>
      `Đã đặt lịch ${date} lúc ${time} — ${driver} sẽ đến tận nơi rửa xe cho bạn.`,
    duration: ({ minutes }) => `${minutes} phút`,
  },
};

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key) => string;
  tf: <K extends TemplateKey>(key: K, params: Parameters<Templates[K]>[0]) => string;
}

const I18nContext = createContext<I18n | null>(null);

function detectLang(): Lang {
  const stored = localStorage.getItem('washee.lang');
  if (stored === 'en' || stored === 'vi') return stored;
  return navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const setLang = useCallback((l: Lang): void => {
    localStorage.setItem('washee.lang', l);
    setLangState(l);
  }, []);
  const t = useCallback((key: Key): string => DICT[lang][key] ?? DICT.en[key], [lang]);
  const tf = useCallback(
    <K extends TemplateKey>(key: K, params: Parameters<Templates[K]>[0]): string => {
      const render = TEMPLATES[lang][key] as (p: Parameters<Templates[K]>[0]) => string;
      return render(params);
    },
    [lang],
  );
  const value = useMemo<I18n>(() => ({ lang, setLang, t, tf }), [lang, setLang, t, tf]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

// Compact EN · VI pill toggle; the active pill takes the brand gradient with
// dark on-accent text (never white on gradient). `onSelect` fires after the
// language is applied, for callers that also sync the account preference.
export function LangToggle({ onSelect }: { onSelect?: (l: Lang) => void }) {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Language / Ngôn ngữ">
      {(['en', 'vi'] as const).map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setLang(l);
              onSelect?.(l);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
              active
                ? 'border-transparent brand-gradient text-[color:var(--color-on-accent)]'
                : 'border-hairline text-muted hover:border-brand-to hover:text-ink'
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
