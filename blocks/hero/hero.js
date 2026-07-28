/**
 * loads and decorates the hero block
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const rows = [...block.children];
  const content = document.createElement('div');
  content.className = 'hero-content';
  rows.forEach((row) => {
    if (picture && row.contains(picture)) {
      const bg = document.createElement('div');
      bg.className = 'hero-bg';
      bg.append(picture);
      block.prepend(bg);
      row.remove();
    } else {
      content.append(...row.querySelectorAll(':scope > div > *'));
      row.remove();
    }
  });
  block.append(content);
  if (picture) block.classList.add('has-image');
}
