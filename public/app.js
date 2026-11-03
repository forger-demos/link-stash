const form = document.getElementById('form');
const urlInput = document.getElementById('url');
const titleInput = document.getElementById('title');
const saveButton = document.getElementById('save');
const urlError = document.getElementById('url-error');
const tagsInput = document.getElementById('tags');
const filterBar = document.getElementById('filter');
const filterTag = document.getElementById('filter-tag');
const clearFilter = document.getElementById('clear-filter');
const empty = document.getElementById('empty');
const list = document.getElementById('links');

let activeTag = '';

function render(links) {
  empty.textContent = activeTag ? `No links tagged ${activeTag}` : 'No links saved yet';
  filterBar.hidden = !activeTag;
  filterTag.textContent = activeTag;
  empty.hidden = links.length > 0;
  list.hidden = links.length === 0;
  list.replaceChildren(
    ...links.map((link) => {
      const item = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.textContent = link.title || link.url;
      anchor.rel = 'noopener noreferrer';
      item.append(anchor);
      if (link.tags.length > 0) {
        const tags = document.createElement('span');
        tags.className = 'tags';
        for (const tag of link.tags) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'tag';
          button.textContent = tag;
          button.setAttribute('aria-label', `Show links tagged ${tag}`);
          button.addEventListener('click', () => setFilter(tag));
          tags.append(button);
        }
        item.append(tags);
      }
      return item;
    }),
  );
}

function showError(message) {
  urlError.textContent = message;
  urlError.hidden = !message;
  urlInput.setAttribute('aria-invalid', message ? 'true' : 'false');
}

async function load() {
  try {
    const res = await fetch(activeTag ? `/api/links?tag=${encodeURIComponent(activeTag)}` : '/api/links');
    if (!res.ok) throw new Error(String(res.status));
    render((await res.json()).links);
  } catch {
    empty.textContent = 'Could not load links. Reload to try again.';
    empty.hidden = false;
    list.hidden = true;
  }
}

function setFilter(tag) {
  activeTag = tag;
  return load();
}

clearFilter.addEventListener('click', () => setFilter(''));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');
  saveButton.disabled = true;
  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({url: urlInput.value, title: titleInput.value, tags: tagsInput.value}),
    });
    if (!res.ok) {
      showError((await res.json()).error);
      return;
    }
    form.reset();
    await load();
  } catch {
    showError('Could not save the link. Try again.');
  } finally {
    saveButton.disabled = false;
  }
});

await load();
