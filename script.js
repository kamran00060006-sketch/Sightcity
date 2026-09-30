/* =========================================================
   SIGHTCITY TOUR & TRAVELS — shared script
   Vanilla apart from GSAP. Nothing here is required for the
   page to be readable or for a customer to call.
   ========================================================= */
(function () {
  'use strict';

  /* =======================================================
     EDIT YOUR DETAILS HERE
     These drive every JS-generated link (WhatsApp messages,
     footer email). The plain tel: links in the HTML are listed
     in README.md — change those with find-and-replace.
     ======================================================= */
  var BIZ = {
    phonePrimary:   '8077198576',
    phoneSecondary: '8979698864',
    whatsapp:       '918077198576',          // country code, no +
    email:          'your-email@example.com' // TODO ← replace with the real address
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* =======================================================
     1. HEADER — solid once past the hero media
     ======================================================= */
  var head = $('.topbar');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-solid', window.scrollY > 60);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =======================================================
     2. MOBILE NAV
     ======================================================= */
  var burger = $('.burger');
  var nav = $('.nav');
  var scrim = $('.nav-scrim');

  function setNav(open) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (scrim) scrim.classList.toggle('is-on', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) {
    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });

  /* =======================================================
     3. ACCORDIONS
     ======================================================= */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
    });
  });

  /* =======================================================
     4. ENQUIRY → WHATSAPP
     Builds a message that reads cleanly in the owner's chat list.
     ======================================================= */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function prettyDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  function prettyTime(t) {
    if (!t) return '';
    var p = t.split(':');
    var h = parseInt(p[0], 10);
    var m = p[1] || '00';
    var ap = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ap;
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function setError(field, msg) {
    if (!field) return;
    var box = field.closest('.field');
    if (!box) return;
    box.classList.toggle('has-error', !!msg);
    var e = $('.err', box);
    if (e) e.textContent = msg || '';
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  $$('.enq__form').forEach(function (form) {
    var service = $('[name="service"]', form);
    var date    = $('[name="date"]', form);
    var time    = $('[name="time"]', form);
    var persons = $('[name="persons"]', form);
    var name    = $('[name="name"]', form);

    /* no past dates */
    if (date) date.min = todayISO();

    /* per-page default service, e.g. data-service="Package (Chardham Yatra)" */
    var preset = form.getAttribute('data-service');
    if (preset && service) {
      for (var i = 0; i < service.options.length; i++) {
        if (service.options[i].value === preset) { service.selectedIndex = i; break; }
      }
    }

    /* persons stepper */
    $$('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(persons.value, 10);
        if (isNaN(v)) v = 1;
        v += parseInt(b.getAttribute('data-step'), 10);
        if (v < 1) v = 1;
        if (v > 60) v = 60;
        persons.value = v;
      });
    });

    /* clear errors as the user fixes them */
    [service, date, time, persons].forEach(function (el) {
      if (el) el.addEventListener('change', function () { setError(el, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      if (!service.value) { setError(service, 'Please choose a service.'); ok = false; }

      if (!date.value) {
        setError(date, 'Please pick a date.'); ok = false;
      } else if (date.value < todayISO()) {
        setError(date, 'Please pick today or a later date.'); ok = false;
      } else {
        setError(date, '');
      }

      var pv = parseInt(persons.value, 10);
      if (isNaN(pv) || pv < 1) { setError(persons, 'At least 1 person.'); ok = false; }

      if (!ok) {
        var bad = $('.field.has-error .ctrl', form);
        if (bad) { bad.focus(); }
        return;
      }

      var when = prettyDate(date.value);
      if (time.value) when += ', ' + prettyTime(time.value);

      var lines = [
        'Namaste! Enquiry from Sightcity website',
        '',
        'Service : ' + service.value,
        'Date    : ' + when,
        'Persons : ' + pv
      ];
      if (name && name.value.trim()) lines.push('Name    : ' + name.value.trim());

      /* tells the owner which page the enquiry came from — a "Package"
         enquiry from the Chardham page means something different to one
         from the adventure page */
      var origin = form.getAttribute('data-page');
      if (origin) { lines.push(''); lines.push('(sent from the ' + origin + ' page)'); }

      var url = 'https://wa.me/' + BIZ.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  });

  /* =======================================================
     5. HERO CHIPS + SERVICE DEEP LINKS
     Pre-fill the enquiry service, then scroll to the card.
     ======================================================= */
  $$('[data-fill]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var want = el.getAttribute('data-fill');
      var form = $('.enq__form');
      if (!form) return;
      e.preventDefault();
      var sel = $('[name="service"]', form);
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === want) { sel.selectedIndex = i; break; }
        }
      }
      var target = $('#enquiry');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(function () {
        var d = $('[name="date"]', form);
        if (d) d.focus({ preventScroll: true });
      }, 650);
    });
  });

  /* =======================================================
     5b. TOURS + POPULAR ROUTES — phone / touch slideshow
     On desktop both rows are pure CSS marquees and none of this runs.
     Under SLIDER_MQ the CSS turns each row into a one-card track and this
     drives it with the same model as the hero filmstrip (hero.js): an
     index, go(i), and a translate3d on the track.
       Swipe — a horizontal drag past SWIPE_PX moves one slide; anything
               shorter springs back. Vertical drags are left to the page
               (touch-action: pan-y in the CSS).
       Tap   — the active card is an ordinary link and opens on one tap.
               A tap on a peeking neighbour brings it forward instead.
       Keys  — arrow keys on the row; tabbing to a card slides it in.
     SLIDER_MQ must match the media query in style.css.
     ======================================================= */
  var SLIDER_MQ = window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)');
  var SWIPE_PX = 50;

  function makeSlider(frame) {
    var track = frame.firstElementChild;
    if (!track) return null;
    var cards = Array.prototype.filter.call(track.children, function (c) { return !c.hasAttribute('data-clone'); });
    if (cards.length < 2) return null;

    var label = frame.getAttribute('aria-label') || '';
    var index = 0, on = false;
    var down = false, dragging = false, pid = null;
    var startX = 0, startY = 0, dx = 0, base = 0, swallowUntil = 0, lastDown = 0;

    /* x that centres card i in the frame. offsetLeft ignores the track's
       transform, so this is stable mid-animation. */
    function offsetFor(i) {
      var c = cards[i];
      return (frame.clientWidth - c.offsetWidth) / 2 - c.offsetLeft;
    }

    function place(x, animate) {
      if (!animate) track.classList.add('is-drag');
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
      if (!animate) { void track.offsetWidth; track.classList.remove('is-drag'); }
    }

    function go(i, animate) {
      index = Math.max(0, Math.min(cards.length - 1, i));
      cards.forEach(function (c, n) { c.classList.toggle('is-active', n === index); });
      place(offsetFor(index), animate !== false);
    }

    function set(enable) {
      on = enable;
      if (on) {
        frame.setAttribute('aria-roledescription', 'carousel');
        frame.setAttribute('aria-label', label.replace(/,\s*automatically scrolling/i, ''));
        go(index, false);
      } else {
        /* hand the row back to the CSS marquee */
        down = dragging = false;
        track.classList.remove('is-drag');
        track.style.transform = '';
        frame.removeAttribute('aria-roledescription');
        frame.setAttribute('aria-label', label);
        cards.forEach(function (c) { c.classList.remove('is-active'); });
      }
    }

    frame.addEventListener('pointerdown', function (e) {
      if (!on || (e.pointerType === 'mouse' && e.button !== 0)) return;
      down = true; dragging = false; dx = 0; pid = e.pointerId;
      lastDown = Date.now();
      startX = e.clientX; startY = e.clientY;
      base = offsetFor(index);
    });

    frame.addEventListener('pointermove', function (e) {
      if (!down || e.pointerId !== pid) return;
      dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!dragging) {
        /* mostly vertical: this is a page scroll, not a swipe */
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { down = false; return; }
        if (Math.abs(dx) < 8) return;
        dragging = true;
        track.classList.add('is-drag');
        /* captured only once it is really a drag, so a plain tap still
           lands on the link underneath (see the same note in hero.js) */
        if (frame.setPointerCapture) frame.setPointerCapture(pid);
      }
      /* resist past either end */
      var edge = (index === 0 && dx > 0) || (index === cards.length - 1 && dx < 0);
      track.style.transform = 'translate3d(' + (base + (edge ? dx * 0.35 : dx)) + 'px,0,0)';
    });

    function release() {
      if (!down) return;
      down = false;
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-drag');
      swallowUntil = Date.now() + 400;   // the release is a swipe, never a tap
      if (dx <= -SWIPE_PX) go(index + 1);
      else if (dx >= SWIPE_PX) go(index - 1);
      else go(index);
    }
    frame.addEventListener('pointerup', release);
    frame.addEventListener('pointercancel', function () {
      if (!down) return;
      down = false;
      if (dragging) { dragging = false; track.classList.remove('is-drag'); go(index); }
    });

    frame.addEventListener('click', function (e) {
      if (!on) return;
      if (Date.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); return; }
      var n = cards.indexOf(e.target.closest ? e.target.closest('.tour, .rcard') : null);
      if (n > -1 && n !== index) { e.preventDefault(); go(n); }
    }, true);

    frame.addEventListener('keydown', function (e) {
      if (!on) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    frame.addEventListener('focusin', function (e) {
      /* keyboard focus only — a tap also focuses the link, and sliding here
         would make the click that follows open a card it only meant to bring in */
      if (!on || Date.now() - lastDown < 800) return;
      var n = cards.indexOf(e.target.closest ? e.target.closest('.tour, .rcard') : null);
      if (n > -1 && n !== index) go(n);
    });
    /* a link or image drag would fight the swipe */
    frame.addEventListener('dragstart', function (e) { if (on) e.preventDefault(); });
    /* focus can still scroll an overflow:hidden box where overflow:clip is
       unsupported — the transform is the only thing allowed to move it */
    frame.addEventListener('scroll', function () { frame.scrollLeft = 0; });

    if (window.ResizeObserver) {
      new ResizeObserver(function () { if (on) place(offsetFor(index), false); }).observe(frame);
    }

    return { set: set };
  }

  var sliders = $$('.tr-marquee, .rt-marquee').map(makeSlider).filter(Boolean);
  function applySliders() { sliders.forEach(function (s) { s.set(SLIDER_MQ.matches); }); }
  applySliders();
  if (SLIDER_MQ.addEventListener) SLIDER_MQ.addEventListener('change', applySliders);
  else if (SLIDER_MQ.addListener) SLIDER_MQ.addListener(applySliders);

  /* =======================================================
     6. FOOTER EMAIL from config
     ======================================================= */
  $$('[data-email]').forEach(function (el) {
    el.setAttribute('href', 'mailto:' + BIZ.email);
    if (!el.textContent.trim()) el.textContent = BIZ.email;
  });

  /* =======================================================
     7. MOTION
     Gated three ways: reduced-motion, GSAP present, and no
     errors. If any gate fails the page simply stays static
     and fully visible — .js-motion is never added.
     ======================================================= */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* =======================================================
     LINE SPLITTER
     Wraps each visual line of a heading in its own mask so it can wipe up
     independently. The copy is fixed but the wrap point is not, so lines are
     measured at runtime rather than authored: words are wrapped, grouped by
     the offsetTop they land on, then rebuilt as masked lines.
     ======================================================= */
  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function splitLines(el) {
    var source = el.getAttribute('data-text');
    if (source === null) {
      source = el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('data-text', source);   /* keep the original for re-splits */
    }
    if (!source) return;

    /* pass 1 — measure where the browser actually breaks */
    el.innerHTML = source.split(' ').map(function (w) {
      return '<span class="wd">' + esc(w) + '</span>';
    }).join(' ');

    var lines = [], cur = null, top = null;
    $$('.wd', el).forEach(function (w) {
      var t = Math.round(w.offsetTop);
      if (t !== top) { cur = []; lines.push(cur); top = t; }
      cur.push(w.textContent);
    });

    /* pass 2 — rebuild as masked lines */
    el.innerHTML = lines.map(function (words, i) {
      /* trailing space on every line but the last: laid out as collapsed
         whitespace, but keeps textContent readable for screen readers and
         for anyone copying the heading */
      var tail = (i < lines.length - 1) ? ' ' : '';
      return '<span class="ln" style="--i:' + i + '"><span>' + esc(words.join(' ')) + tail + '</span></span>';
    }).join('');
  }

  /* Re-split on resize: the wrap point moves, and a stale split would mask
     the wrong words. Anything already revealed is restored immediately. */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (!window.__scMotion) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      $$('.h-sec').forEach(function (el) {
        var wasIn = el.classList.contains('is-in');
        el.classList.remove('is-in');
        splitLines(el);
        if (wasIn) { void el.offsetWidth; el.classList.add('is-in'); }
      });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, 200);
  });

  /* Nothing below may leave content hidden. The inline script in <head> adds
     .js-motion (which hides the hero for the entrance) and starts a failsafe
     timer; if we do not claim the flag below, that timer unhides everything. */
  function unhide() {
    document.documentElement.classList.remove('js-motion');
  }

  function initMotion() {
    if (reduced.matches) { unhide(); return; }
    if (!window.gsap || !window.ScrollTrigger) { unhide(); return; }

    var gsap = window.gsap;

    try {
      gsap.registerPlugin(window.ScrollTrigger);
      /* tells the head-script failsafe that motion is genuinely running */
      window.__scMotion = true;

    /* The hero is a filmstrip carousel now and owns its own motion —
       see assets/js/hero.js. Nothing hero-specific belongs here. */


    /* --- scroll reveals --- */
    $$('.reveal').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: .8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    });

    /* --- the label signature: rule draws out after the text settles ---
       One gesture repeated in every section. Repetition is what reads as
       authored; this is the cheapest, highest-value item in the whole plan. */
    $$('.label').forEach(function (el) {
      window.ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { el.classList.add('is-in'); }
      });
    });

    /* --- section headings wipe up line by line ---
       Same vocabulary as the hero headline, so the body opens in the voice
       the hero closed in. */
    $$('.h-sec').forEach(function (el) {
      splitLines(el);
      window.ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { el.classList.add('is-in'); }
      });
    });

    /* supporting copy beside or beneath a heading follows it in */
    $$('.sec-head--split .side, .sec-head--center .lede').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: .7, delay: .12, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    /* --- direction-aware cascades ---
       Every grid arrives in the order its own layout implies, instead of one
       generic bottom-up rise. This is what kills the monotony. */
    $$('[data-stagger]').forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children);
      if (!kids.length) return;
      var kind = group.getAttribute('data-stagger') || 'even';
      var trig = { trigger: group, start: 'top 85%', once: true };

      if (kind === 'fan') {
        /* dealt cards: each starts a little lower than the last */
        kids.forEach(function (card, i) {
          gsap.fromTo(card, { opacity: 0, y: 30 + i * 12 },
            { opacity: 1, y: 0, duration: .85, delay: i * .1, ease: 'power3.out',
              scrollTrigger: trig });
        });

      } else if (kind === 'sides') {
        /* the 55/45 bento converges: each tile enters from its own column.
           Single column (<=860px, matching the CSS) has no sides to come
           from, and a full-width tile parked 36px right pushes the whole
           page wider than the phone — so it just rises there. */
        var twoCol = window.matchMedia('(min-width: 861px)').matches;
        kids.forEach(function (tile, i) {
          var fromLeft = (i % 2 === 0);
          gsap.fromTo(tile, { opacity: 0, x: twoCol ? (fromLeft ? -36 : 36) : 0, y: 14 },
            { opacity: 1, x: 0, y: 0, duration: .8, delay: Math.floor(i / 2) * .12,
              ease: 'power3.out', scrollTrigger: trig });
        });

      } else if (kind === 'center') {
        /* a centred header deserves a symmetrical grid: outward from the middle */
        gsap.fromTo(kids, { opacity: 0, y: 22, scale: .985 },
          { opacity: 1, y: 0, scale: 1, duration: .8, ease: 'power2.out',
            stagger: { each: .09, from: 'center' }, scrollTrigger: trig });

      } else {
        /* 'even' — deliberately the calmest on the page. Confidence reads
           as unhurried, so the trust cards simply arrive. */
        gsap.fromTo(kids, { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power2.out',
            scrollTrigger: trig });
      }
    });

    /* --- trust strip: a quick left-to-right read, then the chips --- */
    var trustItems = $$('.trustbar .trust__i');
    if (trustItems.length) {
      gsap.fromTo(trustItems, { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: .5, stagger: .07, ease: 'power2.out',
          scrollTrigger: { trigger: '.trustbar', start: 'top 95%', once: true } });
      gsap.fromTo($$('.trustbar .chip'), { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: .5, delay: .22, stagger: .05, ease: 'power2.out',
          scrollTrigger: { trigger: '.trustbar', start: 'top 95%', once: true } });
    }

    /* --- image settle: 1.08 → 1 as the card enters --- */
    $$('[data-settle] img').forEach(function (img) {
      gsap.fromTo(img,
        { scale: 1.08 },
        {
          scale: 1, duration: 1.4, ease: 'power2.out',
          scrollTrigger: { trigger: img, start: 'top 90%', once: true }
        }
      );
    });

    /* --- step rail fills as the block scrolls past --- */
    var rail = document.querySelector('.steps__list');
    if (rail) {
      gsap.fromTo(rail, { '--p': 0 }, {
        '--p': 1, ease: 'none',
        scrollTrigger: { trigger: rail, start: 'top 72%', end: 'bottom 62%', scrub: true }
      });
    }

    /* --- step block: the tint travels between steps --- */
    var steps = $$('.step');
    if (steps.length) {
      steps.forEach(function (step, i) {
        window.ScrollTrigger.create({
          trigger: step,
          start: 'top 62%',
          end: 'bottom 45%',
          onToggle: function (self) {
            if (self.isActive) {
              steps.forEach(function (s) { s.classList.remove('is-active'); });
              step.classList.add('is-active');
            }
          }
        });
      });
    }

    } catch (err) {
      /* any failure mid-setup would otherwise leave the hero headline
         permanently invisible — fail open instead */
      window.__scMotion = false;
      /* keep the reason around — a silently swallowed failure here is very
         hard to diagnose later, and costs nothing to record */
      window.__scMotionError = (err && err.message) || String(err);
      unhide();
      if (window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
      }
    }
  }

  /* All four scripts are deferred and run in document order, so GSAP is
     already present here — no need to wait for load, which would mean a
     visible jump on a slow connection. If the CDN failed, window.gsap is
     simply undefined and initMotion unhides and returns. */
  initMotion();

  /* images change layout height, so recompute trigger positions once they land */
  window.addEventListener('load', function () {
    if (window.__scMotion && window.ScrollTrigger) window.ScrollTrigger.refresh();
  });

  /* if the user flips reduced-motion on, stop everything and restore */
  var onReduce = function () {
    if (reduced.matches) {
      document.documentElement.classList.remove('js-motion');
      if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
  };
  if (reduced.addEventListener) reduced.addEventListener('change', onReduce);
  else if (reduced.addListener) reduced.addListener(onReduce);

  /* =======================================================
     8. FOOTER YEAR
     ======================================================= */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
