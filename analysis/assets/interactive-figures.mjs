// Carry the build version into the shared renderer so cached modules update together.
const { mountAdditionalFigure } = await import(`./additional-figures.mjs${new URL(import.meta.url).search}`);

async function start() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  if (!window.JXG || !window.MathJax?.startup?.promise) {
    throw new Error('The local figure libraries could not be loaded.');
  }
  await window.MathJax.startup.promise;
  for (const placeholder of document.querySelectorAll('[data-interactive-figure]')) {
    try {
      mountAdditionalFigure(placeholder, JSON.parse(placeholder.dataset.figureOptions));
    } catch (error) {
      placeholder.textContent = 'Unable to load this figure.';
      console.error('Unable to initialize the interactive figure.', error);
    }
  }
}

start().catch(console.error);
