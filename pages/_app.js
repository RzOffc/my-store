// pages/_app.js
import '../styles/globals.css';
import { AuthProvider } from '../lib/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-custom',
          style: {
            background: '#FEFCF7',
            color: '#1A0F07',
            border: '1px solid rgba(200,135,58,0.3)',
            boxShadow: '0 8px 32px rgba(26,15,7,0.12)',
          },
          success: {
            iconTheme: { primary: '#C8873A', secondary: '#FEFCF7' },
          },
          error: {
            iconTheme: { primary: '#E05252', secondary: '#FEFCF7' },
          },
        }}
      />
    </AuthProvider>
  );
}
