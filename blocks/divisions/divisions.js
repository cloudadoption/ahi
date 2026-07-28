import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Divisions section — a faded aerial background image with stacked cards.
 * Authored structure (one row each):
 *   row 0: background image (single cell with a picture)
 *   row 1: heading (single cell with an h2)
 *   rows 2..n: [ label (optionally a link) | logo image | description ]
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  let bg = null;
  const list = document.createElement('div');
  list.className = 'divisions-list';

  rows.forEach((row) => {
    const cells = [...row.children];
    const picture = row.querySelector('picture');

    if (cells.length === 1 && picture && !row.querySelector('h1, h2, h3')) {
      // background image
      bg = document.createElement('div');
      bg.className = 'divisions-bg';
      const img = picture.querySelector('img');
      if (img) bg.append(createOptimizedPicture(img.src, '', false, [{ width: '2000' }]));
      return;
    }

    if (cells.length === 1 && row.querySelector('h1, h2, h3')) {
      const heading = document.createElement('div');
      heading.className = 'divisions-heading';
      heading.append(...cells[0].childNodes);
      list.append(heading);
      return;
    }

    // division card
    const [labelCell, logoCell, descCell] = cells;
    const link = labelCell ? labelCell.querySelector('a') : null;
    const card = document.createElement(link ? 'a' : 'div');
    card.className = 'divisions-card';
    if (link) {
      card.href = link.href;
      if (link.target) card.target = link.target;
    }

    const label = document.createElement('div');
    label.className = 'divisions-label';
    label.textContent = (labelCell ? labelCell.textContent : '').trim();

    const inner = document.createElement('div');
    inner.className = 'divisions-card-inner';
    if (logoCell) {
      logoCell.className = 'divisions-logo';
      inner.append(logoCell);
    }
    if (descCell) {
      descCell.className = 'divisions-desc';
      inner.append(descCell);
    }

    card.append(label, inner);
    list.append(card);
  });

  block.textContent = '';
  if (bg) block.append(bg);
  block.append(list);
}
