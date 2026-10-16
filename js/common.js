/* Halflight — shared runtime: smooth scroll, page transitions, video, cart count */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;

  gsap.registerPlugin(ScrollTrigger);
  // the mobile address bar showing and hiding resizes the window; re-measuring then makes pinned scenes jump
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);
  if (window.Flip) gsap.registerPlugin(Flip);

  /* ---------- storage (never trusted to exist) ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
    session(key, value) {
      try {
        if (value === undefined) return sessionStorage.getItem(key);
        if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value);
      } catch { return null; }
    },
  };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    // light smoothing: the page catches up with the wheel quickly instead of gliding on after it
    lenis = new Lenis({ lerp: 0.2, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- header ink follows the section underneath ---------- */
  const header = document.querySelector(".site-header");
  const setHeader = (t) => { if (header && header.dataset.theme !== t) header.dataset.theme = t; };
  document.querySelectorAll("[data-header]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 40px",
      end: "bottom 40px",
      refreshPriority: -1, // measure after the pinned sections have added their scroll length
      onToggle: (self) => self.isActive && setHeader(sec.dataset.header),
    });
  });

  /* ---------- scroll progress ---------- */
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- text splitting ---------- */
  function splitWords(el) {
    if (el.dataset.split) return el.querySelectorAll(".w > span");
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(" ");
    el.dataset.split = "1";
    return el.querySelectorAll(".w > span");
  }
  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.innerHTML = [...text].map((c) => `<span class="ch" aria-hidden="true">${c === " " ? "&nbsp;" : c}</span>`).join("");
    return el.querySelectorAll(".ch");
  }

  /* ---------- video: only play what is on screen, loop sub-segments ---------- */
  function wireVideo(v) {
    const start = parseFloat(v.dataset.start || 0);
    const end = parseFloat(v.dataset.end || 0);
    if (start) {
      const seek = () => { try { v.currentTime = start; } catch {} };
      if (v.readyState >= 1) seek(); else v.addEventListener("loadedmetadata", seek, { once: true });
    }
    if (end) {
      v.addEventListener("timeupdate", () => { if (v.currentTime >= end) v.currentTime = start; });
    }
  }
  // a video plays while it is near the screen and not held; pinned scenes hold the clips
  // that are covered or not revealed yet, so a phone never decodes more than it shows
  const near = new Set(), held = new Set();
  const sync = (v) => {
    if (near.has(v) && !held.has(v) && !reduce) { if (v.paused) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { e.isIntersecting ? near.add(e.target) : near.delete(e.target); sync(e.target); });
  }, { rootMargin: "50% 0px" });
  document.querySelectorAll("video[data-auto]").forEach((v) => { wireVideo(v); io.observe(v); });
  function hold(videos, on) {
    (videos.length === undefined ? [videos] : videos).forEach((v) => {
      if (held.has(v) === on) return;
      on ? held.add(v) : held.delete(v);
      sync(v);
    });
  }

  /* ---------- page transition: half light ----------
     Leaving: night drops over the left half, orange rises over the right, they meet at the seam
     and the next page's name climbs up letter by letter, in chalk on one side and umber on the other.
     Arriving: the letters lift away and the halves keep travelling past each other to reveal the page. */
  const pt = document.querySelector(".pt");
  const ptL = pt?.querySelector(".pt-l");
  const ptR = pt?.querySelector(".pt-r");
  const ptLines = pt ? [...pt.querySelectorAll(".pt-line")] : [];

  // fill both copies of the word, one span per letter; returns [left letters, right letters]
  function ptWord(name) {
    return [...pt.querySelectorAll(".pt-word")].map((w) => {
      w.innerHTML = [...name].map((c) => `<span class="pt-ch">${c}</span>`).join("");
      return [...w.children];
    });
  }

  // if the browser stops sending animation frames (a throttled tab or an embedded preview),
  // an entrance would freeze on its first frame and hide the page: jump it to the end instead
  const finishSoon = (tl, ms) => setTimeout(() => { if (tl.progress() < 1) tl.progress(1); }, ms);

  function enter() {
    if (!root.classList.contains("is-entering") || !pt) return Promise.resolve();
    const name = store.session("hl-transition") || "";
    store.session("hl-transition", null);
    const [chL, chR] = ptWord(name);
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete() {
          root.classList.remove("is-entering");
          gsap.set([ptL, ptR, ...ptLines], { clearProps: "transform" });
          pt.style.pointerEvents = "";
          resolve();
        },
      });
      const lift = { yPercent: -110, duration: 0.55, stagger: 0.035, ease: "expo.in" };
      tl.set([ptL, ptR], { y: 0, yPercent: 0 })
        .to(chL, lift, 0.05)
        .to(chR, lift, 0.05)
        .to(ptLines, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "expo.in" }, 0.1)
        // they keep going the way they came: night out the bottom, orange out the top
        .to(ptL, { yPercent: 101, duration: 1, ease: "expo.inOut" }, 0.5)
        .to(ptR, { yPercent: -101, duration: 1, ease: "expo.inOut" }, 0.56);
      tl.call(resolve, null, 0.95); // let page intros start while the halves part
      finishSoon(tl, 2500);
    });
  }

  function leave(href, name) {
    if (reduce || !pt) { location.href = href; return; }
    lenis?.stop();
    pt.style.pointerEvents = "auto";
    const [chL, chR] = ptWord(name || "");
    const rise = { yPercent: 0, duration: 0.7, stagger: 0.04, ease: "expo.out" };
    gsap.timeline({
      onComplete() {
        store.session("hl-transition", name || "");
        location.href = href;
      },
    })
      .fromTo(ptL, { y: 0, yPercent: -101 }, { yPercent: 0, duration: 0.9, ease: "expo.inOut" }, 0)
      .fromTo(ptR, { y: 0, yPercent: 101 }, { yPercent: 0, duration: 0.9, ease: "expo.inOut" }, 0.07)
      .fromTo(chL, { yPercent: 110 }, rise, 0.6)
      .fromTo(chR, { yPercent: 110 }, rise, 0.6)
      .fromTo(ptLines, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.7, ease: "expo.inOut" }, 0.68)
      .to({}, { duration: 0.1 });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-transition]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && !url.hash) { e.preventDefault(); return; }
    e.preventDefault();
    leave(a.href, a.dataset.transition);
  });

  // back/forward cache: reopen the page clean
  addEventListener("pageshow", (e) => {
    if (e.persisted && pt) {
      gsap.killTweensOf([ptL, ptR, ...ptLines, ...pt.querySelectorAll(".pt-ch")]);
      gsap.set([ptL, ptR, ...ptLines], { clearProps: "transform" });
      pt.style.pointerEvents = "";
      root.classList.remove("is-entering");
      lenis?.start();
    }
  });

  /* ---------- magnetic elements ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll("[data-magnet]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnet) || 0.3;
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- cart count in the header ---------- */
  function cartCount() {
    return store.get("hl-cart", []).reduce((n, l) => n + l.qty, 0);
  }
  function renderCount(bump) {
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = cartCount();
      if (bump && !reduce) gsap.fromTo(el, { scale: 1.6 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.35)" });
    });
  }
  renderCount();

  window.HL = { hold, finishSoon, setHeader, reduce, finePointer, lenis, store, splitWords, splitChars, enter, renderCount, wireVideo, observeVideo: (v) => { wireVideo(v); io.observe(v); } };
})();
