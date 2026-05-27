import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Text, TextInput, I18nManager } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import HostScreen from './src/screens/HostScreen';
import JoinScreen from './src/screens/JoinScreen';
import GameScreen from './src/screens/GameScreen';
import ScoreScreen from './src/screens/ScoreScreen';

I18nManager.allowRTL(true);

const DEFAULT_FONT = { fontFamily: 'Vazir' };
// @ts-ignore
const TextAny: any = Text;
TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.style = [DEFAULT_FONT, TextAny.defaultProps.style];
// @ts-ignore
const InputAny: any = TextInput;
InputAny.defaultProps = InputAny.defaultProps || {};
InputAny.defaultProps.style = [DEFAULT_FONT, InputAny.defaultProps.style];

export type RootStackParamList = {
  Home: undefined;
  Host: undefined;
  Join: undefined;
  Game: { role: 'host' | 'client'; name: string };
  Score: { results: any[]; role: 'host' | 'client'; name: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Vazir' },
          contentStyle: { backgroundColor: '#0f172a' },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'اسم فامیل' }} />
        <Stack.Screen name="Host" component={HostScreen} options={{ title: 'ساخت بازی' }} />
        <Stack.Screen name="Join" component={JoinScreen} options={{ title: 'پیوستن به بازی' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'بازی' }} />
        <Stack.Screen name="Score" component={ScoreScreen} options={{ title: 'نتیجه' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
