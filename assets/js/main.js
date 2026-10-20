/*
 * Cerca — interacciones de la landing.
 * JavaScript sin dependencias. Toda animación respeta `prefers-reduced-motion`
 * y el botón global "Pausar animaciones" (WCAG 2.2.2).
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MOTION_KEY = "cerca:motion";

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (_) {
        /* Almacenamiento no disponible: la preferencia dura solo esta visita. */
      }
    },
  };

  /* ------------------------------------------------------------------------
     Estado global de movimiento
     ------------------------------------------------------------------------ */
  const motion = {
    listeners: new Set(),
    get paused() {
      return root.dataset.motion === "paused";
    },
    set(paused, persist) {
      root.dataset.motion = paused ? "paused" : "running";
      if (persist) storage.set(MOTION_KEY, root.dataset.motion);
      $$("[data-motion-toggle]").forEach((btn) => {
        const label = paused ? "Reanudar animaciones" : "Pausar animaciones";
        btn.setAttribute("aria-label", label);
        btn.setAttribute("title", label);
        const text = $("[data-motion-label]", btn);
        if (text) text.textContent = label;
      });
      this.listeners.forEach((fn) => fn(paused));
    },
    onChange(fn) {
      this.listeners.add(fn);
    },
  };

  const stored = storage.get(MOTION_KEY);
  motion.set(stored ? stored === "paused" : reduceQuery.matches, false);

  reduceQuery.addEventListener?.("change", (e) => {
    if (!storage.get(MOTION_KEY)) motion.set(e.matches, false);
  });

  $$("[data-motion-toggle]").forEach((btn) =>
    btn.addEventListener("click", () => motion.set(!motion.paused, true))
  );

  /* ------------------------------------------------------------------------
     Cabecera: estado al hacer scroll, menú móvil y panel de ayuda
     ------------------------------------------------------------------------ */
  const header = $("[data-header]");
  const menuBtn = $("[data-menu-btn]");
  const mobileMenu = $("#mobile-menu");
  const helpBtn = $("[data-help-btn]");
  const helpPanel = $("#help-panel");

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    mobileMenu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    header.classList.toggle("is-open", open);
    if (open) setHelp(false);
  }

  function setHelp(open, { returnFocus = false } = {}) {
    if (!helpBtn || !helpPanel) return;
    helpPanel.classList.toggle("is-open", open);
    helpBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      setMenu(false);
      $("[data-help-title]", helpPanel)?.focus({ preventScroll: true });
    } else if (returnFocus) {
      helpBtn.focus();
    }
  }

  menuBtn?.addEventListener("click", () => setMenu(mobileMenu.hidden));
  mobileMenu?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  helpBtn?.addEventListener("click", () => setHelp(!helpPanel.classList.contains("is-open")));

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (helpPanel?.classList.contains("is-open")) setHelp(false, { returnFocus: true });
    if (mobileMenu && !mobileMenu.hidden) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!helpPanel?.classList.contains("is-open")) return;
    if (!helpPanel.contains(e.target) && !helpBtn.contains(e.target)) setHelp(false);
  });

  window.matchMedia("(min-width: 1081px)").addEventListener?.("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* Enlace activo de la navegación según la sección visible */
  const navLinks = $$(".nav__links a[href^='#']");
  const navTargets = [$("#inicio"), ...navLinks.map((a) => $(a.getAttribute("href")))].filter(Boolean);
  if ("IntersectionObserver" in window && navTargets.length) {
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => {
            if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "location");
            else a.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    navTargets.forEach((t) => navIO.observe(t));
  }

  /* ------------------------------------------------------------------------
     Aparición al hacer scroll + disparadores "en vista"
     ------------------------------------------------------------------------ */
  $$("[data-stagger]").forEach((group) => {
    $$("[data-reveal]", group).forEach((el, i) => el.style.setProperty("--i", i));
  });

  const inViewCallbacks = new WeakMap();
  const onceInView = (el, fn) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) return fn();
    inViewCallbacks.set(el, fn);
    revealIO.observe(el);
  };

  const revealIO =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-in");
              const fn = inViewCallbacks.get(entry.target);
              if (fn) fn();
              revealIO.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        )
      : null;

  $$("[data-reveal], [data-inview]").forEach((el) => {
    if (revealIO) revealIO.observe(el);
    else el.classList.add("is-in");
  });

  /* ------------------------------------------------------------------------
     Texto "scramble" para las etiquetas tipo terminal
     ------------------------------------------------------------------------ */
  const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789_<>/·";
  function scramble(el) {
    const final = el.dataset.text || el.textContent;
    el.dataset.text = final;
    if (motion.paused) {
      el.textContent = final;
      return;
    }
    const duration = 750;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const revealed = Math.floor(p * final.length);
      let out = final.slice(0, revealed);
      for (let i = revealed; i < final.length; i++) {
        out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = final;
    };
    requestAnimationFrame(tick);
  }
  $$("[data-scramble]").forEach((el) => onceInView(el, () => scramble(el)));

  /* ------------------------------------------------------------------------
     Palabra rotativa del titular
     ------------------------------------------------------------------------ */
  function initRotator(el) {
    const words = $$(".rotator__word", el);
    if (words.length < 2) return;
    let index = 0;
    let timer = 0;
    let visible = true;

    const fit = () => {
      el.style.width = `${Math.ceil(words[index].getBoundingClientRect().width)}px`;
    };

    const next = () => {
      const current = words[index];
      index = (index + 1) % words.length;
      const upcoming = words[index];
      current.classList.remove("is-active");
      current.classList.add("is-leaving");
      upcoming.classList.remove("is-leaving");
      upcoming.classList.add("is-active");
      fit();
      window.setTimeout(() => current.classList.remove("is-leaving"), 750);
    };

    /* Se detiene sola tras tres vueltas, en la última palabra ("cerca de ti"). */
    const MAX_STEPS = words.length * 3 - 1;
    let steps = 0;
    const advance = () => {
      next();
      steps += 1;
      if (steps >= MAX_STEPS) window.clearInterval(timer);
    };

    const sync = () => {
      window.clearInterval(timer);
      if (!motion.paused && visible && !document.hidden && steps < MAX_STEPS) timer = window.setInterval(advance, 3200);
    };

    words.forEach((w, i) => w.classList.toggle("is-active", i === 0));
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    document.addEventListener("visibilitychange", sync);
    motion.onChange(sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      }).observe(el);
    }
    sync();
  }
  $$("[data-rotator]").forEach(initRotator);

  /* ------------------------------------------------------------------------
     Red de rutas animada (canvas del hero)
     Cada pulso viaja desde un punto (una persona) hasta el servicio más cercano
     a través de la red: la idea de "acortar la distancia".
     ------------------------------------------------------------------------ */
  function initNetwork(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const host = canvas.closest("section") || document.body;
    const LINK = 150;
    const LINK2 = LINK * LINK;
    let W = 0;
    let H = 0;
    let nodes = [];
    let pulses = [];
    let raf = 0;
    let last = 0;
    let nextSpawn = 0;
    let visible = true;
    const pointer = { x: -1e4, y: -1e4 };

    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

    function seed() {
      const count = Math.round(clamp((W * H) / 14000, 26, 120));
      nodes = Array.from({ length: count }, (_, k) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.018,
        vy: (Math.random() - 0.5) * 0.018,
        r: Math.random() * 1.1 + 0.9,
        service: k % 8 === 0,
        glow: 0,
      }));
      pulses = [];
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (motion.paused) drawStatic();
      else draw();
    }

    function findRoute() {
      const starts = nodes.filter((n) => !n.service);
      const start = starts[(Math.random() * starts.length) | 0];
      if (!start) return null;
      const prev = new Map([[start, null]]);
      const queue = [start];
      let goal = null;
      while (queue.length) {
        const cur = queue.shift();
        if (cur.service) {
          goal = cur;
          break;
        }
        for (const nb of nodes) {
          if (!prev.has(nb) && d2(cur, nb) < LINK2) {
            prev.set(nb, cur);
            queue.push(nb);
          }
        }
      }
      if (!goal) return null;
      const path = [];
      for (let n = goal; n; n = prev.get(n)) path.unshift(n);
      return path.length >= 3 ? path : null;
    }

    function spawn() {
      if (pulses.length >= 4) return;
      const path = findRoute();
      if (!path) return;
      path[0].glow = 1;
      pulses.push({ path, t: 0, fade: 1, done: false });
    }

    function step(dt, now) {
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.x = clamp(n.x, 0, W);
        n.y = clamp(n.y, 0, H);
        n.glow = Math.max(0, n.glow - dt / 1600);
      }
      if (now > nextSpawn) {
        spawn();
        nextSpawn = now + 900 + Math.random() * 900;
      }
      for (const p of pulses) {
        if (!p.done) {
          p.t += dt / 240;
          if (p.t >= p.path.length - 1) {
            p.t = p.path.length - 1;
            p.done = true;
            p.path[p.path.length - 1].glow = 1;
          }
        } else {
          p.fade -= dt / 700;
        }
      }
      pulses = pulses.filter((p) => p.fade > 0);
    }

    function drawEdges() {
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = d2(a, b);
          if (dist < LINK2) {
            const alpha = (1 - Math.sqrt(dist) / LINK) * 0.16;
            ctx.strokeStyle = `rgba(190, 180, 255, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const pd = d2(a, pointer);
        if (pd < 180 * 180) {
          ctx.strokeStyle = `rgba(255, 140, 180, ${((1 - Math.sqrt(pd) / 180) * 0.35).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    function drawPulse(p) {
      const seg = Math.floor(p.t);
      const frac = p.t - seg;
      const pts = p.path.slice(0, seg + 1).map((n) => ({ x: n.x, y: n.y }));
      if (!p.done) {
        const a = p.path[seg];
        const b = p.path[seg + 1];
        pts.push({ x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac });
      }
      const first = pts[0];
      const head = pts[pts.length - 1];
      const grad = ctx.createLinearGradient(first.x, first.y, head.x, head.y);
      grad.addColorStop(0, `rgba(255, 92, 138, ${0.05 * p.fade})`);
      grad.addColorStop(1, `rgba(255, 120, 170, ${0.9 * p.fade})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.stroke();
      if (!p.done) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.shadowColor = "rgba(255, 92, 138, 0.9)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function drawNodes() {
      for (const n of nodes) {
        if (n.service) {
          const g = 0.35 + n.glow * 0.65;
          ctx.fillStyle = `rgba(189, 245, 74, ${(0.08 + n.glow * 0.25).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 7 + n.glow * 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(189, 245, 74, ${g.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = n.glow > 0 ? `rgba(255, 92, 138, ${(0.4 + n.glow * 0.6).toFixed(3)})` : "rgba(220, 215, 255, 0.45)";
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + n.glow * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawEdges();
      pulses.forEach(drawPulse);
      drawNodes();
    }

    function drawStatic() {
      pulses = [];
      const path = findRoute();
      if (path) pulses.push({ path, t: path.length - 1, fade: 0.8, done: true });
      draw();
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(48, now - (last || now));
      last = now;
      step(dt, now);
      draw();
      loop();
    }

    function loop() {
      if (raf || motion.paused || !visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }

    host.addEventListener(
      "pointermove",
      (e) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      },
      { passive: true }
    );
    host.addEventListener("pointerleave", () => {
      pointer.x = pointer.y = -1e4;
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : loop()));
    motion.onChange((paused) => {
      if (paused) {
        stop();
        drawStatic();
      } else loop();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) loop();
        else stop();
      }).observe(canvas);
    }

    resize();
    loop();
  }
  $$("[data-network]").forEach(initNetwork);

  /* ------------------------------------------------------------------------
     Ventana de demostración: simula el flujo guiado en bucle
     ------------------------------------------------------------------------ */
  function initDemo(demo) {
    const body = $(".demo__body", demo);
    const cursor = $(".demo__cursor", demo);
    const pick1 = $("[data-pick='1']", demo);
    const pick2 = $("[data-pick='2']", demo);
    const step2 = $(".demo__step2", demo);
    const skeleton = $(".demo__skeleton", demo);
    const results = $$(".result", demo);
    let timers = [];
    let running = false;
    let visible = false;

    const at = (ms, fn) => timers.push(window.setTimeout(fn, ms));
    const clear = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
    };

    const offsetWithin = (el) => {
      let x = 0;
      let y = 0;
      let node = el;
      while (node && node !== body) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      return { x, y };
    };

    const moveTo = (el) => {
      if (!cursor || !el) return;
      const { x, y } = offsetWithin(el);
      cursor.style.setProperty("--cx", `${x + el.offsetWidth * 0.6}px`);
      cursor.style.setProperty("--cy", `${y + el.offsetHeight * 0.55}px`);
    };

    const click = (el) => {
      cursor?.classList.add("is-click");
      el?.classList.add("is-picked");
      at(180, () => cursor?.classList.remove("is-click"));
    };

    const reset = () => {
      [pick1, pick2].forEach((p) => p?.classList.remove("is-picked"));
      step2?.classList.remove("is-on");
      skeleton?.classList.remove("is-on");
      results.forEach((r) => r.classList.remove("is-on"));
      if (cursor) {
        cursor.style.setProperty("--cx", `${body.offsetWidth * 0.22}px`);
        cursor.style.setProperty("--cy", `${body.offsetHeight * 0.92}px`);
      }
    };

    const showFinal = () => {
      clear();
      [pick1, pick2].forEach((p) => p?.classList.add("is-picked"));
      step2?.classList.add("is-on");
      skeleton?.classList.remove("is-on");
      results.forEach((r) => r.classList.add("is-on"));
      cursor?.classList.remove("is-on");
    };

    const play = () => {
      clear();
      reset();
      at(250, () => cursor?.classList.add("is-on"));
      at(600, () => moveTo(pick1));
      at(1500, () => click(pick1));
      at(1800, () => step2?.classList.add("is-on"));
      at(2300, () => moveTo(pick2));
      at(3200, () => click(pick2));
      at(3500, () => skeleton?.classList.add("is-on"));
      at(4400, () => {
        skeleton?.classList.remove("is-on");
        results.forEach((r, i) => at(i * 220, () => r.classList.add("is-on")));
      });
      at(5200, () => moveTo(results[0]));
      at(6400, () => cursor?.classList.remove("is-on"));
      at(10500, play);
    };

    const sync = () => {
      const shouldRun = visible && !motion.paused && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        play();
      } else if (!shouldRun && running) {
        running = false;
        showFinal();
      } else if (!shouldRun) {
        showFinal();
      }
    };

    motion.onChange(sync);
    document.addEventListener("visibilitychange", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          sync();
        },
        { threshold: 0.25 }
      ).observe(demo);
    } else {
      showFinal();
    }
    showFinal();

    /* Inclinación 3D que se aplana con el scroll */
    const wrap = demo.parentElement;
    let ticking = false;
    const tilt = () => {
      ticking = false;
      if (motion.paused) {
        demo.style.setProperty("--tilt", "0deg");
        demo.style.setProperty("--tilt-scale", "1");
        return;
      }
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh - rect.top) / (vh * 0.75), 0, 1);
      demo.style.setProperty("--tilt", `${((1 - p) * 16).toFixed(2)}deg`);
      demo.style.setProperty("--tilt-scale", `${(0.94 + p * 0.06).toFixed(3)}`);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(tilt);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    motion.onChange(tilt);
    tilt();
  }
  $$("[data-demo]").forEach(initDemo);

  /* ------------------------------------------------------------------------
     Frase que se ilumina palabra por palabra con el scroll
     ------------------------------------------------------------------------ */
  function initStatement(el) {
    const words = [];
    const wrapText = (node, accent) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.append(part);
              return;
            }
            const span = document.createElement("span");
            span.className = accent ? "w w--accent" : "w";
            span.textContent = part;
            words.push(span);
            frag.append(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapText(child, accent || child.hasAttribute("data-accent"));
        }
      });
    };
    wrapText(el, false);

    let ticking = false;
    const update = () => {
      ticking = false;
      if (motion.paused) {
        words.forEach((w) => w.classList.add("is-lit"));
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.82 - rect.top) / (rect.height + vh * 0.32), 0, 1);
      const lit = Math.round(p * words.length * 1.08);
      words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    motion.onChange(update);
    update();
  }
  $$("[data-statement]").forEach(initStatement);

  /* ------------------------------------------------------------------------
     "Cómo funciona": pasos con teléfono fijo
     ------------------------------------------------------------------------ */
  function initSteps(section) {
    const steps = $$(".step", section);
    const screens = $$(".steps__media .screen", section);
    const rail = $(".steps__rail", section);
    const list = $(".steps__list", section);

    /* En pantallas pequeñas cada paso muestra su propia pantalla (copia decorativa). */
    steps.forEach((step, i) => {
      const slot = $(".step__media", step);
      if (!slot || !screens[i]) return;
      const phone = document.createElement("div");
      phone.className = "phone";
      phone.innerHTML = '<div class="phone__notch"></div><div class="phone__screen"></div>';
      const clone = screens[i].cloneNode(true);
      clone.classList.add("is-active");
      $(".phone__screen", phone).append(clone);
      slot.append(phone);
    });

    const setActive = (index) => {
      steps.forEach((s, i) => s.classList.toggle("is-active", i === index));
      screens.forEach((s, i) => s.classList.toggle("is-active", i === index));
    };
    setActive(0);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(steps.indexOf(entry.target));
          });
        },
        { rootMargin: "-48% 0px -48% 0px" }
      );
      steps.forEach((s) => io.observe(s));
    }

    let ticking = false;
    const progress = () => {
      ticking = false;
      if (!rail || !list) return;
      const rect = list.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.5 - rect.top) / rect.height, 0, 1);
      rail.style.setProperty("--progress", p.toFixed(3));
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(progress);
        }
      },
      { passive: true }
    );
    progress();
  }
  $$("[data-steps]").forEach(initSteps);

  /* ------------------------------------------------------------------------
     Pestañas del producto con avance automático (patrón ARIA tabs)
     ------------------------------------------------------------------------ */
  function initTabs(container) {
    const tabs = $$("[role='tab']", container);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const DURATION = 7000;
    let index = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
    let auto = true;
    let progress = 0;
    let raf = 0;
    let last = 0;
    let hovering = false;
    let focused = false;
    let visible = false;

    const canRun = () => auto && visible && !hovering && !focused && !motion.paused && !document.hidden;

    const paintBar = () => {
      tabs.forEach((t, i) => t.style.setProperty("--p", i === index ? (auto ? progress : 1).toFixed(4) : "0"));
    };

    function select(i, { focus = false, user = false } = {}) {
      index = (i + tabs.length) % tabs.length;
      progress = 0;
      if (user) auto = false;
      tabs.forEach((t, k) => {
        const on = k === index;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      const panel = panels[index];
      panel.classList.remove("is-entering");
      void panel.offsetWidth;
      panel.classList.add("is-entering");
      if (focus) tabs[index].focus();
      paintBar();
      container.dispatchEvent(new CustomEvent("tabchange", { detail: { panel } }));
    }

    const frame = (now) => {
      raf = 0;
      const dt = last ? now - last : 0;
      last = now;
      if (canRun()) {
        progress += dt / DURATION;
        if (progress >= 1) select(index + 1);
        else paintBar();
      }
      tick();
    };

    const tick = () => {
      if (raf) return;
      if (!canRun()) {
        last = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, { user: true }));
      tab.addEventListener("keydown", (e) => {
        const keys = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        select(keys[e.key], { focus: true, user: true });
      });
    });

    container.addEventListener("pointerenter", () => {
      hovering = true;
    });
    container.addEventListener("pointerleave", () => {
      hovering = false;
      tick();
    });
    container.addEventListener("focusin", () => {
      focused = true;
    });
    container.addEventListener("focusout", (e) => {
      if (!container.contains(e.relatedTarget)) {
        focused = false;
        tick();
      }
    });
    document.addEventListener("visibilitychange", tick);
    motion.onChange((paused) => {
      if (paused) auto = false;
      paintBar();
      tick();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          tick();
        },
        { threshold: 0.3 }
      ).observe(container);
    }

    if (motion.paused) auto = false;
    select(index);
    tick();
  }
  $$("[data-tabs]").forEach(initTabs);

  /* ------------------------------------------------------------------------
     Líneas del flujo guiado (maqueta): se calculan según la posición real
     ------------------------------------------------------------------------ */
  function initFlow(flow) {
    const svg = $(".flow__lines", flow);
    if (!svg) return;
    const draw = () => {
      if (!flow.offsetParent) return;
      const box = flow.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      $$("path[data-from]", svg).forEach((path) => {
        const a = $(`[data-node='${path.dataset.from}']`, flow);
        const b = $(`[data-node='${path.dataset.to}']`, flow);
        if (!a || !b) return;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const x1 = ra.right - box.left;
        const y1 = ra.top + ra.height / 2 - box.top;
        const x2 = rb.left - box.left;
        const y2 = rb.top + rb.height / 2 - box.top;
        const mx = (x1 + x2) / 2;
        path.setAttribute("d", `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
      });
    };
    window.addEventListener("resize", draw);
    flow.closest("[data-tabs]")?.addEventListener("tabchange", () => requestAnimationFrame(draw));
    document.fonts?.ready.then(draw);
    draw();
  }
  $$("[data-flow]").forEach(initFlow);

  /* ------------------------------------------------------------------------
     Foco de luz que sigue al puntero en las tarjetas
     ------------------------------------------------------------------------ */
  let spotFrame = 0;
  document.addEventListener(
    "pointermove",
    (e) => {
      if (spotFrame) return;
      spotFrame = requestAnimationFrame(() => {
        spotFrame = 0;
        const card = e.target.closest?.(".spot");
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    },
    { passive: true }
  );
})();
