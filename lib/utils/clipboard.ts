import { UI_DELAYS } from '../config/ui';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

export function showCopyToast(success: boolean) {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity ${
    success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`;
  toast.textContent = success ? '✓ 已复制到剪贴板' : '✗ 复制失败';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), UI_DELAYS.TOAST_FADE);
  }, UI_DELAYS.TOAST_DISPLAY);
}
