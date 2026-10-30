import { BodoniModa_600SemiBold, BodoniModa_600SemiBold_Italic } from '@expo-google-fonts/bodoni-moda';
import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold, useFonts } from '@expo-google-fonts/jost';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { GestorAvisos } from '@/components/gestor-avisos';
import { opcionesCabecera } from '@/constants/navegacion';
import { Colors } from '@/constants/theme';
import { configurarNotificaciones } from '@/infrastructure/notificaciones/ExpoNotificador';
import { migrar, NOMBRE_BASE_DATOS } from '@/infrastructure/sqlite/migraciones';

configurarNotificaciones();
SplashScreen.preventAutoHideAsync();

const tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  // useFonts de @expo-google-fonts/jost sirve para cargar cualquier familia, también la Bodoni.
  const [fuentesListas, errorFuentes] = useFonts({
    BodoniModa_600SemiBold,
    BodoniModa_600SemiBold_Italic,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
  });
  const listo = fuentesListas || !!errorFuentes;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <SQLiteProvider databaseName={NOMBRE_BASE_DATOS} onInit={migrar}>
      <ThemeProvider value={tema}>
        <StatusBar style="dark" />
        <GestorAvisos />
        <Stack screenOptions={{ ...opcionesCabecera, contentStyle: { backgroundColor: Colors.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="producto/escanear" options={{ title: 'Escanear' }} />
          <Stack.Screen name="producto/nuevo" options={{ title: 'Nuevo producto' }} />
          <Stack.Screen name="producto/[id]" options={{ title: '' }} />
          <Stack.Screen name="producto/editar" options={{ title: 'Editar producto' }} />
          <Stack.Screen name="bote/nuevo" options={{ title: 'Nuevo bote' }} />
          <Stack.Screen name="bote/editar" options={{ title: 'Corregir fechas' }} />
          <Stack.Screen name="avisos" options={{ title: 'Avisos' }} />
          <Stack.Screen name="ajustes/index" options={{ title: 'Ajustes' }} />
          <Stack.Screen name="ajustes/ingredientes" options={{ title: 'Ingredientes' }} />
          <Stack.Screen name="producto/ingredientes" options={{ title: 'Ingredientes' }} />
          <Stack.Screen name="compra/anadir" options={{ title: 'Añadir de mi neceser' }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
