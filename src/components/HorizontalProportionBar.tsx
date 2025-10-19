import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

interface ProportionBarProps {
  data: {
    label: string;
    value: number;
    color: string;
    tooltip: string;
  }[];
}

const HorizontalProportionBar: React.FC<ProportionBarProps> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        return (
          <Tooltip title={item.tooltip} key={index}>
            <Box
              sx={{
                width: `${percentage}%`,
                backgroundColor: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FFF' }}>
                {`${Math.round(percentage)}%`}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default HorizontalProportionBar;