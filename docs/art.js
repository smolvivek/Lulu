// Line-art toolkit: environment (stairwell + window + stranger's balcony) and
// three procedurally posed characters (Vivek, his wife, Lulu the cat).
// Everything is plain SVG so colour, speed and pose can react to light and music.

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const rad = (d) => (d * Math.PI) / 180;
const pt = (o, a, l) => [o[0] + Math.cos(rad(a)) * l, o[1] + Math.sin(rad(a)) * l];
const poly = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

// Stair geometry (viewBox 1000 x 560)
const ST = { x0: 20, run: 40, rise: 24, steps: 10, floor: 540, land: 276, landX: 420, sill: 236, winX: 640, winR: 940, winT: 50 };
const stairY = (x) => (x >= ST.landX ? ST.land : (ST.floor - ST.rise) - ((x - ST.x0) * ST.rise) / ST.run);
// tread height under a given step index (0 = bottom)
const treadY = (i) => ST.floor - ST.rise * (i + 1);
const treadX = (i) => ST.x0 + ST.run * i;

// ---------------------------------------------------------------- environment
function buildEnvironment(svg) {
  const defs = el("defs", {}, svg);
  const sky = el("linearGradient", { id: "skyGrad", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const skyTop = el("stop", { offset: "0", "stop-color": "#7fb0e6" }, sky);
  const skyBot = el("stop", { offset: "1", "stop-color": "#f8e0c4" }, sky);
  const clip = el("clipPath", { id: "winClip" }, defs);
  el("rect", { x: ST.winX, y: ST.winT, width: ST.winR - ST.winX, height: ST.sill - ST.winT }, clip);
  const shaftGrad = el("linearGradient", { id: "shaftGrad", gradientUnits: "userSpaceOnUse", x1: 700, y1: 150, x2: 150, y2: 450 }, defs);
  el("stop", { offset: "0", "stop-color": "var(--shaft)", "stop-opacity": "1" }, shaftGrad);
  el("stop", { offset: "1", "stop-color": "var(--shaft)", "stop-opacity": "0" }, shaftGrad);
  const glow = el("radialGradient", { id: "lampGlow" }, defs);
  el("stop", { offset: "0", "stop-color": "#ffcf7a", "stop-opacity": "0.55" }, glow);
  el("stop", { offset: "1", "stop-color": "#ffcf7a", "stop-opacity": "0" }, glow);

  const root = el("g", {}, svg);
  // wall + floor extend beyond the viewBox so wide screens stay seamless
  el("rect", { x: -3000, y: -2000, width: 7000, height: 4000, class: "wall" }, root);

  // far windowside content ------------------------------------------------
  const win = el("g", { "clip-path": "url(#winClip)" }, root);
  el("rect", { x: ST.winX, y: ST.winT, width: ST.winR - ST.winX, height: ST.sill - ST.winT, fill: "url(#skyGrad)" }, win);
  const stars = el("g", { class: "stars" }, win);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 34; i++) {
    el("circle", { cx: 645 + rnd() * 290, cy: 54 + rnd() * 120, r: 0.6 + rnd() * 1.1, fill: "#fff" }, stars);
  }
  const sun = el("circle", { r: 22, fill: "#fff3c8" }, win);
  const sunHalo = el("circle", { r: 46, fill: "#fff3c8", opacity: 0.25 }, win);
  const moon = el("g", {}, win);
  el("circle", { r: 15, fill: "#eef0ff" }, moon);
  el("circle", { cx: 6, cy: -3, r: 12.5, fill: "url(#skyGrad)" , class: "moonbite"}, moon);
  // distant roofs
  el("path", { class: "far", d: "M640,250 V200 H668 V182 H700 V210 H726 V190 H752 V232 H800 V250 Z" }, win);
  // the stranger's building
  const bld = el("g", {}, win);
  el("rect", { x: 806, y: 96, width: 140, height: 160, class: "bldg" }, bld);
  el("rect", { x: 842, y: 120, width: 52, height: 94, class: "door" }, bld);
  el("rect", { x: 846, y: 124, width: 44, height: 86, class: "doorlit" }, bld);
  el("path", { class: "ln thin", d: "M868,124 V210 M846,166 H890" }, bld);
  el("path", { class: "ln thin", d: "M806,96 H946" }, bld);
  // balcony slab + railing
  el("rect", { x: 790, y: 214, width: 160, height: 9, class: "bldg2" }, bld);
  let rail = "M790,176 H950";
  for (let x = 796; x <= 950; x += 14) rail += ` M${x},176 V214`;
  el("path", { class: "ln thin", d: rail }, bld);
  // pot plant
  const plant = el("g", { class: "plantg" }, bld);
  el("path", { class: "ln", d: "M903,214 L907,196 H923 L927,214 Z", fill: "var(--wall)" }, plant);
  const leaves = el("g", { class: "leaves" }, plant);
  el("path", { class: "ln thin", d: "M915,196 Q903,178 897,170 M915,196 Q915,172 917,160 M915,196 Q929,180 936,172" }, leaves);
  // laundry line
  const laundry = el("g", {}, bld);
  el("path", { class: "ln thin", d: "M792,150 Q850,160 804,150" , opacity: 0}, laundry);
  const shirt = el("path", { class: "ln thin", d: "M818,152 l-6,4 l4,6 l2,-2 v14 h14 v-14 l2,2 l4,-6 l-6,-4 q-6,4 -12,0 Z", fill: "var(--wall)" }, laundry);

  // window frame
  const frame = el("g", {}, root);
  el("rect", { x: ST.winX, y: ST.winT, width: ST.winR - ST.winX, height: ST.sill - ST.winT, class: "ln", fill: "none", "stroke-width": 4 }, frame);
  el("path", { class: "ln thin", d: `M${ST.winX},${ST.sill} H${ST.winR + 6}` }, frame);
  el("rect", { x: ST.winX - 6, y: ST.sill, width: ST.winR - ST.winX + 12, height: 7, class: "ln sill" }, frame);
  // (open window: curtains)
  el("path", { class: "ln thin", d: "M640,50 Q652,100 640,150 M640,60 Q660,110 646,170", opacity: 0.0 }, frame);

  // light shaft from the window (updated by setLight)
  const shaft = el("path", { class: "shaft", fill: "url(#shaftGrad)" }, root);

  // gallery frames on the stair wall
  const gal = el("g", {}, root);
  const frames = [
    [96, 292, 46, 60], [176, 236, 58, 44], [262, 196, 40, 52], [338, 118, 50, 40], [86, 214, 30, 30],
  ];
  frames.forEach(([x, y, w, h], i) => {
    el("rect", { x, y, width: w, height: h, class: "ln thin", fill: "none" }, gal);
    el("rect", { x: x + 5, y: y + 5, width: w - 10, height: h - 10, class: "ln thin", fill: "none", opacity: 0.55 }, gal);
    // tiny scribbles inside to suggest art
    el("path", { class: "ln thin", d: i % 2 ? `M${x + 9},${y + h - 11} q6,-10 12,-2 t12,-6` : `M${x + 8},${y + 12} q8,-4 10,6 t10,2`, opacity: 0.7 }, gal);
  });

  // wall lamp (glows at night)
  const lamp = el("g", {}, root);
  const lampGlow = el("circle", { cx: 560, cy: 150, r: 190, fill: "url(#lampGlow)", class: "lampglow" }, lamp);
  el("path", { class: "ln", d: "M560,128 V150 M548,150 H572 L566,172 H554 Z", fill: "var(--wall)" }, lamp);
  el("path", { class: "ln thin", d: "M556,132 H564" }, lamp);

  // handrail (behind the characters)
  let rail2 = "";
  const nose = (x) => stairY(x);
  rail2 += `M${ST.x0},${nose(ST.x0) - 88} L${ST.landX},${ST.land - 88} H520`;
  for (let x = ST.x0 + 20; x <= ST.landX; x += 80) rail2 += ` M${x},${nose(x)} V${nose(x) - 88}`;
  el("path", { class: "ln", d: rail2, opacity: 0.8 }, root);

  // stairs: one solid mass
  let d = `M-3000,${ST.floor} L${ST.x0},${ST.floor}`;
  for (let i = 0; i < ST.steps; i++) {
    const x = treadX(i);
    d += ` V${treadY(i)} H${x + ST.run}`;
  }
  d += ` V${ST.land} H3000 V1200 H-3000 Z`;
  el("path", { class: "stairs", d }, root);

  // shoes on the bottom step, a doormat on the landing
  el("path", { class: "ln thin", d: "M26,512 q6,-10 18,-6 l2,6 Z M52,512 q6,-10 16,-7 l2,7 Z", fill: "var(--wall)" }, root);

  const api = {
    svg,
    setLight(L) {
      const r = document.documentElement.style;
      skyTop.setAttribute("stop-color", L.skyTop);
      skyBot.setAttribute("stop-color", L.skyBot);
      sun.setAttribute("cx", L.sunX); sun.setAttribute("cy", L.sunY);
      sunHalo.setAttribute("cx", L.sunX); sunHalo.setAttribute("cy", L.sunY);
      sun.setAttribute("opacity", L.sunI);
      sunHalo.setAttribute("opacity", L.sunI * 0.28);
      moon.setAttribute("transform", `translate(${L.moonX},${L.moonY})`);
      moon.setAttribute("opacity", L.moonI);
      stars.setAttribute("opacity", L.starI);
      lampGlow.setAttribute("opacity", L.lamp);
      r.setProperty("--lit", L.lamp.toFixed(3));
      // shaft: window opening projected along the sun / moon direction
      const e = Math.max(8, L.elev);
      const run = 700 / Math.tan(rad(e));
      const dx = -Math.min(run, 1100), dy = Math.min(700, 700);
      const kx = dx, ky = Math.max(220, Math.min(560, 560 * 0.9));
      const p = [
        [ST.winX, 60], [ST.winX, ST.sill],
        [ST.winX + kx * 0.9, ST.sill + ky * 0.55],
        [ST.winX + kx * 0.9 + (ST.sill - 60) * 0.3, 60 + ky * 0.4],
      ];
      shaft.setAttribute("d", poly(p) + " Z");
      shaft.style.opacity = L.shaftA;
      shaftGrad.setAttribute("x1", ST.winX); shaftGrad.setAttribute("y1", 150);
      shaftGrad.setAttribute("x2", ST.winX + kx * 0.9); shaftGrad.setAttribute("y2", ST.sill + ky * 0.55);
      leaves.setAttribute("transform", `rotate(${Math.sin(L.t * 0.9) * 2.2} 915 196)`);
      shirt.setAttribute("transform", `rotate(${Math.sin(L.t * 1.3) * 3} 826 152)`);
    },
  };
  return api;
}

// ---------------------------------------------------------------- people
// All limb angles are absolute degrees: 0 = +x, 90 = down, -90 = up. Authored facing +x.
const LEN = { torso: 52, neck: 16, head: 11, upper: 26, fore: 24, thigh: 30, shin: 30 };

function makePerson(parent, kind) {
  const g = el("g", { class: "actor" }, parent);
  const body = el("g", {}, g);
  const wife = kind === "wife";
  const farArm = el("path", { class: "ln" }, body);
  const farLeg = el("path", { class: "ln" }, body);
  const nearLeg = el("path", { class: "ln" }, body);
  const skirt = wife ? el("path", { class: "ln skirt" }, body) : null;
  const torso = el("path", { class: "ln" }, body);
  const nearArm = el("path", { class: "ln" }, body);
  const props = el("g", {}, body);
  const headG = el("g", {}, body);
  el("circle", { r: LEN.head, class: "ln headfill" }, headG);
  const hair = wife
    ? el("path", { class: "ln", d: "M-10,-3 C-12,-14 3,-16 9,-9 M-8,-9 C-20,-6 -22,6 -17,15", fill: "none" }, headG)
    : el("path", { class: "ln", d: "M-11,-1 C-12,-13 -1,-14 5,-12 C10,-10 11,-6 10.5,-3", fill: "none" }, headG);
  if (wife) el("path", { class: "ln thin", d: "M-3,-12 Q4,-9 9,-5", fill: "none" }, headG);
  const eye = el("circle", { cx: 5, cy: -1, r: 1.6, class: "inkfill" }, headG);
  const eyeClosed = el("path", { class: "ln thin", d: "M3,-1 q2,2 4,0", fill: "none", opacity: 0 }, headG);
  const mouth = el("path", { class: "ln thin", d: "M4,5 q3,2 6,0", fill: "none" }, headG);

  const api = {
    g, body, props, pts: {},
    update(p) {
      const f = p.f == null ? 1 : p.f, s = p.s == null ? 1 : p.s;
      g.setAttribute("transform", `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) scale(${f * s},${s})`);
      g.setAttribute("opacity", p.op == null ? 1 : p.op);
      const hip = [0, 0];
      const ta = p.ta == null ? -90 : p.ta;
      const ha = p.ha == null ? ta : p.ha;
      const neck = pt(hip, ta, LEN.torso);
      const sh = pt(hip, ta, LEN.torso - 5);
      const head = pt(neck, ha, LEN.neck);
      const arms = p.arms || [[95, 98], [85, 92]];
      const legs = p.legs || [[92, 90], [88, 90]];
      const a1e = pt(sh, arms[0][0], LEN.upper), a1h = pt(a1e, arms[0][1], LEN.fore);
      const a2e = pt(sh, arms[1][0], LEN.upper), a2h = pt(a2e, arms[1][1], LEN.fore);
      const l1k = pt(hip, legs[0][0], LEN.thigh), l1f = pt(l1k, legs[0][1], LEN.shin);
      const l2k = pt(hip, legs[1][0], LEN.thigh), l2f = pt(l2k, legs[1][1], LEN.shin);
      nearArm.setAttribute("d", poly([sh, a1e, a1h]));
      farArm.setAttribute("d", poly([sh, a2e, a2h]));
      nearLeg.setAttribute("d", poly([hip, l1k, l1f]));
      farLeg.setAttribute("d", poly([hip, l2k, l2f]));
      torso.setAttribute("d", poly([hip, neck]));
      if (skirt) {
        const w = p.skirtW == null ? 1 : p.skirtW;
        skirt.setAttribute("d", `M-7,-4 L${-17 * w},34 Q0,${40} ${17 * w},34 L7,-4 Z`);
        skirt.style.display = p.noSkirt ? "none" : "";
      }
      headG.setAttribute("transform", `translate(${head[0].toFixed(1)},${head[1].toFixed(1)}) rotate(${ha + 90 + (p.tilt || 0)})`);
      hair.setAttribute("transform", p.hairSwing ? `rotate(${p.hairSwing} -8 -4)` : "");
      const closed = p.eye === "closed";
      eye.setAttribute("opacity", closed ? 0 : 1);
      eyeClosed.setAttribute("opacity", closed ? 1 : 0);
      mouth.setAttribute("d", p.mouth === "o" ? "M5,5 q2,-2 4,0 q-2,3 -4,0" : p.mouth === "flat" ? "M4,5.5 h6" : "M4,5 q3,3 6,0");
      api.pts = { hip, neck, sh, head, nearHand: a1h, farHand: a2h, nearElbow: a1e, farElbow: a2e, kneeN: l1k, kneeF: l2k, footN: l1f, footF: l2f };
      return api.pts;
    },
  };
  return api;
}

// ---------------------------------------------------------------- Lulu
// Small, white, dark grey tail, one dark grey round spot on her shoulder.
function capsule(p1, p2, r) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * r, ny = (dx / L) * r;
  return `M${p1[0] + nx},${p1[1] + ny} L${p2[0] + nx},${p2[1] + ny} A${r},${r} 0 0 0 ${p2[0] - nx},${p2[1] - ny} L${p1[0] - nx},${p1[1] - ny} A${r},${r} 0 0 0 ${p1[0] + nx},${p1[1] + ny} Z`;
}

