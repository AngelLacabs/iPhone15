document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('.slider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.slide'));
  const dotsContainer = slider.querySelector('.slider__dots');
  let index = 0;
  let isThrottled = false;

  // Create dots, colorized based on slide data-color
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    const color = slide.getAttribute('data-color') || '#ffffff';
    dot.style.background = color;
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function update() {
    slides.forEach((slide, i) => {
      slide.className = 'slide';
      const total = slides.length;
      let delta = i - index;
      if (delta > total / 2) delta -= total;
      if (delta < -total / 2) delta += total;
      const clamped = Math.max(-2, Math.min(2, delta));
      slide.classList.add(`pos${clamped}`);
    });

    dotsContainer.querySelectorAll('button').forEach((b, i) => {
      b.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
  }

  function throttleAdvance(direction) {
    if (isThrottled) return;
    isThrottled = true;
    goTo(index + direction);
    setTimeout(() => (isThrottled = false), 700);
  }

  // Slider controls
  slider.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) < 10) return;
    e.preventDefault();
    throttleAdvance(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') throttleAdvance(1);
    if (e.key === 'ArrowLeft') throttleAdvance(-1);
  });

  update();

  // Step-by-step reveal
  const stepSection = document.querySelector('.step-reveal');
  if (stepSection) {
    const cards = Array.from(stepSection.querySelectorAll('.reveal-card'));
    let current = -1;
    let stepThrottle = false;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && current < 0) {
          current = 0;
          cards[current]?.classList.add('is-visible');
        }
      });
    }, { threshold: 0.3 });
    io.observe(stepSection);

    window.addEventListener('wheel', () => {
      if (stepThrottle) return;
      const rect = stepSection.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      if (!inView) return;
      if (current + 1 < cards.length) {
        current += 1;
        cards[current]?.classList.add('is-visible');
      }
      stepThrottle = true;
      setTimeout(() => (stepThrottle = false), 700);
    }, { passive: true });
  }

  // Auto-reveal + parallax
  const autoSections = Array.from(document.querySelectorAll('.auto-reveal'));
  if (autoSections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.reveal-card').forEach((el) => el.classList.add('is-visible'));
        }
      });
    }, { threshold: 0.25 });
    autoSections.forEach((sec) => io.observe(sec));

    let rafId = null;
    function updateParallax() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        autoSections.forEach((sec) => {
          const rect = sec.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (!inView) {
            rafId = null;
            return;
          }
          const factor = (rect.top - window.innerHeight / 2) / window.innerHeight;
          sec.querySelectorAll('.parallax-layer').forEach((img) => {
            img.style.transform = `translateY(${factor * 16}px)`;
          });
        });
        rafId = null;
      });
    }
    document.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }
});