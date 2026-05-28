import React, { useEffect } from 'react';
import { StatusBar, I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from './src/theme';
import { initSounds } from './src/utils/sounds';

import HomeScreen from './src/screens/HomeScreen';
import HostScreen from './src/screens/HostScreen';
import JoinScreen from './src/screens/JoinScreen';
import GameScreen from './src/screens/GameScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HowToPlayScreen from './src/screens/HowToPlayScreen';

// Force RTL for Persian UI
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch { /* ignore */ }
}

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initSounds();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Host" component={HostScreen} />
          <Stack.Screen name="Join" component={JoinScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Score" component={ScoreScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
