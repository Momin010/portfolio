/* ════════════════════════════════════════════════════════════
   scroll-driven motion + light mouse parallax
   ════════════════════════════════════════════════════════════ */

(() => {
  const railFill = document.getElementById('railFill');
  const ticks = document.querySelectorAll('.rail__ticks span');
  const sections = ['hero','origin','now','built','log','contact'].map(id => document.getElementById(id));
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  const droneEl = document.querySelector('.built__drone');
  const rocketModel = document.querySelector('.proj__model--rocket');
  const heroGlobe = document.querySelector('.hero__globe');
  const heroName = document.querySelector('.hero__name');

  let scrollY = 0;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let vh = window.innerHeight;
  let docH = document.documentElement.scrollHeight - vh;

  window.addEventListener('resize', () => {
    vh = window.innerHeight;
    docH = document.documentElement.scrollHeight - vh;
  });

  /* ── mouse tracking (very gentle, only for parallax targets) */
  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth) - 0.5;   /* -0.5..0.5 */
    targetMouseY = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  /* ── scroll capture */
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  /* ── active section tracking via IntersectionObserver */
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio > 0.35) {
        const idx = sections.indexOf(e.target);
        ticks.forEach((t, i) => t.classList.toggle('is-active', i === idx));
      }
    });
  }, { threshold: [0.35, 0.6] });
  sections.forEach(s => s && obs.observe(s));

  /* ── main animation loop */
  function tick() {
    /* mouse easing */
    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;

    /* scroll progress 0..1 */
    const p = Math.max(0, Math.min(1, scrollY / docH));
    if (railFill) railFill.style.setProperty('--p', (p * 100).toFixed(2) + '%');

    /* HERO — name slides up, globe drifts opposite as you scroll out */
    if (heroGlobe) {
      const rect = heroGlobe.getBoundingClientRect();
      const center = (rect.top + rect.height / 2) / vh;            /* 0=top 1=bottom */
      const dy = (0.5 - center) * 120;
      const mx = mouseX * 20;
      const my = mouseY * 20;
      heroGlobe.style.transform =
        `translate3d(${-40 + mx}px, ${-dy + my}px, 0) rotate(${mouseX * 4}deg)`;
    }
    if (heroName) {
      const rect = heroName.getBoundingClientRect();
      const center = (rect.top + rect.height / 2) / vh;
      const dy = (0.5 - center) * -80;
      heroName.style.transform = `translate3d(${mouseX * -12}px, ${dy}px, 0)`;
    }

    /* generic parallax for [data-parallax] — strength is the attr value */
    parallaxEls.forEach(el => {
      if (el === heroGlobe) return; /* handled above */
      const rect = el.getBoundingClientRect();
      const center = (rect.top + rect.height / 2) / vh;
      const strength = parseFloat(el.dataset.parallax) || 0.3;
      const dy = (0.5 - center) * 240 * strength;
      const mx = mouseX * 14 * strength;
      const my = mouseY * 14 * strength;

      let extra = '';
      if (el.dataset.spin === 'true') {
        /* rocket spins slowly w/ scroll */
        const spin = (scrollY * 0.05) % 360;
        extra = ` rotate(${spin * 0.08}deg)`;
      }
      el.style.transform = `translate3d(${mx}px, ${dy + my}px, 0)${extra}`;
    });

    /* DRONE — sweeps across the archive sky as you scroll past it */
    if (droneEl) {
      const built = document.getElementById('built');
      if (built) {
        const rect = built.getBoundingClientRect();
        /* progress through the section: 0 = section top hits viewport bottom,
           1 = section bottom hits viewport top */
        const total = rect.height + vh;
        const passed = vh - rect.top;
        const pp = Math.max(0, Math.min(1, passed / total));
        const x = (1 - pp) * 200 - 300;          /* slides left as we go down */
        const y = Math.sin(pp * Math.PI) * -60;  /* slight arc up */
        const rot = -8 + (pp * 16);
        const mx = mouseX * 22;
        const my = mouseY * 14;
        droneEl.style.transform =
          `translate3d(${x + mx}px, ${y + my}px, 0) rotate(${rot}deg)`;
      }
    }

    /* rocket model — adds a subtle tilt that increases as section enters view */
    if (rocketModel) {
      const rect = rocketModel.getBoundingClientRect();
      const center = (rect.top + rect.height / 2) / vh;
      const tilt = (0.5 - center) * 12;
      rocketModel.style.filter = `drop-shadow(0 ${20 + Math.abs(tilt) * 2}px ${30}px oklch(0.45 0.12 55 / 0.4))`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  /* ── tick click to scroll */
  ticks.forEach((t, i) => {
    t.style.cursor = 'pointer';
    t.addEventListener('click', () => {
      const target = sections[i];
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── ledger rows: reveal as they enter view */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.ledger__row, .log__entry').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.7s ease ${i * 0.04}s, transform 0.7s cubic-bezier(0.2,0.7,0.2,1) ${i * 0.04}s`;
    revealObs.observe(el);
  });
})();
