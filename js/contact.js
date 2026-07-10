document.addEventListener('DOMContentLoaded', () => {
  const pre = localStorage.getItem('as-prefill-message');
  const field = document.getElementById('message');
  if (pre && field) {
    field.value = pre;
    localStorage.removeItem('as-prefill-message');
  }
});
