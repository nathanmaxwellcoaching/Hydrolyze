
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
      elevation={3} // Added elevation for consistency with Paper components
      sx={{
        // Use the standard dark card background for better readability.
        background: 'var(--color-background-card)',
        color: 'var(--color-text-light)',
        height: '100%',
        borderRadius: 4, // Standardized to theme spacing unit
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', // More subtle shadow
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        willChange: 'transform', // Performance optimization for animations
        // Add a subtle color accent with a top border.
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: `3px solid ${gradient || 'var(--color-accent-green)'}`, // Use gradient prop for color or default
        '&:hover': {
          // The hover effect is now a more subtle glow, improving readability.
          boxShadow: `0 0 15px -5px ${gradient || 'var(--color-accent-green)'}`, // Adjusted hover shadow
        },
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <Box>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom> {/* Changed to subtitle1 */}
            {title}
          </Typography>
          <Typography variant="h6" component="div" fontWeight="bold" sx={{ mb: 1 }}> {/* Changed to h6 */}
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
