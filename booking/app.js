/* washee /booking — reveal a form, then send phone + address to the ops Telegram group
 * via the /api/book serverless function. The bot token lives server-side (Vercel env) and
 * never touches the browser. Vanilla JS, no build step, mobile-first. Bilingual (EN / VI).
 *
 * Integrates with the landing page: language (washee.lang) and currency (washee.currency)
 * are shared via localStorage, and a tier CTA can pre-select a wash with ?tier=glow|plus. */
(() => {
  "use strict";

  // ---------- i18n ----------
  const I18N = {
    en: {
      htmlTitle: "washee — book a wash",
      eyebrow: "on-demand · comes to your car",
      titleLead: "Book a",
      titleAccent: "wash",
      sub: "A vetted pro comes to your car. Tap below, drop your phone & address, and we’ll call to confirm.",
      washPicked: "Your wash",
      start: "Book a wash",
      phoneLabel: "Phone number",
      addressLabel: "Address",
      addressPh: "House no., street, ward, district…",
      submit: "Confirm booking",
      sending: "Sending…",
      fineprint: "We’ll call to confirm the time · no payment now.",
      errPhoneEmpty: "Please enter a phone number.",
      errPhoneInvalid: "That phone number doesn’t look right.",
      errAddressEmpty: "Please enter an address.",
      okTitle: "Booking received",
      okNote: "We’ll call you shortly to confirm the time. Thanks!",
      again: "Book another wash",
      pillOk: "Success",
      pillWarn: "Heads up",
      sendFailTitle: "Couldn’t send booking",
      reachFailTitle: "Couldn’t reach the server",
      reachFailNote: "Network error — check your connection and try again.",
      tryAgain: "Please try again.",
      notConfigTitle: "Booking unavailable",
      notConfigNote: "Booking isn’t available right now — please try again shortly.",
    },
    vi: {
      htmlTitle: "washee — đặt lịch rửa xe",
      eyebrow: "theo yêu cầu · đến tận nơi",
      titleLead: "Đặt lịch",
      titleAccent: "rửa xe",
      sub: "Thợ rửa xe chuyên nghiệp đến tận nơi. Bấm nút bên dưới, để lại số điện thoại và địa chỉ, chúng tôi sẽ gọi xác nhận.",
      washPicked: "Gói bạn chọn",
      start: "Đặt lịch rửa xe",
      phoneLabel: "Số điện thoại",
      addressLabel: "Địa chỉ",
      addressPh: "Số nhà, đường, phường, quận…",
      submit: "Xác nhận đặt lịch",
      sending: "Đang gửi…",
      fineprint: "Chúng tôi sẽ gọi xác nhận thời gian · chưa cần thanh toán.",
      errPhoneEmpty: "Vui lòng nhập số điện thoại.",
      errPhoneInvalid: "Số điện thoại chưa hợp lệ.",
      errAddressEmpty: "Vui lòng nhập địa chỉ.",
      okTitle: "Đã nhận đặt lịch",
      okNote: "Chúng tôi sẽ sớm gọi lại để xác nhận thời gian. Cảm ơn bạn!",
      again: "Đặt lịch lần nữa",
      pillOk: "Thành công",
      pillWarn: "Lưu ý",
      sendFailTitle: "Không gửi được đặt lịch",
      reachFailTitle: "Không kết nối được máy chủ",
      reachFailNote: "Lỗi mạng — kiểm tra kết nối và thử lại.",
      tryAgain: "Vui lòng thử lại.",
      notConfigTitle: "Chưa thể đặt lịch",
      notConfigNote: "Hiện chưa thể đặt lịch — vui lòng thử lại sau giây lát.",
    },
  };

  const LS_LANG = "washee.lang";
  const saved = localStorage.getItem(LS_LANG);
  let lang = saved || ((navigator.language || "").toLowerCase().startsWith("vi") ? "vi" : "en");
  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;

  // ---------- selected wash (from ?tier=glow|plus, mirrors the landing tiers) ----------
  // Prices match landing/index.html; the label is a brand proper noun (same in both languages).
  const TIERS = {
    glow: { name: "Glow", vnd: "250k₫", usd: "$10" },
    plus: { name: "Glow Plus", vnd: "400k₫", usd: "$16" },
  };
  const tierKey = (new URLSearchParams(location.search).get("tier") || "").toLowerCase();
  const tier = TIERS[tierKey] || null;
  const currency = localStorage.getItem("washee.currency") === "usd" ? "usd" : "vnd";
  const tierPrice = tier ? tier[currency] : "";

  const $ = (sel) => document.querySelector(sel);
  const el = {
    startBtn: $("#startBtn"),
    form: $("#bookForm"),
    phone: $("#phone"),
    address: $("#address"),
    formError: $("#formError"),
    submitBtn: $("#submitBtn"),
    submitLbl: $("#submitBtn .lbl"),
    submitSpin: $("#submitBtn .spin"),
    result: $("#result"),
    tierChip: $("#tierChip"),
    tierName: $("#tierName"),
    tierPrice: $("#tierPrice"),
  };

  // ---------- selected-wash chip ----------
  function renderTier() {
    if (!tier) return;
    el.tierName.textContent = tier.name;
    el.tierPrice.textContent = "· " + tierPrice;
    el.tierChip.hidden = false;
  }

  // ---------- apply language ----------
  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.title = t("htmlTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPh);
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    // keep the submit button label in sync unless it's mid-send
    if (el.submitSpin.hidden) el.submitLbl.textContent = t("submit");
  }

  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.addEventListener("click", () => {
      localStorage.setItem(LS_LANG, b.dataset.lang);
      applyLang(b.dataset.lang);
    })
  );

  applyLang(lang);
  renderTier();

  // ---------- step 1 → step 2 ----------
  el.startBtn.addEventListener("click", () => {
    el.startBtn.hidden = true;
    el.form.hidden = false;
    el.phone.focus();
    el.form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // ---------- submit ----------
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitBooking();
  });

  function validate() {
    const phone = el.phone.value.trim();
    const address = el.address.value.trim();
    const digits = phone.replace(/[\s+\-().]/g, "");
    if (!phone) return { errorKey: "errPhoneEmpty" };
    if (!/^[0-9]{6,}$/.test(digits)) return { errorKey: "errPhoneInvalid" };
    if (!address) return { errorKey: "errAddressEmpty" };
    return { phone, address };
  }

  async function submitBooking() {
    el.formError.hidden = true;
    const v = validate();
    if (v.errorKey) {
      el.formError.textContent = t(v.errorKey);
      el.formError.hidden = false;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: v.phone, address: v.address, lang, tier: tierKey || null }),
      });
      const json = await res.json().catch(() => ({}));
      setLoading(false);
      if (res.ok && json.ok) {
        el.form.hidden = true;
        showResult("ok", t("okTitle"), t("okNote"));
      } else if (res.status === 500 && json.error === "not_configured") {
        showResult("warn", t("notConfigTitle"), t("notConfigNote"));
      } else {
        showResult("warn", t("sendFailTitle"), t("tryAgain"));
      }
    } catch (err) {
      setLoading(false);
      showResult("warn", t("reachFailTitle"), t("reachFailNote"));
    }
  }

  function setLoading(loading) {
    el.submitBtn.disabled = loading;
    el.submitLbl.textContent = loading ? t("sending") : t("submit");
    el.submitSpin.hidden = !loading;
  }

  // ---------- result card ----------
  function showResult(kind, title, note) {
    el.result.hidden = false;
    el.result.innerHTML = "";

    const pill = document.createElement("span");
    pill.className = "pill " + (kind === "ok" ? "ok" : "warn");
    pill.textContent = kind === "ok" ? t("pillOk") : t("pillWarn");

    const h = document.createElement("h2");
    h.textContent = title;

    const p = document.createElement("p");
    p.className = "sub";
    p.textContent = note;

    el.result.append(pill, h, p);

    if (kind === "ok") {
      const again = document.createElement("button");
      again.className = "btn primary submit";
      again.textContent = t("again");
      again.addEventListener("click", () => location.reload());
      el.result.append(again);
    }

    el.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
})();
