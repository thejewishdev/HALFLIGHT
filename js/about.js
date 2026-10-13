/* Halflight — About page choreography */
(() => {
  const { reduce, lenis, store, splitWords, enter, setHeader, finishSoon, hold } = window.HL;
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- shared: size a word inside an SVG mask and find a point to fly through ----------
     The word is set tall and squeezed to the width with textLength, so every letter stays on screen.
     It is measured on a canvas: getBBox on text inside a <mask> is unreliable (Firefox returns 0). */
  const measure = document.createElement("canvas").getContext("2d");
  function fitWord({ svg, mask, texts, rects, widthFrac = 0.94, maxH = 0.62, minSqueeze = 0.62, cyFrac = 0.46, charIndex = 0 }) {
    const W = svg.clientWidth, H = svg.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    [mask, ...rects].forEach((r) => { r.setAttribute("x", 0); r.setAttribute("y", 0); r.setAttribute("width", W); r.setAttribute("height", H); });
    const text = texts[0];
    const cs = getComputedStyle(text);
    const word = text.textContent.toUpperCase();
    measure.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
    const em = measure.measureText(word).width / 100 || 3.8; // word width per px of font size
    const target = W * widthFrac;
    const fs = Math.min(H * maxH, target / (em * minSqueeze));
    const len = Math.min(target, em * fs);
    const cy = H * cyFrac;
    texts.forEach((t) => {
      t.setAttribute("font-size", fs);
      t.setAttribute("x", W / 2);
      t.setAttribute("y", cy + fs * 0.36);
      t.setAttribute("textLength", len);
      t.setAttribute("lengthAdjust", "spacingAndGlyphs");
    });
    const before = measure.measureText(word.slice(0, charIndex)).width;
    const glyph = measure.measureText(word[charIndex]).width;
    const ox = W / 2 - len / 2 + (len * (before + glyph / 2)) / (em * 100);
    return { ox, oy: cy, scale: (Math.max(W, H) * 2.4) / (fs * 0.1 * (len / (em * fs))) };
  }

  /* ---------- hero ---------- */
  // the word in the mask and its orange outline copy move as one
  const heroWord = $$(".mask-word, .hero-outline");
  const heroText = $$(".hero-mask text");
  const outline = $(".hero-outline");
  let hero = { scale: 60, ox: 0, oy: 0 };
  const layoutHero = () => {
    gsap.set(heroWord, { clearProps: "transform" });
    // on short screens (a phone on its side) the word is set smaller and lower, clear of the header
    const short = innerHeight < 520;
    hero = fitWord({ svg: $(".hero-mask"), mask: $("#word-mask"), texts: heroText, rects: $$(".mask-bg, .mask-fill"), charIndex: 5, maxH: short ? 0.5 : 0.62, cyFrac: short ? 0.5 : 0.46 }); // the I
  };

  /* ---------- night: the pill that becomes the wall ---------- */
  const stage = $(".night-stage");
  const wall = $(".wall");
  const layer = $(".wall-layer");
  const pill = $(".pill-spin");
  const layerVideo = $("video", layer);
  const lines = $$(".statement-text .st-line");
  const N = {};
  function layoutNight() {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    const gap = Math.max(8, vw * 0.008);
    const tw = (vw * 0.92 - 2 * gap) / 3;
    const th = (tw * vh) / vw;
    wall.style.setProperty("--tw", tw + "px");
    wall.style.setProperty("--th", th + "px");
    wall.style.setProperty("--gap", gap + "px");
    N.S = vw / tw;

    // pill position without transforms, summed up to the full-size statement box
    const box = $(".statement");
    let ox = 0, oy = 0;
    for (let el = pill; el && el !== box; el = el.offsetParent) { ox += el.offsetLeft; oy += el.offsetTop; }
    const pw = pill.offsetWidth, ph = pill.offsetHeight;
    Object.assign(N, {
      vw, vh, pw, ph,
      k: Math.max(pw / vw, ph / vh), // the full-screen clip scaled down until it covers the pill
      px: ox + pw / 2 - vw / 2,
      py: oy + ph / 2 - vh / 2,
      slide: lines[1].offsetWidth * 0.7, // how far the pill's line starts off to the side
    });
    drawLayer();
  }

  /* One video plays the pill, the full screen and the middle of the wall. Only transforms move it, so a phone
     composites it without repainting, and nothing ever seeks it. The box is stretched to the shape it shows and
     the video inside is stretched back, so the picture keeps its proportions.
     slide and pop follow the pill as its line slides in, open grows it to the screen, tile pulls it into the wall. */
  const L = { slide: 1, pop: 1, open: 0, tile: 0 };
  const lerp = (a, b, t) => a + (b - a) * t;
  function drawLayer() {
    if (!N.vw) return;
    const { vw, vh } = N, o = L.open;
    const u = lerp(0.2, 1, L.pop) * lerp(1, 1 / N.S, L.tile); // uniform scale on top of the shape
    const w = lerp(N.pw, vw, o) * u, h = lerp(N.ph, vh, o) * u;
    const x = (lerp(N.px, 0, o) + (1 - L.slide) * N.slide) * lerp(1, 1 / N.S, L.tile);
    const y = lerp(N.py, 0, o) * lerp(1, 1 / N.S, L.tile);
    const k = lerp(N.k, 1, o) * u;
    const r = lerp(N.ph / 2, 0, o) * u + 8 * L.tile; // corner radius on screen
    const sx = w / vw, sy = h / vh;
    layer.style.transform = `translate(${x}px, ${y}px) rotate(${lerp(-12, 0, L.pop)}deg) scale(${sx}, ${sy})`;
    layer.style.borderRadius = `${r / sx}px / ${r / sy}px`;
    layerVideo.style.transform = `scale(${k / sx}, ${k / sy})`;
  }

  function layoutAll() {
    layoutHero();
    layoutNight();
  }

  /* ---------- reduced motion: everything readable, nothing pinned ---------- */
  function staticStates() {
    root.classList.add("skip-intro", "reduced");
    gsap.set(".hero-mask, .hero-sub", { display: "none" });
    gsap.set(".hero-shade", { opacity: 1 });
    window.HLStreet.still();
  }

  const displayFont = getComputedStyle(heroText[0]).fontFamily;
  Promise.all([document.fonts.load(`900 100px ${displayFont}`).catch(() => {}), document.fonts.ready]).then(() => {
    if (reduce) root.classList.add("reduced");
    layoutAll();
    if (reduce) { staticStates(); enter(); return; }
    build();
    // measure after ScrollTrigger has unpinned everything: while pinned, the stages keep
    // their old pixel size, so a resize in the middle of the hero or the wall measured stale sizes
    ScrollTrigger.addEventListener("revert", layoutAll);
    ScrollTrigger.refresh();
    start();
  });

  /* ---------- entrance ---------- */
  function heroIn(delay = 0) {
    return gsap.timeline({ delay })
      .from(heroText, { opacity: 0, scale: 1.25, svgOrigin: `${hero.ox} ${hero.oy}`, duration: 1.8, ease: "expo.out" }, 0)
      .from(".hero-stage video", { scale: 1.5, duration: 2.2, ease: "expo.out" }, 0)
      .from(".hero-sub > *", { opacity: 0, y: 24, stagger: 0.12, duration: 1, ease: "power3.out" }, 0.6);
  }

  function start() {
    if (root.classList.contains("skip-intro")) {
      $(".intro")?.remove();
      enter().then(() => finishSoon(heroIn(), 2600));
      return;
    }
    store.session("hl-intro-seen", "1");
    lenis?.stop();
    const intro = $(".intro");
    const lines = $$("line, circle, path", intro);
    lines.forEach((el) => {
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    });
    const introTl = gsap.timeline({ onComplete() { intro.remove(); lenis?.start(); } });
    finishSoon(introTl, 6000);
    introTl
      .to(lines, { strokeDashoffset: 0, duration: 1.3, stagger: 0.12, ease: "power2.inOut" })
      .to(intro.querySelector("circle:nth-of-type(2)"), { fill: "#C4542A", stroke: "#C4542A", duration: 0.3 }, "-=0.4")
      .fromTo(intro, { clipPath: "circle(150% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)", duration: 1.2, ease: "expo.inOut" }, "+=0.15")
      .add(heroIn(), "-=0.9");
  }

  /* ---------- SHOP ONLINE: the fill starts where the pointer comes in, and the ball hops ---------- */
  const shopBtn = $(".shop-btn");
  shopBtn.addEventListener("pointerenter", (e) => {
    const r = shopBtn.getBoundingClientRect();
    shopBtn.style.setProperty("--x", `${e.clientX - r.left}px`);
    shopBtn.style.setProperty("--y", `${e.clientY - r.top}px`);
    if (reduce) return;
    gsap.timeline()
      .to(".closer-hop", { y: -60, duration: 0.32, ease: "power2.out" })
      .to(".closer-hop", { y: 0, duration: 0.7, ease: "bounce.out" });
    gsap.timeline()
      .to(".closer-shadow", { scaleX: 0.7, opacity: 0.5, duration: 0.32, ease: "power2.out" })
      .to(".closer-shadow", { scaleX: 1, opacity: 1, duration: 0.7, ease: "bounce.out" });
  });
  shopBtn.addEventListener("pointerleave", (e) => {
    const r = shopBtn.getBoundingClientRect();
    shopBtn.style.setProperty("--x", `${e.clientX - r.left}px`);
    shopBtn.style.setProperty("--y", `${e.clientY - r.top}px`);
  });

  /* ---------- scroll choreography ---------- */
  function build() {
    /* HERO: fly through the I, then the headline (unchanged) */
    const heroWords = splitWords($(".hero-line h1"));
    gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=220%", pin: ".hero-stage", scrub: 1, invalidateOnRefresh: true },
    })
      .to(".hero-sub", { opacity: 0, y: -30, duration: 0.12 }, 0)
      .to(heroWord, {
        scale: () => hero.scale, svgOrigin: () => `${hero.ox} ${hero.oy}`, ease: "power3.in", duration: 0.55,
        // keep the outline thin as the word grows (vector-effect="non-scaling-stroke" would, but Firefox then draws no text at all)
        onUpdate() { outline.style.strokeWidth = 2.5 / gsap.getProperty(outline, "scaleX") + "px"; },
      }, 0)
      .fromTo(".hero-stage video", { scale: 1.15 }, { scale: 1, ease: "none", duration: 0.6, immediateRender: false }, 0)
      .to(".mask-fill, .hero-outline", { opacity: 0, duration: 0.06 }, 0.5)
      .to(".hero-shade", { opacity: 1, duration: 0.2 }, 0.55)
      .from(heroWords, { yPercent: 130, stagger: 0.02, duration: 0.25, ease: "power3.out" }, 0.6)
      .from(".hero-line p", { opacity: 0, y: 24, duration: 0.2 }, 0.8)
      .to({}, { duration: 0.12 });

    /* headings that rise when they arrive */
    $$(".split-scroll").forEach((h) => {
      gsap.from(splitWords(h), {
        yPercent: 130, stagger: 0.05, duration: 1.1, ease: "expo.out",
        scrollTrigger: { trigger: h, start: "top 85%" },
      });
    });

    /* NIGHT 1: the orange screen scrolls in and its three lines slide together from both sides */
    ScrollTrigger.create({ trigger: ".night", start: "top 40px", end: "top -10px", onEnter: () => setHeader("light"), onLeaveBack: () => setHeader("dark") });
    gsap.timeline({ scrollTrigger: { trigger: ".night", start: "top bottom", end: "top top", scrub: 1 } })
      .fromTo(lines[0], { xPercent: -70 }, { xPercent: 0, ease: "power2.out" }, 0)
      .fromTo(lines[1], { xPercent: 70 }, { xPercent: 0, ease: "power2.out" }, 0)
      .fromTo(lines[2], { xPercent: -70 }, { xPercent: 0, ease: "power2.out" }, 0)
      .fromTo(L, { slide: 0 }, { slide: 1, ease: "power2.out", onUpdate: drawLayer }, 0)
      .fromTo(L, { pop: 0 }, { pop: 1, ease: "back.out(1.4)", onUpdate: drawLayer }, 0.2)
      .fromTo(".statement-note", { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "power2.out" }, 0.5)
      .fromTo(".statement-seams", { rotation: -40 }, { rotation: 0, ease: "none" }, 0);

    /* NIGHT 2: the spinning-ball clip breaks out of the sentence, then pulls back into the wall */
    const wallCopy = splitWords($(".wall-copy h3"));
    // the wall's clips only decode once the wall can be seen
    const tileVideos = $$(".tile video");
    const holdNight = (p) => hold(tileVideos, p < 0.4);
    holdNight(0);
    gsap.timeline({
      scrollTrigger: {
        trigger: ".night", start: "top top", end: "+=430%", pin: stage, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => { setHeader(self.progress < 0.2 ? "light" : "dark"); holdNight(self.progress); },
      },
    })
      .fromTo(L, { open: 0 }, { open: 1, duration: 0.28, ease: "power3.inOut", immediateRender: false, onUpdate: drawLayer }, 0.12)
      .to(".statement-seams", { rotation: 30, duration: 0.3, ease: "none" }, 0)
      .to(".statement", { opacity: 0, scale: 0.92, duration: 0.2, ease: "power2.in" }, 0.16)
      .set(wall, { visibility: "visible" }, 0.46)
      .fromTo(wall, { scale: () => N.S }, { scale: 1, duration: 0.3, ease: "power2.inOut", immediateRender: false }, 0.46)
      .fromTo(L, { tile: 0 }, { tile: 1, duration: 0.3, ease: "power2.inOut", immediateRender: false, onUpdate: drawLayer }, 0.46)
      .to(".tile:not(.tile-center)", { "--dim": 0.45, duration: 0.12 }, 0.78)
      .to(layer, { "--dim": 0.6, duration: 0.12 }, 0.78)
      .to(".tile-center", { "--ring": 1, duration: 0.1 }, 0.78)
      .from(".tile figcaption", { yPercent: 110, opacity: 0, stagger: 0.02, duration: 0.12, ease: "power3.out" }, 0.78)
      .set(".wall-copy", { visibility: "visible" }, 0.82)
      .from(wallCopy, { yPercent: 130, stagger: 0.015, duration: 0.14, ease: "power3.out" }, 0.82)
      .to({}, { duration: 0.1 });
    $(".night").classList.add("is-live");
    // a refresh re-renders the timelines without firing onUpdate: redraw from where they settled
    ScrollTrigger.addEventListener("refresh", drawLayer);
    drawLayer();

    /* THE STREET: the drop, the second clip, the dribble and the ball (js/street.js) */
    window.HLStreet.build();
  }
})();
