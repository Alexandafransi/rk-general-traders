import { dict, type Lang } from "./i18n";

/**
 * Ports the original static site's vanilla-JS behaviour (scroll reveal, promo
 * slider, mobile menu, theme toggle, FAQ accordion, sw/en language toggle)
 * onto the server-rendered markup. Runs once on mount; returns a cleanup fn.
 */
export function initSiteInteractions(): () => void {
  const cleanups: Array<() => void> = [];

  /* Scroll reveal */
  const revealEls = document.querySelectorAll<HTMLElement>(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
  cleanups.push(() => observer.disconnect());

  /* Promo slider */
  const promoSlidesEls = document.querySelectorAll<HTMLElement>(".promo-slide");
  const promoDots = document.querySelectorAll<HTMLElement>(".promo-dot");
  let promoIndex = 0;
  function showPromo(i: number) {
    promoIndex = (i + promoSlidesEls.length) % promoSlidesEls.length;
    promoSlidesEls.forEach((s, idx) => s.classList.toggle("active", idx === promoIndex));
    promoDots.forEach((d, idx) => d.classList.toggle("active", idx === promoIndex));
  }
  const promoPrev = document.getElementById("promoPrev");
  const promoNext = document.getElementById("promoNext");
  const onPrev = () => showPromo(promoIndex - 1);
  const onNext = () => showPromo(promoIndex + 1);
  promoPrev?.addEventListener("click", onPrev);
  promoNext?.addEventListener("click", onNext);
  cleanups.push(() => {
    promoPrev?.removeEventListener("click", onPrev);
    promoNext?.removeEventListener("click", onNext);
  });
  const dotHandlers: Array<[HTMLElement, () => void]> = [];
  promoDots.forEach((d) => {
    const handler = () => showPromo(parseInt(d.dataset.i ?? "0", 10));
    d.addEventListener("click", handler);
    dotHandlers.push([d, handler]);
  });
  cleanups.push(() => dotHandlers.forEach(([d, h]) => d.removeEventListener("click", h)));
  const promoInterval = setInterval(() => showPromo(promoIndex + 1), 6000);
  cleanups.push(() => clearInterval(promoInterval));

  /* Mobile menu */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const onHamburgerClick = () => {
    hamburgerBtn?.classList.toggle("open");
    mobileMenu?.classList.toggle("open");
  };
  hamburgerBtn?.addEventListener("click", onHamburgerClick);
  cleanups.push(() => hamburgerBtn?.removeEventListener("click", onHamburgerClick));
  const mobileLinks = mobileMenu?.querySelectorAll<HTMLElement>("a") ?? [];
  const onMobileLinkClick = () => {
    hamburgerBtn?.classList.remove("open");
    mobileMenu?.classList.remove("open");
  };
  mobileLinks.forEach((a) => a.addEventListener("click", onMobileLinkClick));
  cleanups.push(() => mobileLinks.forEach((a) => a.removeEventListener("click", onMobileLinkClick)));

  /* Theme toggle */
  const html = document.documentElement;
  const themeBtn = document.getElementById("themeBtn");
  function setTheme(t: string) {
    html.setAttribute("data-theme", t);
    try {
      localStorage.setItem("rk_theme", t);
    } catch {
      /* ignore */
    }
  }
  const onThemeClick = () =>
    setTheme(html.getAttribute("data-theme") === "dark" ? "light" : "dark");
  themeBtn?.addEventListener("click", onThemeClick);
  cleanups.push(() => themeBtn?.removeEventListener("click", onThemeClick));
  try {
    const savedTheme = localStorage.getItem("rk_theme");
    if (savedTheme) setTheme(savedTheme);
  } catch {
    /* ignore */
  }

  /* FAQ accordion */
  const faqHandlers: Array<[HTMLElement, () => void]> = [];
  document.querySelectorAll<HTMLElement>(".faq-item").forEach((item) => {
    const q = item.querySelector<HTMLElement>(".faq-q");
    const a = item.querySelector<HTMLElement>(".faq-a");
    if (!q || !a) return;
    const handler = () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll<HTMLElement>(".faq-item").forEach((i) => {
        i.classList.remove("open");
        const ia = i.querySelector<HTMLElement>(".faq-a");
        if (ia) ia.style.maxHeight = "";
      });
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    };
    q.addEventListener("click", handler);
    faqHandlers.push([q, handler]);
  });
  cleanups.push(() => faqHandlers.forEach(([q, h]) => q.removeEventListener("click", h)));

  /* Language toggle */
  const langBtn = document.getElementById("langBtn");
  const langLabel = document.getElementById("langLabel");
  function applyLang(lang: Lang) {
    html.setAttribute("data-lang", lang);
    html.setAttribute("lang", lang);
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = key ? dict[lang][key] : undefined;
      if (val !== undefined) el.innerHTML = val;
    });
    if (langLabel) langLabel.textContent = lang === "sw" ? "EN" : "SW";
    try {
      localStorage.setItem("rk_lang", lang);
    } catch {
      /* ignore */
    }
  }
  const onLangClick = () =>
    applyLang(html.getAttribute("data-lang") === "sw" ? "en" : "sw");
  langBtn?.addEventListener("click", onLangClick);
  cleanups.push(() => langBtn?.removeEventListener("click", onLangClick));
  try {
    const savedLang = localStorage.getItem("rk_lang") as Lang | null;
    if (savedLang) applyLang(savedLang);
  } catch {
    /* ignore */
  }

  return () => cleanups.forEach((fn) => fn());
}
