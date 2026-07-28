/**
 * loads and decorates the hero block
 *
 * Variants (mutually exclusive):
 *  - text:      text only (stone background) — no picture, no `split`
 *  - has-image: full-bleed background image with overlaid text
 *  - banner:    image-only band (authored with `banner`)
 *  - split:     text panel left, image right with optional division
 *               shortcut links overlaid + a scroll cue
 *
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const isSplit = block.classList.contains('split');
  const isBanner = block.classList.contains('banner');
  const rows = [...block.children];

  const content = document.createElement('div');
  content.className = 'hero-content';
  const media = document.createElement('div');
  media.className = 'hero-media';

  rows.forEach((row) => {
    if (picture && row.contains(picture)) {
      media.append(picture);
      const shortcuts = row.querySelector('ul');
      if (shortcuts) {
        shortcuts.className = 'hero-shortcuts';
        media.append(shortcuts);
      }
      row.remove();
    } else {
      content.append(...row.querySelectorAll(':scope > div > *'));
      row.remove();
    }
  });

  if (isSplit) {
    const cue = document.createElement('span');
    cue.className = 'hero-scroll';
    cue.setAttribute('aria-hidden', 'true');
    content.append(cue);
    block.append(content, media);
  } else if (picture) {
    media.classList.add('hero-bg');
    block.prepend(media);
    block.append(content);
    if (!isBanner) block.classList.add('has-image');
  } else {
    block.append(content);
    block.classList.add('text');
  }
}
