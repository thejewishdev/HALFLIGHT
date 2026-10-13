/* Halflight — catalog. Product photos are real (Pexels), cut out of their backgrounds so they can float on the tiles. */
(() => {
  const T = { night: "#1E252B", smoke: "#34414B", brick: "#D9A08E", sky: "#A7CBE8", pale: "#DCE3E8", orange: "#EE6A2F" };
  const SIZES = {
    balls: ["Size 6", "Size 7"],
    shoes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12", "US 13"],
    apparel: ["S", "M", "L", "XL", "XXL"],
    gear: ["One size"],
  };

  // shape decides how a product sits and moves: balls roll, shoes and the rest settle flat.
  // cm is the real width of what the photo shows (a pair of shoes, two bottles), so the store can draw everything to one scale
  const products = [
    { id: "molten-gg7x", cm: 24, cat: "balls", shape: "ball", name: "Molten GG7X", price: 70, tile: T.night, tag: "Indoor",
      desc: "A composite leather game ball with a soft, pebbled grip that league players trust indoors.",
      specs: ["Composite leather cover", "12-panel design", "Size 7 for men's play, size 6 for women's"] },
    { id: "spalding-legacy", cm: 24, cat: "balls", shape: "ball", name: "Spalding Legacy TF-1000", price: 80, tile: T.sky, tag: "Indoor",
      desc: "Moisture-wicking composite cover and deep channels for a ball that stays in your hands late in the game.",
      specs: ["ZK microfiber composite", "Deep channel design", "Ships deflated with needle"] },
    { id: "outdoor-rubber", cm: 24, cat: "balls", shape: "ball", name: "Street Rubber Ball, Orange", price: 25, tile: T.smoke, tag: "Outdoor",
      desc: "Tough rubber for concrete and asphalt. It takes a beating on the outdoor court and keeps its bounce.",
      specs: ["Durable rubber cover", "Butyl bladder", "Size 7"] },

    { id: "ball-royal", cm: 24, cat: "balls", shape: "ball", name: "Street Rubber Ball, Royal", price: 25, tile: T.pale, tag: "Outdoor",
      desc: "Our outdoor rubber ball in royal blue, so you can find yours in a pile of orange ones.",
      specs: ["Durable rubber cover", "Butyl bladder", "Size 7"] },
    { id: "ball-midnight", cm: 24, cat: "balls", shape: "ball", name: "Street Rubber Ball, Midnight", price: 25, tile: T.orange, tag: "Outdoor",
      desc: "All black with black channels. Made for the night run under a single lamp.",
      specs: ["Durable rubber cover", "Butyl bladder", "Size 7"] },
    { id: "ball-pink", cm: 24, cat: "balls", shape: "ball", name: "Street Rubber Ball, Pink", price: 25, tile: T.night, tag: "Outdoor",
      desc: "The same tough rubber ball in hot pink. Loud on the court and easy to spot on the playground.",
      specs: ["Durable rubber cover", "Butyl bladder", "Size 7"] },
    { id: "ball-volt", cm: 24, cat: "balls", shape: "ball", name: "Street Rubber Ball, Volt", price: 25, tile: T.smoke, tag: "Outdoor",
      desc: "A neon yellow-green ball you can see from the far end of the court, even at dusk.",
      specs: ["Durable rubber cover", "Butyl bladder", "Size 7"] },

    { id: "aj1-high-red", cm: 44, cat: "shoes", shape: "shoe", name: "Air Jordan 1 High", price: 180, tile: T.pale, tag: "Red and black",
      desc: "The high-top that started it all, in red and black leather with a padded collar for ankle support.",
      specs: ["Leather upper", "Air-Sole cushioning", "Rubber cupsole"] },
    { id: "aj1-high-royal", cm: 44, cat: "shoes", shape: "shoe", name: "Air Jordan 1 High, Royal", price: 180, tile: T.brick, tag: "Royal and black",
      desc: "The original high-top in royal blue and black leather, with a padded collar for ankle support.",
      specs: ["Leather upper", "Air-Sole cushioning", "Rubber cupsole"] },
    { id: "aj1-high-pine", cm: 44, cat: "shoes", shape: "shoe", name: "Air Jordan 1 High, Pine Green", price: 180, tile: T.pale, tag: "Green and black",
      desc: "Deep pine green and black leather on the shoe that started it all.",
      specs: ["Leather upper", "Air-Sole cushioning", "Rubber cupsole"] },
    { id: "aj1-high-shadow", cm: 44, cat: "shoes", shape: "shoe", name: "Air Jordan 1 High, Shadow", price: 180, tile: T.orange, tag: "Grey and black",
      desc: "Smoke grey and black leather. The quiet Jordan 1 that goes with everything.",
      specs: ["Leather upper", "Air-Sole cushioning", "Rubber cupsole"] },
    { id: "aj1-high-purple", cm: 44, cat: "shoes", shape: "shoe", name: "Air Jordan 1 High, Court Purple", price: 180, tile: T.sky, tag: "Purple and black",
      desc: "Court purple and black leather on the classic high-top, with a white midsole.",
      specs: ["Leather upper", "Air-Sole cushioning", "Rubber cupsole"] },
    { id: "af1-high-custom", cm: 31, cat: "shoes", shape: "shoe", name: "Air Force 1 High Custom", price: 240, tile: T.orange, tag: "One of one",
      desc: "A hand-painted Air Force 1 High in royal blue and orange with a speckled midsole. Only one pair exists.",
      specs: ["Hand-painted leather", "Orange laces included", "Single pair available"] },
    { id: "game-shoe-red", cm: 36, cat: "shoes", shape: "shoe", name: "Nike Game Shoe", price: 160, tile: T.night, tag: "Performance",
      desc: "A low-cut performance shoe with a visible Air unit and a grippy herringbone outsole for quick cuts.",
      specs: ["Engineered mesh upper", "Visible Air cushioning", "Herringbone traction"] },

    { id: "tee-white", cm: 56, cat: "apparel", shape: "flat", name: "Heavyweight Tee, White", price: 30, tile: T.orange, tag: "Cotton",
      desc: "A thick, boxy cotton tee for warmups and the walk home. Pre-washed, so it keeps its shape.",
      specs: ["240 gsm cotton", "Boxy fit", "Pre-washed"] },
    { id: "tee-black", cm: 50, cat: "apparel", shape: "flat", name: "Heavyweight Tee, Black", price: 30, tile: T.brick, tag: "Cotton",
      desc: "The same heavyweight tee in black, for the night run.",
      specs: ["240 gsm cotton", "Boxy fit", "Pre-washed"] },

    { id: "snapback-black", cm: 27, cat: "gear", shape: "flat", name: "Snapback, Black", price: 28, tile: T.sky, tag: "Adjustable",
      desc: "A structured six-panel snapback with a flat brim. Wear it forwards in the sun and backwards in the game.",
      specs: ["Cotton twill crown", "Snap closure", "One size"] },
    { id: "trucker-grey", cm: 30, cat: "gear", shape: "flat", name: "Trucker Cap, Grey", price: 26, tile: T.orange, tag: "Mesh back",
      desc: "A curved-brim trucker with a breathable mesh back for hot afternoons on the blacktop.",
      specs: ["Foam front panel", "Mesh back", "Snap closure"] },
    { id: "crew-socks", cm: 20, cat: "gear", shape: "flat", name: "Striped Crew Socks", price: 16, tile: T.night, tag: "Pack of 2",
      desc: "Thick knit crew socks with a cushioned sole. Two pairs in red and white.",
      specs: ["Cotton blend knit", "Cushioned footbed", "Two pairs"] },
    { id: "squeeze-bottle", cm: 24, cat: "gear", shape: "flat", name: "Court Bottle", price: 20, tile: T.brick, tag: "750 ml",
      desc: "An insulated steel bottle with a flip straw, so water stays cold through a full afternoon of games.",
      specs: ["Double-wall steel", "Flip-up straw lid", "Red or blue"] },
  ];

  products.forEach((p) => {
    p.sizes = SIZES[p.cat];
    p.img = `media/products/${p.id}.webp`;
    p.thumb = `media/products/s/${p.id}.webp`; // 600px copy for the shelf, the cart and the flyer
  });

  window.HLCatalog = {
    products,
    art: (p, cls = "", alt = p.name, src = p.thumb) => `<img class="product-img ${cls}" src="${src}" alt="${alt}" loading="lazy" decoding="async" draggable="false">`,
  };
})();
