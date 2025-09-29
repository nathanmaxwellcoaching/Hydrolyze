
import { createTheme } from '@mui/material/styles';

// Based on the provided screenshot (dark theme)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9C27B0', // A vibrant purple accent
    },
    background: {
      default: '#1A1A1A',
      paper: '#242424',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A9A9A9',
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem'
    },
    body2: {
      color: '#A9A9A9',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #333',
          backgroundImage: 'none', // Disables gradient backgrounds from default MUI dark theme
        },
      },
    },
  },
});
