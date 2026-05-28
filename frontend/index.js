// Polyfills باید قبل از همه چیز import شوند
import { Buffer } from 'buffer';
import process from 'process';

global.Buffer = Buffer;
global.process = process;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
