/**
 * loads and decorates the article-header block
 * @param {Element} block The article-header block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    if (cell.querySelector('h1, h2')) {
      cell.classList.add('article-header-title');
    } else if (/\b(19|20)\d{2}\b/.test(cell.textContent)) {
      cell.classList.add('article-header-date');
    } else {
      cell.classList.add('article-header-eyebrow');
    }
  });
}
