
import { Card, CardContent, Typography, Box } from '@mui/material';
import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  customContent?: React.ReactNode;
}

const SummaryCard = ({ title, value, subValue, customContent }: SummaryCardProps) => {
  return (
    <Card sx={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', height: '100%' }}>
      <CardContent>
        <Typography sx={{ fontSize: 14, color: '#B0B0B0' }} gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
        <Box sx={{ mt: 2, minHeight: 50, backgroundColor: '#2C2C2C', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
          {customContent ? customContent : <Typography sx={{ color: '#B0B0B0', whiteSpace: 'pre-line' }}>{subValue}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
