const form = document.getElementById('form');
const urlInput = document.getElementById('url');
const titleInput = document.getElementById('title');
const saveButton = document.getElementById('save');
const urlError = document.getElementById('url-error');
const empty = document.getElementById('empty');
const list = document.getElementById('links');

function render(links) {
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
  const res = await fetch('/api/links');
  render((await res.json()).links);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');
  saveButton.disabled = true;
  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({url: urlInput.value, title: titleInput.value}),
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
