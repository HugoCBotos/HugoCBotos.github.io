import { mountAdditionalFigure } from './additional-figures.mjs';

async function start() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  if (!window.JXG) return;
  if (!window.MathJax?.startup?.promise) {
    const script = document.querySelector('script[src*="mathjax@"]');
    if (!script) return;
    await new Promise(resolve => {
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', resolve, { once: true });
    });
  }
  if (!window.MathJax?.startup?.promise) return;
  await window.MathJax.startup.promise;
  const images = [...document.querySelectorAll('img[data-interactive-figure]')];
  const mounted = new WeakSet();
  const mount = image => {
    if (mounted.has(image)) return;
    mounted.add(image);
    try {
      const options = JSON.parse(image.dataset.figureOptions);
      mountAdditionalFigure(image, options);
    } catch (error) {
      console.error('Unable to initialize the interactive figure.', error);
    }
  };
  if (!('IntersectionObserver' in window)) {
    images.forEach(mount);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      mount(entry.target);
    }
  }, { rootMargin: '400px 0px' });
  images.forEach(image => observer.observe(image));
  const mountLinkedFigure = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    for (const image of images) {
      const options = JSON.parse(image.dataset.figureOptions);
      const figureId = options.embed.split('/').pop().replace('.html', '-1');
      if (id !== figureId) continue;
      observer.unobserve(image);
      mount(image);
      break;
    }
  };
  addEventListener('hashchange', mountLinkedFigure);
  mountLinkedFigure();
}

start().catch(console.error);
