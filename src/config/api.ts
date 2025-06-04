export const API_BASE_URL = 'http://localhost:5002';

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
    VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`
  },
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`
  },
  GUESTS: {
    BASE: `${API_BASE_URL}/api/guests`,
    UPDATE_STATUS: `${API_BASE_URL}/api/guests/status`,
    UPDATE_QUANTITY: `${API_BASE_URL}/api/guests/quantity`,
    WAVES: {
      BASE: `${API_BASE_URL}/api/guests/waves`,
      SEND: `${API_BASE_URL}/api/guests/waves/send`
    }
  }
}; 