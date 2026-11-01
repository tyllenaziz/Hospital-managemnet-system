import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { isElectronRuntime } from './config/appConfig';
import AppRoutes from './routes/AppRoutes';

function App() {
  const Router = isElectronRuntime() ? HashRouter : BrowserRouter;

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#f8fafc'
            },
            success: {
              style: {
                background: '#065f46',
                color: '#ecfdf5'
              }
            },
            error: {
              style: {
                background: '#991b1b',
                color: '#fef2f2'
              }
            }
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
