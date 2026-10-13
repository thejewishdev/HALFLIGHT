/* Halflight — store: shelf, filters, quick view, cart */
(() => {
  const { reduce, lenis, store, splitChars, enter, renderCount } = window.HL;
  const { products, art } = window.HLCatalog;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const money = (n) => "$" + n.toFixed(0);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  /* ---------- the floor: every product stands on the court line, drawn to one scale ---------- */
  const FLOORS = [
    { cat: "balls", title: "Balls", note: "Leather for the gym, rubber for the park." },
    { cat: "shoes", title: "Shoes", note: "High-tops and game shoes, US 7 to 13." },
    { cat: "apparel", title: "Apparel", note: "Heavyweight cotton that survives the game and the wash." },
    { cat: "gear", title: "Gear", note: "Caps, socks and a bottle for the bench." },
  ];
  const itemHTML = (p) => `
    <li class="item" style="--cm:${p.cm}">
      <button class="item-btn" type="button" data-id="${p.id}" data-shape="${p.shape}">
        <span class="item-stand"><span class="item-art">${art(p, "", "")}</span><span class="item-shadow"></span></span>
        <span class="item-meta">
          <span class="item-name">${p.name}</span>
          <span class="item-line"><span class="item-price">${money(p.price)}</span><span class="item-tag">${p.tag}</span></span>
        </span>
      </button>
    </li>`;
  const floors = $(".floors");
  floors.innerHTML = FLOORS.map((f) => `
    <section class="floor" id="floor-${f.cat}" data-cat="${f.cat}" aria-labelledby="floor-${f.cat}-title">
      <header class="floor-head">
        <h2 id="floor-${f.cat}-title" class="display">${f.title}</h2>
        <p>${f.note}</p>
        <span class="scale" aria-hidden="true"><i></i>10 cm</span>
      </header>
      <ul class="floor-row">${products.filter((p) => p.cat === f.cat).map(itemHTML).join("")}</ul>
    </section>`).join("");
  const items = $$(".item-btn", floors);

  // as many items per row as fit at true scale, then evened out; empty slots keep the line going
  function layoutFloors() {
    $$(".floor-row", floors).forEach((row) => {
      $$(".item-gap", row).forEach((g) => g.remove());
      const list = $$(".item", row);
      const pad = parseFloat(getComputedStyle($(".item-stand", row)).paddingLeft) * 2;
      const need = Math.max(...list.map((li) => $(".item-art", li).offsetWidth + pad), Math.min(150, innerWidth * 0.42));
      const fit = Math.max(1, Math.floor(row.clientWidth / need));
      const rows = Math.ceil(list.length / fit);
      const per = Math.ceil(list.length / rows);
      row.style.setProperty("--per", per);
      row.insertAdjacentHTML("beforeend", '<li class="item-gap" aria-hidden="true"><span class="item-stand"></span></li>'.repeat(rows * per - list.length));
    });
  }
  layoutFloors();
  // phones fire resize whenever the toolbar slides in or out; only a new width changes the rows
  const onWidthChange = (fn) => { let w = innerWidth; addEventListener("resize", () => { if (innerWidth !== w) { w = innerWidth; fn(); } }); };
  onWidthChange(layoutFloors);
  items.forEach((btn) => btn.addEventListener("click", () => openQuickView(byId[btn.dataset.id], $(".item-stand", btn))));

  /* ---------- hero ---------- */
  const titleChars = splitChars($(".store-title h1"));
  if (!reduce) {
    gsap.set(titleChars, { yPercent: -180, opacity: 0 });
    gsap.set(".store-title p", { opacity: 0, y: 20 });
    gsap.set(".store-hero .frame", { clipPath: "inset(12% 10% 12% 10%)" });
  }
  function heroIn() {
    if (reduce) return;
    // the clip-path only runs for the entrance; it repaints the playing video every frame, so it is dropped after
    window.HL.finishSoon(gsap.timeline({ onComplete: () => gsap.set(".store-hero .frame", { clearProps: "clipPath" }) })
      .to(".store-hero .frame", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" }, 0)
      .from(".store-hero video", { scale: 1.35, duration: 2, ease: "expo.out" }, 0.2)
      // letters drop in like dribbles
      .to(titleChars, { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.09, ease: "bounce.out" }, 0.55)
      .to(".store-title p", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 1.1)
      .fromTo(".store-title .court-line", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 1.3), 3500);

    // scrolling away, the footage pulls back into a rounded card. Scale, not clip-path, so the GPU moves it without repainting
    const frame = $(".store-hero .frame");
    gsap.timeline({ scrollTrigger: {
      trigger: ".store-hero", start: "top top", end: "bottom top", scrub: true,
      onUpdate: (self) => frame.classList.toggle("is-card", self.progress > 0.02),
    } })
      .to(frame, { scale: 0.92, ease: "none" }, 0)
      .to(".store-title", { yPercent: -60, ease: "none" }, 0)
      .to(".store-hero video", { yPercent: 12, ease: "none" }, 0);

    // products settle onto the line as each row arrives
    ScrollTrigger.batch(items, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => {
        gsap.timeline()
          .from(batch.map((b) => $(".item-art", b)), { yPercent: -30, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out" }, 0)
          .from(batch.map((b) => $(".item-meta", b)), { opacity: 0, y: 12, duration: 0.7, stagger: 0.08, ease: "power2.out" }, 0.35);
      },
    });
  }

  /* ---------- category links: jump to a floor, and follow along while scrolling ---------- */
  const bar = $(".shelf-bar");
  const pill = $(".filter-pill");
  const links = $$(".filters a");
  const placePill = (a, animate) => {
    const props = { x: a.offsetLeft, width: a.offsetWidth };
    animate && !reduce ? gsap.to(pill, { ...props, duration: 0.6, ease: "elastic.out(1, 0.75)" }) : gsap.set(pill, props);
  };
  const setActive = (cat) => {
    const a = links.find((l) => l.dataset.cat === cat);
    if (a.hasAttribute("aria-current")) return;
    links.forEach((l) => l.removeAttribute("aria-current"));
    a.setAttribute("aria-current", "location");
    placePill(a, true);
    // on narrow screens the links scroll sideways: keep the current one in view
    const f = a.parentElement;
    f.scrollTo({ left: a.offsetLeft - (f.clientWidth - a.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  };
  document.fonts.ready.then(() => placePill($(".filters [aria-current]"), false));
  onWidthChange(() => placePill($(".filters [aria-current]"), false));
  const barLine = () => `top ${bar.offsetHeight + 40}px`;
  $$(".floor", floors).forEach((f) => ScrollTrigger.create({
    trigger: f, start: barLine, end: () => `bottom ${bar.offsetHeight + 40}px`,
    onToggle: (self) => self.isActive && setActive(f.dataset.cat),
  }));
  links.forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const top = $(a.getAttribute("href")).getBoundingClientRect().top + scrollY - bar.offsetHeight + 1;
    lenis ? lenis.scrollTo(top, { duration: 1.2 }) : scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }));

  /* ---------- quick view: the tile grows into the panel ---------- */
  const qv = $(".qv");
  const panel = $(".qv-panel");
  let current = null, fromTile = null, lastFocus = null;

  function clipFor(tile) {
    const p = panel.getBoundingClientRect(), t = tile.getBoundingClientRect();
    return `inset(${t.top - p.top}px ${p.right - t.right}px ${p.bottom - t.bottom}px ${t.left - p.left}px round 6px)`;
  }

  function openQuickView(p, tile) {
    current = p; fromTile = tile; lastFocus = document.activeElement;
    panel.style.setProperty("--tile", p.tile);
    $(".qv-media .card-art").dataset.shape = p.shape;
    $(".qv-media .card-art").innerHTML = `<span class="card-float">${art(p)}</span><span class="card-shadow"></span>`;
    // the shelf copy is already loaded, so it shows at once; the full photo takes over when it arrives
    const full = new Image();
    full.onload = () => { if (current === p) $(".qv-media .product-img").src = p.img; };
    full.src = p.img;
    $("#qv-title").textContent = p.name;
    $(".qv-info .price").textContent = money(p.price);
    $(".qv-info .desc").textContent = p.desc;
    $(".qv-info .specs").innerHTML = p.specs.map((s) => `<li>${s}</li>`).join("");
    const sizes = $(".sizes");
    sizes.hidden = p.sizes.length < 2;
    sizes.innerHTML = `<legend>Size</legend>` + p.sizes.map((s, i) =>
      `<label><input type="radio" name="size" value="${s}" ${i === Math.floor(p.sizes.length / 2) ? "checked" : ""}><span>${s}</span></label>`).join("");

    qv.classList.add("is-open");
    lenis?.stop();
    document.body.style.overflow = "hidden";
    if (reduce) { $(".qv-close").focus(); return; }
    gsap.timeline()
      .fromTo(".qv-backdrop", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
      .fromTo(panel, { clipPath: clipFor(tile) }, { clipPath: "inset(0px 0px 0px 0px round 8px)", duration: 0.9, ease: "expo.inOut" }, 0)
      .fromTo(".qv-media .card-art", { scale: 0.6, rotation: -20 }, { scale: 1, rotation: 0, duration: 1.2, ease: "expo.out" }, 0.25)
      .fromTo(".qv-info > *", { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: "power3.out" }, 0.45)
      .add(() => $(".qv-close").focus(), 0.5);
  }

  let closing = false;
  function closeQuickView() {
    if (!qv.classList.contains("is-open") || closing) return;
    const done = () => {
      qv.classList.remove("is-open");
      gsap.set(panel, { clearProps: "opacity,scale" });
      lenis?.start();
      document.body.style.overflow = "";
      lastFocus?.focus({ preventScroll: true });
      closing = false;
    };
    if (reduce) return done();
    closing = true;
    // the scrollbar comes back first, so the shelf is measured where it will be once the panel is gone
    document.body.style.overflow = "";
    // the product flies out of the panel and lands on its own spot on the shelf, while the panel fades away
    const big = $(".qv-media .product-img");
    const home = $(".product-img", fromTile);
    const a = big.getBoundingClientRect(), b = home.getBoundingClientRect();
    const fly = big.cloneNode();
    fly.className = "product-img";
    Object.assign(fly.style, {
      position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px",
      maxWidth: "none", maxHeight: "none", margin: 0, zIndex: 61, pointerEvents: "none", transition: "none",
    });
    document.body.appendChild(fly);
    big.style.visibility = "hidden";
    home.style.visibility = "hidden";
    gsap.timeline({ onComplete() { home.style.visibility = ""; fly.remove(); done(); } })
      .to(".qv-info > *", { opacity: 0, duration: 0.2 }, 0)
      .to(panel, { opacity: 0, scale: 0.97, duration: 0.45, ease: "power2.in" }, 0.05)
      .to(".qv-backdrop", { opacity: 0, duration: 0.55, ease: "power2.out" }, 0.2)
      .to(fly, {
        x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2), scale: b.width / a.width,
        rotation: current.shape === "ball" ? -360 : 0,
        filter: "drop-shadow(0 6px 10px rgba(20, 14, 10, .18))",
        duration: 0.85, ease: "expo.inOut",
      }, 0);
  }
  $$("[data-close-qv]").forEach((b) => b.addEventListener("click", closeQuickView));

  $("[data-add]").addEventListener("click", (e) => {
    const size = $(".sizes input:checked")?.value || current.sizes[0];
    addToCart(current.id, size, e.currentTarget);
  });

  /* ---------- cart ---------- */
  let cart = store.get("hl-cart", []).filter((l) => byId[l.id]);
  const save = () => { store.set("hl-cart", cart); renderCount(true); renderCart(); };

  let addedTimer = 0;
  function addToCart(id, size, fromEl) {
    const line = cart.find((l) => l.id === id && l.size === size);
    line ? line.qty++ : cart.push({ id, size, qty: 1 });
    cleared = null;
    const btn = $("[data-add]");
    btn.textContent = "Added";
    clearTimeout(addedTimer);
    addedTimer = setTimeout(() => (btn.textContent = "Add to cart"), 1400);
    flyToCart(fromEl, () => save());
  }

  // a ball shoots from the button into the cart counter
  function flyToCart(fromEl, done) {
    const target = $(".site-header .cart-count");
    if (reduce || !target) return done();
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "flyer";
    fly.innerHTML = art(current);
    document.body.appendChild(fly);
    const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
    const ex = b.left + b.width / 2, ey = b.top + b.height / 2;
    gsap.timeline({ onComplete() { fly.remove(); done(); } })
      .set(fly, { x: sx, y: sy, scale: 0.4 })
      .to(fly, {
        motionPath: { path: [{ x: sx, y: sy }, { x: (sx + ex) / 2, y: Math.min(sy, ey) - 220 }, { x: ex, y: ey }], curviness: 1.4 },
        rotation: current.shape === "ball" ? 720 : 30, scale: 0.55, duration: 0.95, ease: "power1.inOut",
      })
      .to(fly, { scale: 0, duration: 0.15 });
  }

  const drawer = $(".drawer");
  const list = $(".drawer-list");
  const note = $(".drawer-note");

  function renderCart() {
    const empty = cart.length === 0;
    $(".drawer-empty").hidden = !empty;
    list.hidden = empty; // otherwise the empty list fills the panel and pushes the message to the bottom
    $("[data-undo]").hidden = !cleared;
    $("[data-clear]").hidden = empty;
    $(".drawer-empty p").textContent = cleared ? "Your cart is empty." : "Your cart is empty. Start with a ball; everything else follows.";
    $(".drawer-foot").style.display = empty ? "none" : "";
    list.innerHTML = cart.map((l, i) => {
      const p = byId[l.id];
      return `<li class="line">
        <span class="line-art" style="--tile:${p.tile}">${art(p)}</span>
        <div>
          <h3>${p.name}</h3>
          <p>${l.size}</p>
          <div class="qty">
            <button type="button" data-qty="-1" data-i="${i}" aria-label="Remove one ${p.name}">−</button>
            <output aria-label="Quantity">${l.qty}</output>
            <button type="button" data-qty="1" data-i="${i}" aria-label="Add one ${p.name}">+</button>
          </div>
        </div>
        <span class="line-price">${money(p.price * l.qty)}</span>
      </li>`;
    }).join("");
    const sub = cart.reduce((s, l) => s + byId[l.id].price * l.qty, 0);
    const ship = sub >= 80 || sub === 0 ? 0 : 8;
    $("[data-subtotal]").textContent = money(sub);
    $("[data-shipping]").textContent = ship ? money(ship) : "Free";
    $("[data-total]").textContent = money(sub + ship);
  }

  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-qty]");
    if (!b) return;
    const i = +b.dataset.i, d = b.dataset.qty;
    const l = cart[i];
    l.qty += +d;
    if (l.qty <= 0) cart.splice(i, 1);
    note.textContent = "";
    save();
    // the list is redrawn: put focus back on the same button, or on the close button if the line is gone
    ($(`[data-i="${i}"][data-qty="${d}"]`, list) || (cart.length ? $("[data-qty]", list) : $(".drawer-empty button:not([hidden])")))?.focus();
  });

  // clear all, with one step of undo until something else changes the cart
  let cleared = null;
  $("[data-clear]").addEventListener("click", () => {
    cleared = cart;
    cart = [];
    note.textContent = "";
    save();
    $("[data-undo]").focus();
  });
  $("[data-undo]").addEventListener("click", () => {
    cart = cleared || [];
    cleared = null;
    save();
    if (!reduce) gsap.from(".line", { x: 60, opacity: 0, stagger: 0.06, duration: 0.6, ease: "power3.out" });
    $("[data-clear]").focus();
  });

  $("[data-checkout]").addEventListener("click", () => {
    note.textContent = "This is a demo store, so no order was placed and no payment was taken.";
  });

  gsap.set(".drawer-panel", { x: 0, xPercent: 100 });
  let drawerFocus = null;
  function openCart() {
    renderCart();
    drawerFocus = document.activeElement;
    drawer.classList.add("is-open");
    lenis?.stop();
    document.body.style.overflow = "hidden";
    const tl = gsap.timeline()
      .to(".drawer-backdrop", { opacity: 1, duration: reduce ? 0 : 0.4 }, 0)
      .to(".drawer-panel", { xPercent: 0, duration: reduce ? 0 : 0.8, ease: "expo.out" }, 0);
    if (cart.length) tl.from(".line", { x: 60, opacity: 0, stagger: 0.06, duration: reduce ? 0 : 0.6, ease: "power3.out" }, 0.15);
    $(".drawer-head .qv-close").focus();
  }
  function closeCart() {
    if (!drawer.classList.contains("is-open")) return;
    cleared = null; // undo lasts while the drawer is open
    gsap.timeline({ onComplete() { drawer.classList.remove("is-open"); lenis?.start(); document.body.style.overflow = ""; drawerFocus?.focus({ preventScroll: true }); } })
      .to(".drawer-panel", { xPercent: 100, duration: reduce ? 0 : 0.6, ease: "expo.in" }, 0)
      .to(".drawer-backdrop", { opacity: 0, duration: reduce ? 0 : 0.4 }, 0.2);
  }
  $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
  $$("[data-close-cart]").forEach((b) => b.addEventListener("click", closeCart));

  addEventListener("keydown", (e) => {
    const open = drawer.classList.contains("is-open") ? $(".drawer-panel") : qv.classList.contains("is-open") ? panel : null;
    if (e.key === "Escape") { if (drawer.classList.contains("is-open")) closeCart(); else closeQuickView(); return; }
    // both are modal: Tab cycles inside the open one instead of wandering into the page behind
    if (e.key !== "Tab" || !open) return;
    const f = $$("button, input:checked, a[href]", open).filter((el) => el.offsetParent && !el.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!open.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  renderCart();

  /* ---------- go ---------- */
  enter().then(() => {
    heroIn();
    if (location.hash === "#cart") setTimeout(openCart, 600);
    // arriving from a product on the About page opens that product
    const linked = byId[location.hash.slice(1)];
    if (linked) {
      const item = floors.querySelector(`[data-id="${linked.id}"]`);
      const top = item.getBoundingClientRect().top + scrollY - 160;
      lenis ? lenis.scrollTo(top, { immediate: true }) : scrollTo(0, top);
      setTimeout(() => openQuickView(linked, $(".item-stand", item)), 500);
    }
  });
})();
