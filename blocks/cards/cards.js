import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);

  if (block.classList.contains('people')) {
    block.querySelectorAll('.cards-card-body').forEach((body) => {
      const ps = body.querySelectorAll('p');
      if (ps[0]) ps[0].classList.add('name');
      if (ps[1]) ps[1].classList.add('title');
    });
  }
  if (block.classList.contains('news')) {
    block.querySelectorAll('.cards-card-body').forEach((body) => {
      const ps = [...body.querySelectorAll('p')];
      const dateP = ps.find((p) => !p.querySelector('a') && /\b(19|20)\d{2}\b/.test(p.textContent));
      if (dateP) dateP.classList.add('cards-card-date');
    });

    // "Load More" — reveal cards a row (3) at a time
    const cards = [...block.querySelectorAll(':scope > ul > li')];
    const initial = 3;
    const step = 3;
    if (cards.length > initial) {
      let shown = initial;
      const apply = () => cards.forEach((li, i) => { li.hidden = i >= shown; });
      apply();
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'cards-load-more';
      more.textContent = 'Load More';
      more.addEventListener('click', () => {
        shown += step;
        apply();
        if (shown >= cards.length) more.remove();
      });
      block.append(more);
    }
  }
}
