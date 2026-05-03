'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type GsapModule = {
  gsap: {
    fromTo: (target: string | Element, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => void;
    to: (target: Element, vars: Record<string, unknown>) => void;
  };
};

async function loadGsap() {
  try {
    return (await import('gsap')) as GsapModule;
  } catch {
    return null;
  }
}

export function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function animatePage() {
      const gsapModule = await loadGsap();
      if (!gsapModule) return;
      const { gsap } = gsapModule;
      if (!mounted) return;

      gsap.fromTo(
        '[data-page-transition]',
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' },
      );
      gsap.fromTo(
        '[data-animate-item]',
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.38, ease: 'power2.out', stagger: 0.04, delay: 0.05 },
      );
    }

    void animatePage();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function wireButtons() {
      const gsapModule = await loadGsap();
      if (!gsapModule) return;
      const { gsap } = gsapModule;
      const buttons = Array.from(document.querySelectorAll('button, a[href]'));
      const enterHandlers = new Map<Element, () => void>();
      const leaveHandlers = new Map<Element, () => void>();
      const downHandlers = new Map<Element, () => void>();
      const upHandlers = new Map<Element, () => void>();

      buttons.forEach((element) => {
        const onEnter = () => gsap.to(element, { y: -1, duration: 0.18, ease: 'power2.out' });
        const onLeave = () => gsap.to(element, { y: 0, scale: 1, duration: 0.18, ease: 'power2.out' });
        const onDown = () => gsap.to(element, { scale: 0.97, duration: 0.08, ease: 'power2.out' });
        const onUp = () => gsap.to(element, { scale: 1, duration: 0.14, ease: 'power2.out' });
        enterHandlers.set(element, onEnter);
        leaveHandlers.set(element, onLeave);
        downHandlers.set(element, onDown);
        upHandlers.set(element, onUp);
        element.addEventListener('mouseenter', onEnter);
        element.addEventListener('mouseleave', onLeave);
        element.addEventListener('mousedown', onDown);
        element.addEventListener('mouseup', onUp);
      });

      cleanup = () => {
        buttons.forEach((element) => {
          element.removeEventListener('mouseenter', enterHandlers.get(element)!);
          element.removeEventListener('mouseleave', leaveHandlers.get(element)!);
          element.removeEventListener('mousedown', downHandlers.get(element)!);
          element.removeEventListener('mouseup', upHandlers.get(element)!);
        });
      };
    }

    void wireButtons();
    return () => cleanup?.();
  }, [pathname]);

  return <>{children}</>;
}
