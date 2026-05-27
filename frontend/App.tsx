import React from 'react';
import { StatusBar, I18nManager } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import HostScreen from './src/screens/HostScreen';
import JoinScreen from './src/screens/JoinScreen';
import GameScreen from './src/screens/GameScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HowToPlayScreen from './src/screens/HowToPlayScreen';

import { Colors } from './src/theme';

// Force RTL once. Reload happens automatically the first launch.
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch { /* ignore */ }
}

const Stack = createNativeStackNavigator();

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bg,
    card: Colors.bg,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <NavigationContainer theme={NavTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bg },
            headerTintColor: Colors.text,
            headerTitleStyle: { fontFamily: 'IRANSans-Bold', fontSize: 18 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Host" component={HostScreen} options={{ title: 'میزبانی' }} />
          <Stack.Screen name="Join" component={JoinScreen} options={{ title: 'پیوستن به بازی' }} />
          <Stack.Screen name="Game" component={GameScreen} options={{ title: 'بازی', headerBackVisible: false }} />
          <Stack.Screen name="Score" component={ScoreScreen} options={{ title: 'نتایج', headerBackVisible: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'تنظیمات' }} />
          <Stack.Screen name="HowToPlay" component={HowToPlayScreen} options={{ title: 'راهنمای بازی' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
