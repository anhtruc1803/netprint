// ----------------------------------------------------------------------

export const themeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'light',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'netprint',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography — 1Office style (Inter)
   *************************************** */
  fontFamily: {
    primary: 'Inter Variable',
    secondary: 'Inter Variable',
  },
  /** **************************************
   * Palette — 1Office CRM style
   *************************************** */
  palette: {
    primary: {
      lighter: '#FDEAEA',
      light: '#F1948A',
      main: '#E74C3C',
      dark: '#C0392B',
      darker: '#922B21',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#D6E4F0',
      light: '#5DADE2',
      main: '#206BC4',
      dark: '#1A5276',
      darker: '#0E3352',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#D6EAF8',
      light: '#85C1E9',
      main: '#3498DB',
      dark: '#2471A3',
      darker: '#154360',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#D5F5E3',
      light: '#82E0AA',
      main: '#27AE60',
      dark: '#1E8449',
      darker: '#0E6B3F',
      contrastText: '#ffffff',
    },
    warning: {
      lighter: '#FEF9E7',
      light: '#F9E79F',
      main: '#F39C12',
      dark: '#D68910',
      darker: '#9A7D0A',
      contrastText: '#1C252E',
    },
    error: {
      lighter: '#FDEDEC',
      light: '#F1948A',
      main: '#E74C3C',
      dark: '#C0392B',
      darker: '#922B21',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#FCFDFD',
      100: '#F9FAFB',
      200: '#F4F6F8',
      300: '#DFE3E8',
      400: '#C4CDD5',
      500: '#919EAB',
      600: '#637381',
      700: '#454F5B',
      800: '#1C252E',
      900: '#141A21',
    },
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};
