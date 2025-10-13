import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2755b0ff', // A vibrant purple accent
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
    // ⬇️ JetBrains Mono Nerd Font everywhere
    fontFamily: '"JetBrains Mono Nerd Font", monospace',
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body2: {
      color: '#A9A9A9',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // extra safety: force the font on <body>
        body: {
          fontFamily: '"JetBrains Mono Nerd Font", monospace',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #333',
          backgroundImage: 'none',
        },
      },
    },
  },
});