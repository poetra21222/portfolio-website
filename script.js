/* =========================================================================
   PORTOFOLIO — IMPERIAL THEME — SCRIPT.JS
   =========================================================================
   Daftar isi:
   1. Helper umum
   2. Boot screen
   3. Starfield (canvas, parallax)
   4. Custom cursor
   5. Navigasi (smooth scroll, active link, mobile toggle)
   6. Scroll reveal (skills, projects, generic .reveal)
   7. Hero: efek ketik nama + counter statistik
   8. Efek suara (Web Audio API, tanpa file audio eksternal)
   9. Form kontak (simulasi kirim)
   10. Tahun footer otomatis
   ========================================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  /* =======================================================================
     2. BOOT SCREEN
     ======================================================================= */
  function initBootScreen() {
    const bootDuration = prefersReducedMotion ? 50 : 2300;
    window.setTimeout(() => {
      body.classList.remove("is-booting");
    }, bootDuration);

    const fill = document.querySelector(".boot-bar__fill");
    if (fill && !prefersReducedMotion) {
      requestAnimationFrame(() => {
        fill.style.transition = "width 2.1s cubic-bezier(0.16,1,0.3,1)";
        fill.style.width = "100%";
      });
    } else if (fill) {
      fill.style.width = "100%";
    }
  }

  /* =======================================================================
     3. STARFIELD
     ======================================================================= */
  function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width, height, stars, ships;
    let scrollParallax = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildStars();
    }

    function buildStars() {
      const count = Math.floor((width * height) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.25,
        twinkleSpeed: Math.random() * 0.015 + 0.003,
        twinklePhase: Math.random() * Math.PI * 2,
        depth: Math.random() * 0.6 + 0.2 /* untuk parallax */
      }));

      ships = Array.from({ length: 3 }, () => spawnShip());
    }

    function spawnShip() {
      return {
        x: -50,
        y: Math.random() * height * 0.7 + height * 0.05,
        speed: Math.random() * 0.4 + 0.15,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 600
      };
    }

    function drawShip(s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(s.scale, s.scale);
      ctx.fillStyle = "rgba(180, 184, 190, 0.5)";
      ctx.beginPath();
      /* siluet kapal segitiga generik (bukan logo/desain berhak cipta apapun) */
      ctx.moveTo(0, 0);
      ctx.lineTo(-26, 7);
      ctx.lineTo(-26, -7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(200, 16, 46, 0.55)";
      ctx.beginPath();
      ctx.arc(-27, 0, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function tick(t) {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const alpha = prefersReducedMotion
          ? s.baseAlpha
          : s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.25;
        const yOffset = prefersReducedMotion ? 0 : scrollParallax * s.depth * 0.15;
        ctx.fillStyle = `rgba(236, 233, 228, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(s.x, (s.y + yOffset) % height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        for (const s of ships) {
          if (s.delay > 0) { s.delay -= 16; continue; }
          s.x += s.speed;
          drawShip(s);
          if (s.x > width + 60) Object.assign(s, spawnShip());
        }
      }

      requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", () => {
      scrollParallax = window.scrollY;
    }, { passive: true });

    resize();
    requestAnimationFrame(tick);
  }

  /* =======================================================================
     4. CUSTOM CURSOR
     ======================================================================= */
  function initCustomCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll("[data-cursor-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hovering"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hovering"));
    });
  }

  /* =======================================================================
     5. NAVIGASI
     ======================================================================= */
  function initNav() {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("main-nav");

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      nav.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    const sections = document.querySelectorAll("main section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => {
              link.classList.toggle("is-active", link.dataset.section === id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* =======================================================================
     6. SCROLL REVEAL
     ======================================================================= */
  function initScrollReveal() {
    const targets = document.querySelectorAll(
      ".skill-card, .project-card, .reveal"
    );

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");

            /* isi skill bar saat kartu kemampuan terlihat */
            if (entry.target.classList.contains("skill-card")) {
              const fill = entry.target.querySelector(".skill-bar__fill");
              const level = entry.target.dataset.level || "0";
              if (fill) fill.style.width = level + "%";
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el, i) => {
      el.style.transitionDelay = (i % 6) * 60 + "ms";
      observer.observe(el);
    });
  }

  /* =======================================================================
     7. HERO — efek ketik nama & counter statistik
     ======================================================================= */
  function initHero() {
    const nameEl = document.querySelector(".type-target");
    if (nameEl) {
      const fullText = nameEl.dataset.typeText || nameEl.textContent.trim();
      if (prefersReducedMotion) {
        nameEl.textContent = fullText;
        nameEl.classList.add("is-done");
      } else {
        nameEl.textContent = "";
        let i = 0;
        const startDelay = 2400; /* tunggu boot screen selesai */
        window.setTimeout(function typeChar() {
          if (i <= fullText.length) {
            nameEl.textContent = fullText.slice(0, i);
            i++;
            window.setTimeout(typeChar, 55);
          } else {
            nameEl.classList.add("is-done");
          }
        }, startDelay);
      }
    }

    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.counter, 10) || 0;
      if (prefersReducedMotion) {
        el.textContent = target;
        return;
      }
      const duration = 1200;
      const start = performance.now();
      function step(now) {
        const progress = Math.min(1, (now - start) / duration);
        el.textContent = Math.floor(progress * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => counterObserver.observe(c));
  }

  /* =======================================================================
     8. EFEK SUARA — disintesis langsung via Web Audio API (tanpa file .mp3)
     ======================================================================= */
  function initSound() {
    const toggleBtn = document.getElementById("sound-toggle");
    let soundOn = false;
    let audioCtx = null;

    function getCtx() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      return audioCtx;
    }

    function beep(type) {
      if (!soundOn) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "confirm") {
        osc.type = "square";
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.09);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        soundOn = !soundOn;
        toggleBtn.setAttribute("aria-pressed", String(soundOn));
        toggleBtn.setAttribute("aria-label", soundOn ? "Nonaktifkan efek suara" : "Aktifkan efek suara");
        if (soundOn) {
          getCtx();
          beep("confirm");
        }
      });
    }

    document.querySelectorAll("[data-sound], .nav-link, .contact-channel").forEach((el) => {
      el.addEventListener("mouseenter", () => beep(el.dataset.sound === "confirm" ? "confirm" : "hover"));
      el.addEventListener("click", () => beep("confirm"));
    });
  }

  /* =======================================================================
     PARTICLE BURST — percikan kecil saat tombol utama diklik
     ======================================================================= */
  function spawnParticles(x, y) {
    if (prefersReducedMotion) return;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const distance = 30 + Math.random() * 30;
      p.style.cssText = `
        position:fixed; left:${x}px; top:${y}px; width:4px; height:4px;
        background: var(--color-red); border-radius:50%; pointer-events:none;
        z-index: 9998; opacity: 1;
        transition: transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease-out;
      `;
      document.body.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        p.style.opacity = "0";
      });
      window.setTimeout(() => p.remove(), 650);
    }
  }

  function initParticles() {
    document.querySelectorAll(".btn--primary").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (btn.type === "submit") return; /* form ditangani terpisah */
        spawnParticles(e.clientX, e.clientY);
      });
    });
  }

  /* =======================================================================
     9. FORM KONTAK (SIMULASI — situs statis tanpa backend)
     ======================================================================= */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    const toast = document.getElementById("toast");
    if (!form || !toast) return;

    let toastTimer = null;
    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type='submit']");
      spawnParticles(
        btn.getBoundingClientRect().left + btn.offsetWidth / 2,
        btn.getBoundingClientRect().top
      );
      showToast(
        "Transmisi disimulasikan ✦ Form ini belum terhubung ke server. Sambungkan ke layanan seperti Formspree atau EmailJS agar pesan benar-benar terkirim."
      );
      form.reset();
    });
  }

  /* =======================================================================
     10. TAHUN FOOTER
     ======================================================================= */
  function initFooterYear() {
    const yearEl = document.getElementById("footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* =======================================================================
     INIT
     ======================================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    initBootScreen();
    initStarfield();
    initCustomCursor();
    initNav();
    initScrollReveal();
    initHero();
    initSound();
    initParticles();
    initContactForm();
    initFooterYear();
  });
})();
