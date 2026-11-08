(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const targets = [...document.querySelectorAll(
    '.profile-head > *, .profile-bar, .activity-plate, .tech-stack > h2, ' +
    '.tech-stack dt, .tech-stack dd, #projects > h2, #projects li'
  )];
  const active = new Map();
  const play = (element, frames, options) => {
    const animation = element.animate(frames, { fill: 'backwards', ...options });
    active.set(element, animation);
    const cleanup = () => {
      if (active.get(element) === animation) active.delete(element);
    };
    animation.finished.then(cleanup, cleanup);
  };
  const reveal = (element, delay = 0, immediate = false) => {
    observer.unobserve(element);
    element.classList.remove('reveal-pending');
    if (immediate || motion.matches) return;
    const title = element.matches('h2, .profile-wordmark, .profile-identity');
    const image = element.matches('.profile-avatar, .activity-plate');
    const row = element.matches('#projects li');
    const direction = targets.indexOf(element) % 2 ? 1 : -1;
    const avatar = element.matches('.profile-avatar');
    const hero = element.closest('.profile-head');
    // Only transient keyframes: no persistent layout, color, or hover changes.
    const frames = avatar ? [
      { opacity: 0, transform: 'translateY(-160px) rotate(-95deg) scale(.3)', offset: 0 },
      { opacity: 1, transform: 'translateY(12px) rotate(9deg) scale(1.08,.9)', offset: .58 },
      { opacity: 1, transform: 'translateY(-10px) rotate(-4deg) scale(.98,1.03)', offset: .78 },
      { opacity: 1, transform: 'none', offset: 1 }
    ] : hero ? [
      { opacity: 0, transform: 'perspective(800px) translateY(65px) rotateX(-95deg) rotateZ(-6deg) scaleX(.7)', clipPath: 'inset(0 0 100% 0)', transformOrigin: '0 100%' },
      { opacity: 1, transform: 'perspective(800px) translateY(-4px) rotateX(5deg) rotateZ(1deg) scaleX(1.02)', clipPath: 'inset(-12% -4% -12% -4%)', transformOrigin: '0 100%', offset: .8 },
      { opacity: 1, transform: 'none', clipPath: 'inset(-12% -4% -12% -4%)', transformOrigin: '0 100%' }
    ] : title ? [
      { opacity: 0, transform: 'translateY(38px) scale(.92,1.25) skewY(-5deg)', filter: 'blur(9px)', textShadow: '20px -14px 8px #8978c980, -18px 12px 6px #6aacc580' },
      { opacity: .75, transform: 'translateY(-5px) scale(1.02) skewY(.5deg)', filter: 'blur(1px)', textShadow: '5px -3px 3px #8978c940, -4px 3px 3px #6aacc540', offset: .65 },
      { opacity: 1, transform: 'none', filter: 'blur(0px)', textShadow: '0 0 0 transparent, 0 0 0 transparent' }
    ] : image ? [
      { opacity: 0, transform: 'translateY(24px) scale(.94)', filter: 'blur(8px)', clipPath: 'inset(20% 8% 20% 8% round 40%)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)', clipPath: 'inset(0 round 0%)' }
    ] : row ? [
      { opacity: 0, transform: `perspective(1100px) translateY(48px) rotateX(18deg) rotateZ(${direction * 3}deg) scale(.9)`, filter: 'blur(8px)' },
      { opacity: .85, transform: `translateY(-4px) rotateZ(${direction * -.3}deg) scale(1.01)`, filter: 'blur(1px)', offset: .75 },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' }
    ] : [
      { opacity: 0, transform: `translateY(30px) skewY(${direction * 1.2}deg) scale(.985)`, filter: 'blur(6px)', textShadow: '9px -5px 5px #8978c970, -8px 4px 4px #6aacc560' },
      { opacity: .85, transform: 'translateY(-2px) skewY(0deg) scale(1)', filter: 'blur(.5px)', textShadow: '2px -1px 1px #8978c920, -2px 1px 1px #6aacc520', offset: .7 },
      { opacity: 1, transform: 'none', filter: 'blur(0px)', textShadow: '0 0 0 transparent, 0 0 0 transparent' }
    ];
    play(element, frames, {
      duration: hero ? 1250 : title || image ? 1850 : row ? 1700 : 1350,
      delay, easing: hero ? 'cubic-bezier(.16, 1, .3, 1)' : 'cubic-bezier(.22,.5,.2,1)'
    });
    // Separate depths make each project assemble instead of moving as one slab.
    if (row) element.querySelectorAll('img, h3, p').forEach((part, index) => {
      play(part, [
        { opacity: 0, transform: `translateY(${index === 0 ? -24 : 20}px) rotate(${direction * (index === 0 ? 6 : 1)}deg) scale(${index === 0 ? .85 : .98})`, filter: 'blur(7px)' },
        { opacity: .85, transform: 'translateY(-3px) rotate(0deg) scale(1.01)', filter: 'blur(.5px)', offset: .72 },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' }
      ], { duration: 1550, delay: delay + index * 110, easing: 'cubic-bezier(.22,.5,.2,1)' });
    });
  };
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, index) => reveal(entry.target, Math.min(index * 75, 225)));
  }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
  targets.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (!rect.height || rect.bottom <= 0) return;
    if (rect.top < window.innerHeight) {
      // Keep content in the initial viewport immediately visible.
      return;
    }
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
  document.addEventListener('focusin', (event) => {
    const pending = event.target.closest('.reveal-pending');
    if (pending) reveal(pending, 0, true);
    for (const [element, animation] of active) {
      if (element.contains(event.target) || event.target.contains(element)) animation.cancel();
    }
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    targets.forEach((element) => element.classList.remove('reveal-pending'));
    active.forEach((animation) => animation.cancel());
    active.clear();
  });
})();
