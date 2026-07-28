function countUp(el, target, suffix) {
  const duration = 1500;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(p * target).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * loads and decorates the stats block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('stat');
    const [valueCell, labelCell] = row.children;
    if (valueCell) valueCell.classList.add('stat-value');
    if (labelCell) labelCell.classList.add('stat-label');
  });
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      block.querySelectorAll('.stat-value').forEach((cell) => {
        const raw = cell.textContent.trim();
        const target = parseInt(raw.replace(/\D/g, ''), 10) || 0;
        const suffix = raw.replace(/[\d,]/g, '');
        countUp(cell, target, suffix);
      });
      obs.disconnect();
    });
  }, { threshold: 0.3 });
  observer.observe(block);
}
