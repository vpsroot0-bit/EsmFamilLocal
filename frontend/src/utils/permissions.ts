import { PermissionsAndroid, Platform } from 'react-native';

export async function requestNetworkPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const perms: any[] = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ];
    if ((PermissionsAndroid.PERMISSIONS as any).NEARBY_WIFI_DEVICES) {
      perms.push((PermissionsAndroid.PERMISSIONS as any).NEARBY_WIFI_DEVICES);
    }
    const result = await PermissionsAndroid.requestMultiple(perms);
    return Object.values(result).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}
