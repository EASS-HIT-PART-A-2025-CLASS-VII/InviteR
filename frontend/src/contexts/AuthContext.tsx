import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';
import type { GuestStatus, Guest, Event, Wave, User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (phoneNumber: string) => Promise<void>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: ProfileData) => Promise<void>;
  setUser: (user: User | null | ((prevUser: User | null) => User | null)) => void;
}

interface ProfileData {
  groomName?: string;
  brideName?: string;
  weddingDate?: string;
  location?: string;
  description?: string;
  groomPhone?: string;
  bridePhone?: string;
  wazeLink?: string;
  payboxLink?: string;
  bitLink?: string;
  receiveStatusUpdates?: boolean;
}

const TEST_OTP = '251219';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored auth state
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('userData');
      }
    }
  }, []);

  const login = async (phoneNumber: string) => {
    try {
      // Clean phone number before sending
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      console.log('Sending OTP request for:', cleanPhoneNumber);
      
      const response = await fetch(API_ENDPOINTS.AUTH.SEND_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: cleanPhoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      console.log('OTP sent successfully:', data);
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string) => {
    try {
      // Clean phone number before verifying
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      console.log('Verifying OTP for:', cleanPhoneNumber);
      
      const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: cleanPhoneNumber, otp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify OTP');
      }

      const data = await response.json();
      console.log('OTP verification response:', data);

      if (!data.user) {
        throw new Error('No user data in response');
      }

      const userData = data.user;

      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      setIsAuthenticated(true);

      // Set user in state
      setUser(userData);

      // Redirect based on user state
      if (userData.isFirstTime) {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }

      return userData;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: ProfileData) => {
    try {
      const response = await fetch(API_ENDPOINTS.USER.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user?.phoneNumber,
          profile: profileData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userData');
    localStorage.removeItem('phoneNumber');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, verifyOTP, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 