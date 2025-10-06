
import { Card, CardContent, Typography, Box } from '@mui/material';
import React, { useRef } from 'react';
import anime from 'animejs';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  customContent?: React.ReactNode;
  // Allow passing a custom gradient for variety in the dashboard
  gradient?: string;
}

const SummaryCard = ({ title, value, subValue, customContent, gradient }: SummaryCardProps) => {
  const cardRef = useRef(null);

  // Anime.js hover effects for interactive feedback.
  const handleMouseEnter = () => {
    anime({
      targets: cardRef.current,
      scale: 1.05,
      duration: 300,
      easing: 'easeOutExpo',
    });
  };

  const handleMouseLeave = () => {
    anime({
      targets: cardRef.current,
      scale: 1,
      duration: 400,
      easing: 'easeOutExpo',
    });
  };

  return (
    <Card
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        // Use the standard dark card background for better readability.
        background: 'var(--color-background-card)',
        color: 'var(--color-text-light)',
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        willChange: 'transform', // Performance optimization for animations
        // Add a subtle color accent with a top border.
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: `3px solid ${gradient || 'var(--color-accent-green)'}`, // Use gradient prop for color or default
        '&:hover': {
          // The hover effect is now a more subtle glow, improving readability.
          boxShadow: `0 0 25px -10px ${gradient || 'var(--color-accent-green)'}`,
        },
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: '600', opacity: 0.8 }} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{
          mt: 2,
          minHeight: 40,
          // Inset look for the sub-value/custom content area.
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
        }} >
          {customContent ? customContent : (
            <Typography sx={{ color: 'var(--color-text-light)', opacity: 0.9, whiteSpace: 'pre-line', textAlign: 'center', fontSize: '0.85rem' }}>
              {subValue}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
