import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { styled } from 'styled-components';
import { CssBaseline } from '@mui/material';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import GlobalStyles from './styles/globalStyles';

// Pages
import Home from './pages/Home';
import RSVP from './pages/RSVP';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create theme with RTL support
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
  },
  palette: {
    primary: {
      main: '#FF69B4', // Soft pink
    },
    secondary: {
      main: '#FFD700', // Gold
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
      },
    },
  },
});

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #fff;
`;

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles />
        <Router>
          <AuthProvider>
            <AppContainer>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/rsvp/:eventId" element={<RSVP />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppContainer>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 