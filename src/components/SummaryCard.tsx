import { Card, CardContent, Typography, Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  customContent?: React.ReactNode;
}

const SummaryCard = ({ title, value, subValue, customContent }: SummaryCardProps) => {
  const cardRef = useRef(null);

  useEffect(() => {
    anime({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 600,
      easing: 'easeOutQuad',
    });
  }, []);

  return (
    <Card 
      ref={cardRef}
      sx={{
        background: 'var(--color-background-card-gradient)',
        color: 'var(--color-text-primary)',
        height: '100%',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        opacity: 0, // Initial state for anime.js
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 0 25px rgba(252, 76, 2, 0.5)',
        },
      }}
    >
      <CardContent>
        <Typography sx={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: '500' }} gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
        <Box sx={{ 
          mt: 2, 
          minHeight: 50, 
          backgroundColor: 'rgba(0,0,0,0.2)', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 1 
        }}>
          {customContent ? customContent : <Typography sx={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-line', textAlign: 'center', fontSize: '0.8rem' }}>{subValue}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;