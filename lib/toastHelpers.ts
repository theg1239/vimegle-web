import { toast, ToastOptions } from 'react-hot-toast';

const infoOptions: ToastOptions = {
  style: {
    position: 'relative',
    background: 'rgba(32, 32, 32, 0.75)',
    color: '#fff',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    padding: '12px 20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
};

export const infoToast = (message: string) => {
  toast(message, infoOptions);
};
