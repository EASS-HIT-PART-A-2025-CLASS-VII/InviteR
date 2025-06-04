import React from 'react';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import { styled } from 'styled-components';
import { useNavigate } from 'react-router-dom';

const HeroSection = styled(Box)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF69B4 0%, #FFD700 100%);
`;

const ContentContainer = styled(Container)`
  text-align: center;
  color: white;
`;

const StartButton = styled(Button)`
  margin-top: 2rem;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  background-color: white;
  color: #FF69B4;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const FeatureCard = styled(Box)`
  padding: 2rem;
  border-radius: 10px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const Home = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <Box>
      <HeroSection>
        <ContentContainer maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            InviteR
          </Typography>
          <Typography variant="h5" gutterBottom>
            ניהול הזמנות לאירועים בקלות ובמהירות
          </Typography>
          <StartButton
            variant="contained"
            size="large"
            onClick={handleStart}
          >
            התחל עכשיו
          </StartButton>
        </ContentContainer>
      </HeroSection>

      <Container sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <Typography variant="h5" gutterBottom>
                הזמנות מותאמות אישית
              </Typography>
              <Typography>
                עיצוב הזמנות ייחודי לאירוע שלכם עם אפשרויות התאמה אישית
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <Typography variant="h5" gutterBottom>
                ניהול אורחים
              </Typography>
              <Typography>
                מעקב אחר תשובות, העלאת רשימת אורחים מקובץ אקסל ושליחת תזכורות
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <Typography variant="h5" gutterBottom>
                תשלומים מאובטחים
              </Typography>
              <Typography>
                אינטגרציה עם Bit ו-Paybox לקבלת מתנות בצורה מאובטחת
              </Typography>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 