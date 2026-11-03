const res = await fetch('/api/links');
const {count} = await res.json();
if (count > 0) {
  document.getElementById('empty').hidden = true;
  document.getElementById('links').hidden = false;
}
