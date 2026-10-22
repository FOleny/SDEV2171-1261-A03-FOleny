import { Platform } from 'react-native';

// The Android emulator reaches your computer at 10.0.2.2.
// The iOS simulator and the browser can use localhost.
// On a physical phone, replace HOST with your computer's LAN IP, e.g. '192.168.1.50'.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${HOST}:3000/api`;
