export interface ToastOptions {
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export function useToast() {
  return {
    showToast({ type = 'info', title, message }: ToastOptions) {
      const bg = type === 'error' ? '#C05B5B' : type === 'success' ? '#5C9E7A' : '#789A99';
      const el = document.createElement('div');
      el.style.cssText = [
        'position:fixed', 'bottom:88px', 'left:50%', 'transform:translateX(-50%)',
        'z-index:9999', 'padding:12px 20px', 'border-radius:16px',
        'font-size:13px', 'font-weight:600', 'color:white',
        `background:${bg}`, 'box-shadow:0 4px 20px rgba(0,0,0,0.18)',
        'max-width:320px', 'text-align:center', 'pointer-events:none',
        'transition:opacity .3s ease',
      ].join(';');
      el.textContent = message ? `${title}: ${message}` : title;
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2700);
    },
  };
}
