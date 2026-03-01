'use client';

import { MantineProvider, createTheme, localStorageColorSchemeManager } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
});

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'congraduate-color-scheme',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="light"
    >
      {children}
    </MantineProvider>
  );
}
