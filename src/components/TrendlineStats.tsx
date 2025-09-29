import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const TrendlineStats = observer(() => {
  if (swimStore.trendlineStats.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Trendline Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {swimStore.trendlineStats.map(stat => (
            <Box key={stat.name} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{stat.name}</Typography>
              <Typography variant="body2">Equation: {stat.equation}</Typography>
              <Typography variant="body2">R-squared: {stat.rSquared}</Typography>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
});

export default TrendlineStats;