// Bilingual copy for the marketing landing, ported from the legacy static site's
// i18n.js. Selected by the shared `washee.lang` (see lib/i18n). The two strings
// that carried inline brand markup (hero title, live ticker) are split into
// parts here so they render as real JSX instead of dangerouslySetInnerHTML.

export type Lang = 'en' | 'vi';

const en = {
  nav_how: 'How it works',
  nav_tracking: 'Live tracking',
  nav_tiers: 'Wash tiers',
  nav_washers: 'For washers',
  nav_signin: 'Sign in',
  cta_book: 'Book a wash',

  hero_eyebrow: 'On-demand car wash',
  hero_title1: 'Your car,',
  hero_title2_em: 'washed',
  hero_title2_rest: ' where it stands',
  hero_sub:
    'Book in 30 seconds. A vetted pro comes to you — driveway, office lot, or curbside. Track every minute, pay cashless, drive off shining.',
  cta_how: 'See how it works',
  book_location_l: 'Location',
  book_location_v: "Where's your car?",
  book_vehicle_l: 'Vehicle',
  book_vehicle_v: 'Add your car',
  book_wash_l: 'Wash',
  book_wash_v: 'Glow',
  book_find: 'Find a washer',
  hero_ticker_pre: 'Live now: ',
  hero_ticker_strong: '312 washers',
  hero_ticker_post: ' active near you',
  hero_scroll: 'Scroll',

  mq_washes: '1.2M+ washes',
  mq_cities: '38 cities',
  mq_rating: '4.9★ average',
  mq_washers: '12k vetted washers',
  mq_cashless: 'Cashless',
  mq_gps: 'Live GPS tracking',

  how_eyebrow: 'How it works',
  how_title: 'Three taps to a spotless car',
  how_lead:
    'No bucket, no hose, no standing around. washee routes a pro to wherever your car is parked.',
  step1_title: 'Drop your pin',
  step1_body: 'Set where the car is and pick your vehicle. We match the nearest available washer in minutes.',
  step2_title: 'A pro rolls up',
  step2_body: 'Your washer arrives with their own water and power. Watch them approach, live, on the map.',
  step3_title: 'Drive off shining',
  step3_body: 'Foam, rinse, shine — done. Payment happens automatically. Rate and rebook in one tap.',

  track_eyebrow: 'Real-time',
  track_title: 'See your washer arrive, to the minute',
  track_lead:
    'From booked to brilliant — every step lives on your map. No guessing, no waiting windows, no phone tag.',
  track_li1: 'Live GPS location & ETA',
  track_li2: 'Status updates at every stage',
  track_li3: 'Message your washer in-app',
  track_cta: 'Get the app',
  track_meta: '4.9★ · 1,204 washes',
  track_eta_unit: 'min away',
  track_feed1: 'Washer assigned',
  track_feed2: 'On the way to you',
  track_feed3: 'Starting exterior wash',
  track_panel_aria:
    'App preview: a washer en route to your car with live ETA and status updates',

  tiers_eyebrow: 'Wash tiers',
  tiers_title: 'Pick your shine',
  tiers_lead:
    'Two ways to glow. Both are a swirl-free premium hand wash with our eco-friendly “proper wash” method — done wherever your car stands.',
  glow_desc: 'A premium hand wash — swirl-free, gentle yet effective. The everyday shine.',
  tier_per: '· per wash',
  glow_f1: 'Full hand wash — our “proper wash” method',
  glow_f2: 'Swirl-free towel dry',
  glow_f3: 'Wheel cleaning',
  glow_f4: 'Streak-free glass',
  glow_f5: 'Tire shine',
  glow_cta: 'Book Glow',
  plus_badge: '3-month protection',
  plus_desc: 'Everything in Glow, then sealed. A ceramic layer that keeps it shining for months.',
  plus_f1: 'Everything in Glow',
  plus_f2: 'Ceramic sealant coating',
  plus_f3: '3 months of protection',
  plus_f4: 'Deeper gloss & water beading',
  plus_cta: 'Book Glow Plus',

  stat1_label: 'Washes done',
  stat2_label: 'Average rating',
  stat3_label: 'Cities live',
  stat4_label: 'Vetted washers',

  quotes_eyebrow: 'Loved by drivers',
  quotes_title: 'Booked at 8. Spotless by 8:40',
  quote1:
    '"Booked from my desk, came down at lunch and the car looked showroom-new. Didn\'t lift a finger."',
  quote1_loc: 'San Diego',
  quote2:
    '"The live tracking is the best part — I watched Minh roll up, exactly when the app said. No waiting around."',
  quote2_loc: 'Austin',
  quote3: '"Glow Plus keeps the shine for months — rain just beads right off. Worth every đồng."',
  quote3_loc: 'Seattle',

  app_eyebrow: 'The app',
  app_title: 'The whole wash, in your pocket',
  app_lead: 'Book, track, pay, and rebook in a few taps. Save your cars and your favorite washers.',
  store_small1: 'Download on the',
  store_small2: 'Get it on',
  app_phone_eta: 'min away',
  app_phone_note: 'Minh is on the way',
  sms_ph: 'Your phone number',
  sms_btn: 'Text me the link',

  washers_eyebrow: 'For washers',
  washers_title: 'Got a sponge and a hustle?',
  washers_lead:
    'Wash on your schedule, earn on your terms. Jobs route straight to you, payouts hit instantly.',
  washers_stat_label: 'top washers / week',
  washers_cta: 'Apply to wash',

  final_title: 'Spotless is one tap away',

  foot_tagline: 'Your car, washed where it stands.',
  foot_product: 'Product',
  foot_company: 'Company',
  foot_legal: 'Legal',
  foot_about: 'About',
  foot_become: 'Become a washer',
  foot_careers: 'Careers',
  foot_support: 'Support',
  foot_privacy: 'Privacy',
  foot_terms: 'Terms',
  foot_cookies: 'Cookies',
  foot_rights: '© 2026 washee, Inc. All rights reserved.',
};

