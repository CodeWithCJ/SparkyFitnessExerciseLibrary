/**
 * Copies text to the clipboard. The modern API only works on secure pages (https or localhost), so
 * it fails on a phone opening the dev server by IP address. The fallback selects a hidden text box
 * and uses the older copy command, which works there.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* use the fallback below */
  }
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  box.style.position = 'fixed';
  box.style.top = '0';
  box.style.opacity = '0';
  document.body.appendChild(box);
  box.select();
  box.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(box);
  return copied;
}
