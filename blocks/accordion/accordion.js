import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * "Read our story" style accordion / tabs.
 * Expected authored structure — one row per item, three cells:
 *   [ title | image | description ]
 * On desktop: a left list of toggles and a shared right image+text panel.
 * On mobile: the list stacks with the active panel shown below.
 * @param {Element} block
 */
export default function decorate(block) {
  const items = [...block.children].map((row) => {
    const cells = [...row.children];
    const img = cells[1] ? cells[1].querySelector('img') : null;
    return {
      title: cells[0] ? cells[0].textContent.trim() : '',
      img,
      body: cells[2] || document.createElement('div'),
    };
  });

  block.textContent = '';

  const nav = document.createElement('div');
  nav.className = 'accordion-nav';
  const panel = document.createElement('div');
  panel.className = 'accordion-panel';
  const panelMedia = document.createElement('div');
  panelMedia.className = 'accordion-panel-media';
  const panelBody = document.createElement('div');
  panelBody.className = 'accordion-panel-body';
  panel.append(panelMedia, panelBody);

  const tabs = [];

  function select(index) {
    tabs.forEach((t, i) => t.setAttribute('aria-expanded', i === index ? 'true' : 'false'));
    const item = items[index];
    panelMedia.textContent = '';
    if (item.img) {
      panelMedia.append(createOptimizedPicture(item.img.src, item.img.alt, false, [{ width: '960' }]));
    }
    panelBody.textContent = '';
    panelBody.append(...[...item.body.cloneNode(true).childNodes]);
  }

  items.forEach((item, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'accordion-tab';
    tab.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.textContent = item.title;
    tab.append(label);
    tab.addEventListener('click', () => select(index));
    tabs.push(tab);
    nav.append(tab);
  });

  block.append(nav, panel);
  if (items.length) select(0);
}
