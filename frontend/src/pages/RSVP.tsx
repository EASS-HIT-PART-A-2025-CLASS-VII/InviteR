import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Grid,
} from '@mui/material';
import { styled } from 'styled-components';

const RSVPForm = styled(Paper)`
  padding: 2rem;
  margin: 2rem 0;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const RSVP = () => {
  const [formData, setFormData] = useState({
    name: '',
    attending: 'yes',
    guestCount: '1',
    dietaryRestrictions: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          הזמנה לאירוע
        </Typography>
        <Typography variant="h5" align="center" color="textSecondary" gutterBottom>
          אנא אשרו את השתתפותכם
        </Typography>

        <RSVPForm>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="שם מלא"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">האם תגיעו לאירוע?</FormLabel>
                  <RadioGroup
                    name="attending"
                    value={formData.attending}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="כן, אגיע" />
                    <FormControlLabel value="no" control={<Radio />} label="לא, לא אגיע" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {formData.attending === 'yes' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="מספר אורחים"
                      name="guestCount"
                      type="number"
                      value={formData.guestCount}
                      onChange={handleChange}
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="הגבלות תזונתיות"
                      name="dietaryRestrictions"
                      value={formData.dietaryRestrictions}
                      onChange={handleChange}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="הודעה אישית"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                >
                  שליחת תשובה
                </Button>
              </Grid>
            </Grid>
          </form>
        </RSVPForm>
      </Box>
    </Container>
  );
};

export default RSVP; 