function makeLulu(parent) {
  const g = el("g", { class: "actor lulu" }, parent);
  const body = el("g", {}, g);
  const mkLimb = () => ({
    o: el("path", { class: "limb-o" }, body),
    i: el("path", { class: "limb-i" }, body),
  });
  const hlFar = mkLimb(), flFar = mkLimb();
  const tailO = el("path", { class: "tail-o", fill: "none" }, body);
  const tailI = el("path", { class: "tail-i", fill: "none" }, body);
  const torso = el("path", { class: "cat-body" }, body);
  const haunch = el("circle", { class: "cat-body", r: 9 }, body);
  const spot = el("circle", { class: "cat-spot", r: 4.4 }, body);
  const hlNear = mkLimb(), flNear = mkLimb();
  const headG = el("g", {}, body);
  const earL = el("path", { class: "cat-body", d: "M-7,-5 L-6.5,-15 L-0.5,-8 Z" }, headG);
  const earR = el("path", { class: "cat-body", d: "M1,-8 L7,-14.5 L8,-4 Z" }, headG);
  el("circle", { r: 8.6, class: "cat-body" }, headG);
  const eyeL = el("circle", { cx: 1.5, cy: -1.2, r: 1.15, class: "inkfill" }, headG);
  const eyeR = el("circle", { cx: 6, cy: -1.2, r: 1.15, class: "inkfill" }, headG);
  const lid = el("path", { class: "ln thin", d: "M0.3,-1.2 h2.4 M4.8,-1.2 h2.4", fill: "none", opacity: 0 }, headG);
  el("path", { d: "M7.2,1.6 l1.8,0 l-0.9,1.2 Z", fill: "#e9a5a5" }, headG);
  el("path", { class: "ln thin", d: "M8,3 q-1.2,1.4 -2.6,1 M8,3 q1,1.4 2.2,1", fill: "none", "stroke-width": 1 }, headG);
  el("path", { class: "ln thin", d: "M9,1 l6,-1.4 M9,2.2 l6.5,1.2", fill: "none", "stroke-width": 0.9, opacity: 0.8 }, headG);

  const LL = 8;
  function limb(L, from, a1, a2) {
    const k = pt(from, a1, LL), f = pt(k, a2, LL);
    const d = poly([from, k, f]);
    L.o.setAttribute("d", d); L.i.setAttribute("d", d);
    return f;
  }

  const api = {
    g, body, pts: {},
    // p: {x,y (ground under chest), f, s, op, chest, rump, head:[x,y], headA, legs:{fl:[a1,a2],fr,hl,hr}, tail:[pts], blink, spotOn}
    update(p) {
      const f = p.f == null ? 1 : p.f, s = p.s == null ? 1 : p.s;
      g.setAttribute("transform", `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) scale(${f * s},${s})`);
      g.setAttribute("opacity", p.op == null ? 1 : p.op);
      const c = p.chest, r = p.rump;
      torso.setAttribute("d", capsule(r, c, 9.2));
      haunch.setAttribute("cx", r[0]); haunch.setAttribute("cy", r[1]); haunch.setAttribute("r", 0.01);
      // shoulder spot sits on the upper back just behind the neck
      const ang = Math.atan2(c[1] - r[1], c[0] - r[0]);
      const up = [Math.sin(ang), -Math.cos(ang)];
      spot.setAttribute("cx", (c[0] - Math.cos(ang) * 6 + up[0] * 3.2).toFixed(1));
      spot.setAttribute("cy", (c[1] - Math.sin(ang) * 6 + up[1] * 3.2).toFixed(1));
      const lg = p.legs;
      const fFrom = [c[0] - 1, c[1] + 5], hFrom = [r[0] + 1, r[1] + 5];
      const ft = {};
      ft.flN = limb(flNear, [fFrom[0] + 2, fFrom[1]], lg.fl[0], lg.fl[1]);
      ft.flF = limb(flFar, [fFrom[0] - 2, fFrom[1]], lg.fr[0], lg.fr[1]);
      ft.hlN = limb(hlNear, [hFrom[0] + 2, hFrom[1]], lg.hl[0], lg.hl[1]);
      ft.hlF = limb(hlFar, [hFrom[0] - 2, hFrom[1]], lg.hr[0], lg.hr[1]);
      const tp = p.tail;
      const td = `M${tp[0][0]},${tp[0][1]} Q${tp[1][0]},${tp[1][1]} ${tp[2][0]},${tp[2][1]}` + (tp[3] ? ` T${tp[3][0]},${tp[3][1]}` : "");
      tailO.setAttribute("d", td); tailI.setAttribute("d", td);
      const h = p.head;
      headG.setAttribute("transform", `translate(${h[0].toFixed(1)},${h[1].toFixed(1)}) rotate(${p.headA || 0})`);
      const closed = p.blink || p.sleep;
      eyeL.setAttribute("opacity", closed ? 0 : 1); eyeR.setAttribute("opacity", closed ? 0 : 1);
      lid.setAttribute("opacity", closed ? 1 : 0);
      api.pts = { chest: c, rump: r, head: h, feet: ft };
      return api.pts;
    },
  };
  return api;
}

