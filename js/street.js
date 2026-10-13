/* Halflight — the street scene, dealt like a deck of cards.
   Three scenes stacked in one pinned stage: the street clip, the "Tested" clip and the dark court with the ball.
   To change scenes, the one on top shrinks into a card (the next cards peek out behind it),
   gets swiped off the deck in 3D, and the next card comes forward and fills the screen.
   The last change is different: the day court closes in on the ball, like an iris, and the ball is left on the dark court. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const section = $(".street");
  if (!section) return;
  const stage = $(".street-stage", section);
  const A = $(".card-a", section), B = $(".card-b", section), C = $(".card-c", section);

  // where each card sits: full screen, top of the deck, and the two slots behind it
  const FULL = { scale: 1, xPercent: 0, yPercent: 0, rotation: 0, rotationY: 0, borderRadius: 0, "--edge": 0, filter: "brightness(1)" };
  const TOP = { scale: 0.7, xPercent: 0, yPercent: 0, rotation: 0, rotationY: 0, borderRadius: 26, "--edge": 1, filter: "brightness(1)" };
  const SLOT1 = { scale: 0.62, xPercent: 5, yPercent: 7, rotation: 5, rotationY: 0, borderRadius: 26, "--edge": 1, filter: "brightness(0.55)" };
  const SLOT2 = { scale: 0.55, xPercent: -6, yPercent: 12, rotation: -6, rotationY: 0, borderRadius: 26, "--edge": 1, filter: "brightness(0.35)" };

  function build() {
    const { splitWords, setHeader, hold } = window.HL;
    const wordsA = splitWords($(".swish-copy h2", A));
    const wordsB = splitWords($(".day-reveal-copy h2", B));
    const ball = $(".closer-drop", C);
    const hop = $(".closer-hop", C);

    // the deck starts with B and C waiting behind A, out of sight while A is full screen
    gsap.set([A, B, C], { ...FULL, boxShadow: "0 40px 90px rgba(0,0,0,0)" });
    gsap.set(B, { ...SLOT1 });
    gsap.set(C, { ...SLOT2 });
    // the court card shows its ball even while it waits in the deck
    gsap.set(".street .closer-light", { opacity: 0.5 });
    gsap.set(".closer-court ellipse", { strokeDasharray: "1 1", strokeDashoffset: 1 });

    const shadow = "0 40px 90px rgba(0,0,0,0.55)";
    const deckPhase = (p) => (p > 0.23 && p < 0.45) || (p > 0.66 && p < 0.8);

    // the iris closes on the ball in card C: centred where the ball sits, ending at the ball's size
    const ballEl = $(".closer-ball", C);
    const ballBox = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      const size = ballEl.offsetWidth; // --ball in the CSS, which changes on small screens
      return { w, h, r: size * 0.47, cy: h * 0.4 };
    };
    const irisOpen = () => { const { w, h, cy } = ballBox(); return `circle(${Math.hypot(w / 2, Math.max(cy, h - cy)) + 2}px at 50% ${cy}px)`; };
    const irisShut = () => { const { r, cy } = ballBox(); return `circle(${r}px at 50% ${cy}px)`; };
    const videoA = $("video", A);
    const videoB = $("video", B);
    // a clip only plays while its card can be seen: A until it is swiped away, B from the deal until the iris shuts
    const holdCards = (p) => { hold(videoA, p > 0.4); hold(videoB, p < 0.22 || p > 0.78); };
    holdCards(0);

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      scrollTrigger: {
        trigger: section, start: "top top", end: "+=600%", pin: stage, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          setHeader(p < 0.23 || deckPhase(p) || p > 0.8 ? "dark" : "light"); // scene A is shaded, so it keeps light ink
          holdCards(p);
        },
      },
    });

    // SCENE A: the street court comes up out of the dark
    tl.to($(".card-night", A), { opacity: 0, duration: 0.1, ease: "none" }, 0)
      .fromTo($("video", A), { scale: 1.3 }, { scale: 1, duration: 0.24, ease: "none" }, 0)
      .set(".swish-copy h2", { visibility: "visible" }, 0.08)
      .from(wordsA, { yPercent: 130, stagger: 0.012, duration: 0.06, ease: "power3.out" }, 0.08)
      .fromTo(".swish-copy .court-line", { scaleX: 0 }, { scaleX: 1, duration: 0.05 }, 0.13)
      .from(".swish-copy p", { opacity: 0, y: 24, duration: 0.05, ease: "power2.out" }, 0.15);

    // DEAL 1: A shrinks into a card on top of the deck, is swiped off to the left, B comes forward and fills the screen
    tl.to(".swish-copy", { opacity: 0, y: 30, duration: 0.04, ease: "power2.in" }, 0.24)
      .to(A, { ...TOP, boxShadow: shadow, duration: 0.07 }, 0.24)
      .to(A, { xPercent: -135, yPercent: -6, rotation: -16, rotationY: 28, duration: 0.07, ease: "power2.in" }, 0.31)
      .to(B, { ...TOP, boxShadow: shadow, duration: 0.06 }, 0.33)
      .to(C, { ...SLOT1, duration: 0.06 }, 0.34)
      .to(B, { ...FULL, boxShadow: "0 40px 90px rgba(0,0,0,0)", duration: 0.07 }, 0.39)
      .fromTo($("video", B), { scale: 1.25 }, { scale: 1, duration: 0.16, ease: "power2.out" }, 0.39);

    // SCENE B: the headline
    tl.set(".day-reveal-copy", { visibility: "visible" }, 0.46)
      .from(wordsB, { yPercent: 130, stagger: 0.012, duration: 0.06, ease: "power3.out" }, 0.46)
      .fromTo(".day-reveal-copy .court-line", { scaleX: 0 }, { scaleX: 1, duration: 0.05 }, 0.51);

    // IRIS: the dark court is laid out full screen behind B, then the day court closes in on the ball,
    // turning as it goes, until only a ball-sized window is left and it melts into the real ball
    tl.to(".day-reveal-copy", { opacity: 0, y: 30, duration: 0.04, ease: "power2.in" }, 0.62)
      .set(C, { ...FULL, boxShadow: "0 40px 90px rgba(0,0,0,0)" }, 0.62)
      .fromTo(B, { clipPath: irisOpen }, { clipPath: irisShut, duration: 0.14, ease: "power3.inOut", immediateRender: false }, 0.63)
      .fromTo(videoB, { scale: 1, rotation: 0 }, {
        scale: 1.6, rotation: -25, transformOrigin: () => `50% ${ballBox().cy}px`,
        duration: 0.14, ease: "power3.inOut", immediateRender: false,
      }, 0.63)
      .to(".street .closer-light", { opacity: 0.8, duration: 0.1, ease: "none" }, 0.67)
      .to(B, { opacity: 0, duration: 0.04, ease: "power1.in" }, 0.75);

    // SCENE C: the ball springs up off the court and bounces back down as the light comes up
    tl.to(ball, { y: () => -innerHeight * 0.3, rotation: -180, duration: 0.03, ease: "power2.out" }, 0.8)
      .to(ball, { y: 0, rotation: 0, duration: 0.06, ease: "bounce.out" }, 0.83)
      .to(".closer-shadow", { scaleX: 0.5, opacity: 0.4, duration: 0.03, ease: "power2.out" }, 0.8)
      .to(".closer-shadow", { scaleX: 1, opacity: 1, duration: 0.06, ease: "bounce.out" }, 0.83)
      .to(".street .closer-light", { opacity: 1, duration: 0.06, ease: "none" }, 0.8)
      .to(".closer-court ellipse", { strokeDashoffset: 0, duration: 0.05 }, 0.85)
      .from(".closer-copy", { opacity: 0, y: 40, duration: 0.05, ease: "power2.out" }, 0.88)
      .to({}, { duration: 0.07 }, 0.93);
  }

  /* reduced motion: the last card, still */
  function still() {
    gsap.set([A, B], { display: "none" });
    gsap.set(".street .closer-light", { opacity: 1 });
  }

  window.HLStreet = { build, still };
})();
