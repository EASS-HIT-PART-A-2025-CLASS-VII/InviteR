import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { styled } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

const ProfileContainer = styled(Container)`
  padding: 2rem 0;
`;

const ProfileForm = styled(Paper)`
  padding: 2rem;
`;

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    groomName: '',
    brideName: '',
    weddingDate: '',
    location: '',
    description: '',
    groomPhone: '',
    bridePhone: '',
    wazeLink: '',
    payboxLink: '',
    bitLink: '',
    receiveStatusUpdates: true
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    // If user has events, populate form with existing data
    if (user?.events && user.events.length > 0) {
      const event = user.events[0];
      let groomName = event.groomName || '';
      let brideName = event.brideName || '';
      // Fallback: parse from event.name if not present
      if ((!groomName || !brideName) && event.name && event.name.includes(' של ') && event.name.includes(' ו')) {
        const parts = event.name.split(' של ')[1].split(' ו');
        groomName = groomName || parts[0].trim();
        brideName = brideName || parts[1].trim();
      }
      setFormData({
        groomName,
        brideName,
        weddingDate: new Date(event.date).toISOString().split('T')[0],
        location: event.location,
        description: event.description || '',
        groomPhone: user.groomPhone || '',
        bridePhone: user.bridePhone || '',
        wazeLink: event.wazeLink || '',
        payboxLink: event.payboxLink || '',
        bitLink: event.bitLink || '',
        receiveStatusUpdates: user.receiveStatusUpdates !== undefined ? user.receiveStatusUpdates : true
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      showSnackbar('הפרופיל עודכן בהצלחה', 'success');
      
      // Initialize default waves for new events
      if (user?.events && user.events.length > 0) {
        const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/waves/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: user.phoneNumber,
            eventId: user.events[0]._id
          }),
        });

        if (!response.ok) {
          throw new Error('שגיאה באתחול הגלים');
        }
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar(error instanceof Error ? error.message : 'שגיאה בעדכון הפרופיל', 'error');
    }
  };

  return (
    <ProfileContainer maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {user?.events && user.events.length > 0 ? 'עריכת פרטי האירוע' : 'פרטי האירוע'}
      </Typography>
      <ProfileForm>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {user?.events && user.events.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    פרטים נוכחיים
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      <strong>שם החתן:</strong> {formData.groomName}
                    </Typography>
                    <Typography variant="subtitle1">
                      <strong>שם הכלה:</strong> {formData.brideName}
                    </Typography>
                    <Typography variant="subtitle1">
                      <strong>תאריך האירוע:</strong> {new Date(formData.weddingDate).toLocaleDateString('he-IL')}
                    </Typography>
                    <Typography variant="subtitle1">
                      <strong>מיקום האירוע:</strong> {formData.location}
                    </Typography>
                    {formData.description && (
                      <Typography variant="subtitle1">
                        <strong>תיאור האירוע:</strong> {formData.description}
                      </Typography>
                    )}
                    {formData.groomPhone && (
                      <Typography variant="subtitle1">
                        <strong>טלפון החתן:</strong> {formData.groomPhone}
                      </Typography>
                    )}
                    {formData.bridePhone && (
                      <Typography variant="subtitle1">
                        <strong>טלפון הכלה:</strong> {formData.bridePhone}
                      </Typography>
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    עריכת פרטים
                  </Typography>
                </Grid>
              </>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="שם החתן"
                name="groomName"
                value={formData.groomName}
                onChange={handleChange}
                required={!user?.events || user.events.length === 0}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="שם הכלה"
                name="brideName"
                value={formData.brideName}
                onChange={handleChange}
                required={!user?.events || user.events.length === 0}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="טלפון החתן"
                name="groomPhone"
                value={formData.groomPhone}
                onChange={handleChange}
                helperText="אופציונלי - יאפשר התחברות גם עם מספר זה"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="טלפון הכלה"
                name="bridePhone"
                value={formData.bridePhone}
                onChange={handleChange}
                helperText="אופציונלי - יאפשר התחברות גם עם מספר זה"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="תאריך האירוע"
                name="weddingDate"
                type="date"
                value={formData.weddingDate}
                onChange={handleChange}
                required={!user?.events || user.events.length === 0}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="מיקום האירוע"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required={!user?.events || user.events.length === 0}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="קישור Waze (אופציונלי)"
                name="wazeLink"
                value={formData.wazeLink}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="קישור Paybox (אופציונלי)"
                name="payboxLink"
                value={formData.payboxLink}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="קישור Bit (אופציונלי)"
                name="bitLink"
                value={formData.bitLink}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="תיאור האירוע"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.receiveStatusUpdates}
                    onChange={handleChange}
                    name="receiveStatusUpdates"
                    color="primary"
                  />
                }
                label="האם תרצו לקבל עדכונים ב-WhatsApp כאשר אורח מאשר הגעה?"
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" gap={2} mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/dashboard')}
                >
                  חזרה לדשבורד
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  שמירה
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </ProfileForm>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </ProfileContainer>
  );
};

export default Profile; 