// ---------------------------------------------------------------- Lulu poses
// every pose returns the full parameter set; t is seconds, ph a gait phase in radians.
const Cat = {
  stand(t, ph) {
    const wag = Math.sin(t * 2.2) * 6;
    return {
      chest: [9, -23], rump: [-14, -23], head: [24, -32], headA: Math.sin(t * 0.7) * 3,
      legs: { fl: [92, 88], fr: [86, 92], hl: [96, 84], hr: [88, 92] },
      tail: [[-20, -26], [-34, -42 + wag], [-30, -62 + wag * 1.4]],
    };
  },
  walk(t, ph) {
    const s = Math.sin(ph), c = Math.cos(ph);
    return {
      chest: [9, -23 + Math.abs(c) * -0.8], rump: [-14, -23], head: [24, -31 + s], headA: 0,
      legs: {
        fl: [90 - 26 * s, 90 - 26 * s + 18 * Math.max(0, -s)],
        fr: [90 + 26 * s, 90 + 26 * s + 18 * Math.max(0, s)],
        hl: [90 + 26 * s, 90 + 26 * s + 18 * Math.max(0, s)],
        hr: [90 - 26 * s, 90 - 26 * s + 18 * Math.max(0, -s)],
      },
      tail: [[-20, -26], [-36, -40], [-34, -60 + Math.sin(ph * 0.5) * 4]],
    };
  },
  run(t, ph) {
    const s = Math.sin(ph), c = Math.cos(ph);
    const bob = -Math.abs(s) * 6;
    return {
      chest: [12, -21 + bob + c * 1.5], rump: [-15, -20 + bob - c * 1.5], head: [27, -27 + bob + c], headA: -8,
      legs: {
        fl: [90 - 60 * s, 90 - 60 * s + 24 * Math.max(0, s)],
        fr: [90 - 52 * s, 90 - 52 * s + 24 * Math.max(0, s)],
        hl: [90 + 55 * Math.sin(ph - 0.5), 90 + 55 * Math.sin(ph - 0.5) + 30],
        hr: [90 + 50 * Math.sin(ph - 0.7), 90 + 50 * Math.sin(ph - 0.7) + 30],
      },
      tail: [[-21, -23 + bob], [-42, -34 + bob + Math.sin(ph) * 4], [-56, -30 + bob - Math.sin(ph) * 5]],
    };
  },
  leap(t, k) {
    // k 0..1 along the jump; stretches out at mid-air
    const st = Math.sin(k * Math.PI);
    return {
      chest: [14, -14 - st * 2], rump: [-14, -8 + st * 2], head: [30, -18 - st * 4], headA: -18 + k * 38,
      legs: { fl: [-16 + k * 30, -8 + k * 40], fr: [-8 + k * 30, 0 + k * 40], hl: [170 - k * 20, 175 - k * 40], hr: [165 - k * 20, 170 - k * 40] },
      tail: [[-21, -12], [-40, -16 + st * 4], [-60, -10 + k * 8]],
    };
  },
  sit(t, look = 0) {
    const breathe = Math.sin(t * 1.8) * 0.7;
    const flick = Math.sin(t * 1.4) * 5;
    return {
      chest: [4, -33 + breathe], rump: [-6, -11], head: [10 + look * 2, -46 + breathe + look * 0.0], headA: look * 6,
      legs: { fl: [90, 90], fr: [86, 90], hl: [-6, 6], hr: [-12, 0] },
      tail: [[-14, -6], [-28, -2 + flick * 0.2], [-30, -12 + flick * 0.5], [-18 + flick * 0.5, -10]],
    };
  },
  loaf(t) {
    const breathe = Math.sin(t * 1.5) * 0.9;
    return {
      chest: [10, -11 + breathe * 0.4], rump: [-12, -11 + breathe * 0.4], head: [24, -12 - breathe * 0.2], headA: 18,
      legs: { fl: [-60, 80], fr: [-40, 80], hl: [20, 100], hr: [30, 100] },
      tail: [[-20, -7], [-26, 1], [-6, 0], [14, -1]],
      blink: false,
    };
  },
  curl(t) {
    const breathe = Math.sin(t * 1.5) * 0.9;
    return {
      chest: [4, -10 + breathe * 0.4], rump: [-14, -10 + breathe * 0.4], head: [14, -10], headA: 70,
      legs: { fl: [-30, 100], fr: [-10, 100], hl: [30, 110], hr: [20, 110] },
      tail: [[-22, -7], [-28, 3], [0, 4], [16, 0]],
      sleep: true,
    };
  },
};