const vi: typeof en = {
  nav_how: 'Cách hoạt động',
  nav_tracking: 'Theo dõi trực tiếp',
  nav_tiers: 'Gói rửa xe',
  nav_washers: 'Dành cho thợ rửa',
  nav_signin: 'Đăng nhập',
  cta_book: 'Đặt lịch rửa xe',

  hero_eyebrow: 'Rửa xe theo yêu cầu',
  hero_title1: 'Xe của bạn,',
  hero_title2_em: 'rửa sạch',
  hero_title2_rest: ' ngay tại chỗ',
  hero_sub:
    'Đặt lịch trong 30 giây. Thợ rửa được kiểm định đến tận nơi — sân nhà, bãi đỗ công ty hay lề đường. Theo dõi từng phút, thanh toán không tiền mặt, lái đi bóng loáng.',
  cta_how: 'Xem cách hoạt động',
  book_location_l: 'Vị trí',
  book_location_v: 'Xe bạn ở đâu?',
  book_vehicle_l: 'Xe',
  book_vehicle_v: 'Thêm xe của bạn',
  book_wash_l: 'Gói',
  book_wash_v: 'Glow',
  book_find: 'Tìm thợ rửa',
  hero_ticker_pre: 'Đang hoạt động: ',
  hero_ticker_strong: '312 thợ rửa',
  hero_ticker_post: ' gần bạn',
  hero_scroll: 'Cuộn xuống',

  mq_washes: '1.2 triệu+ lượt rửa',
  mq_cities: '38 thành phố',
  mq_rating: '4.9★ trung bình',
  mq_washers: '12k thợ đã kiểm định',
  mq_cashless: 'Không tiền mặt',
  mq_gps: 'Định vị GPS trực tiếp',

  how_eyebrow: 'Cách hoạt động',
  how_title: 'Ba chạm là xe sạch bong',
  how_lead: 'Không xô, không vòi, không phải chờ đợi. washee điều thợ đến ngay nơi bạn đỗ xe.',
  step1_title: 'Ghim vị trí',
  step1_body: 'Chọn nơi đỗ xe và loại xe của bạn. Chúng tôi ghép thợ gần nhất chỉ trong vài phút.',
  step2_title: 'Thợ đến tận nơi',
  step2_body: 'Thợ mang theo nước và thiết bị riêng. Theo dõi họ đến gần, trực tiếp trên bản đồ.',
  step3_title: 'Lái đi bóng loáng',
  step3_body: 'Tạo bọt, xả sạch, đánh bóng — xong. Thanh toán tự động. Đánh giá và đặt lại chỉ với một chạm.',

  track_eyebrow: 'Thời gian thực',
  track_title: 'Xem thợ đến, chính xác đến từng phút',
  track_lead:
    'Từ lúc đặt đến khi xe sáng bóng — mọi bước đều hiện trên bản đồ. Không phải đoán, không phải chờ, không gọi qua gọi lại.',
  track_li1: 'Vị trí GPS & thời gian đến trực tiếp',
  track_li2: 'Cập nhật trạng thái ở mỗi bước',
  track_li3: 'Nhắn tin với thợ ngay trong ứng dụng',
  track_cta: 'Tải ứng dụng',
  track_meta: '4.9★ · 1.204 lượt rửa',
  track_eta_unit: 'phút nữa',
  track_feed1: 'Đã ghép thợ',
  track_feed2: 'Đang đến chỗ bạn',
  track_feed3: 'Bắt đầu rửa ngoại thất',
  track_panel_aria:
    'Xem trước ứng dụng: thợ đang trên đường đến xe bạn cùng thời gian đến và cập nhật trạng thái trực tiếp',

  tiers_eyebrow: 'Gói rửa xe',
  tiers_title: 'Chọn độ bóng của bạn',
  tiers_lead:
    'Hai cách để xe bóng loáng. Cả hai đều là dịch vụ rửa tay cao cấp không xước, theo phương pháp “rửa chuẩn” thân thiện môi trường — ngay tại nơi bạn đỗ xe.',
  glow_desc: 'Rửa tay cao cấp — không xước, nhẹ nhàng mà hiệu quả. Độ bóng cho mỗi ngày.',
  tier_per: '· mỗi lần rửa',
  glow_f1: 'Rửa tay toàn bộ — theo phương pháp “rửa chuẩn”',
  glow_f2: 'Lau khô không xước',
  glow_f3: 'Vệ sinh mâm xe',
  glow_f4: 'Kính không vệt',
  glow_f5: 'Đánh bóng lốp',
  glow_cta: 'Đặt gói Glow',
  plus_badge: 'Bảo vệ 3 tháng',
  plus_desc: 'Tất cả của Glow, rồi phủ bảo vệ. Lớp ceramic giữ xe bóng suốt nhiều tháng.',
  plus_f1: 'Tất cả trong gói Glow',
  plus_f2: 'Phủ ceramic bảo vệ',
  plus_f3: 'Bảo vệ trong 3 tháng',
  plus_f4: 'Bóng sâu hơn & chống bám nước',
  plus_cta: 'Đặt gói Glow Plus',

  stat1_label: 'Lượt rửa',
  stat2_label: 'Đánh giá trung bình',
  stat3_label: 'Thành phố',
  stat4_label: 'Thợ đã kiểm định',

  quotes_eyebrow: 'Được tài xế yêu thích',
  quotes_title: 'Đặt lúc 8h, sạch bong lúc 8h40',
  quote1:
    '“Đặt ngay tại bàn làm việc, ra xem giờ trưa là xe như mới xuất xưởng. Không phải động tay.”',
  quote1_loc: 'San Diego',
  quote2:
    '“Theo dõi trực tiếp là hay nhất — tôi thấy Minh đến đúng như ứng dụng báo. Không phải chờ đợi.”',
  quote2_loc: 'Austin',
  quote3: '“Glow Plus giữ độ bóng suốt nhiều tháng — mưa trôi tuột đi. Đáng từng đồng.”',
  quote3_loc: 'Seattle',

  app_eyebrow: 'Ứng dụng',
  app_title: 'Cả dịch vụ rửa xe, gọn trong túi bạn',
  app_lead: 'Đặt lịch, theo dõi, thanh toán và đặt lại chỉ với vài chạm. Lưu xe và thợ yêu thích của bạn.',
  store_small1: 'Tải trên',
  store_small2: 'Tải trên',
  app_phone_eta: 'phút nữa',
  app_phone_note: 'Minh đang trên đường',
  sms_ph: 'Số điện thoại của bạn',
  sms_btn: 'Gửi link cho tôi',

  washers_eyebrow: 'Dành cho thợ rửa',
  washers_title: 'Có đam mê và tay nghề?',
  washers_lead:
    'Rửa theo lịch của bạn, thu nhập theo cách của bạn. Việc đến thẳng tay bạn, nhận tiền tức thì.',
  washers_stat_label: 'thợ hàng đầu / tuần',
  washers_cta: 'Đăng ký làm thợ',

  final_title: 'Sạch bong chỉ cách một chạm',

  foot_tagline: 'Xe của bạn, rửa sạch ngay tại chỗ.',
  foot_product: 'Sản phẩm',
  foot_company: 'Công ty',
  foot_legal: 'Pháp lý',
  foot_about: 'Giới thiệu',
  foot_become: 'Trở thành thợ rửa',
  foot_careers: 'Tuyển dụng',
  foot_support: 'Hỗ trợ',
  foot_privacy: 'Bảo mật',
  foot_terms: 'Điều khoản',
  foot_cookies: 'Cookie',
  foot_rights: '© 2026 washee, Inc. Bảo lưu mọi quyền.',
};

export type LandingCopy = typeof en;
export const LANDING: Record<Lang, LandingCopy> = { en, vi };

// Tier prices carry both currencies (USD is an approximate convenience rate).
export const TIER_PRICE = {
  glow: { vnd: '250k₫', usd: '$10' },
  plus: { vnd: '400k₫', usd: '$16' },
} as const;
