import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

export type BackgroundKeepAliveAuthorization = "notDetermined" | "authorized" | "denied";

interface NativeBackgroundKeepAlive {
  authorizationStatus(): Promise<BackgroundKeepAliveAuthorization>;
  requestAuthorization(): Promise<BackgroundKeepAliveAuthorization>;
  setEnabled(enabled: boolean): Promise<void>;
}

// iOS only: Android does not suspend a backgrounded app's sockets the same way.
const native =
  Platform.OS === "ios"
    ? requireOptionalNativeModule<NativeBackgroundKeepAlive>("T3BackgroundKeepAlive")
    : null;

export function supportsBackgroundKeepAlive(): boolean {
  return native !== null;
}

export function backgroundKeepAliveAuthorization(): Promise<BackgroundKeepAliveAuthorization> {
  return native?.authorizationStatus() ?? Promise.resolve("denied");
}

export function requestBackgroundKeepAliveAuthorization(): Promise<BackgroundKeepAliveAuthorization> {
  return native?.requestAuthorization() ?? Promise.resolve("denied");
}

export function setBackgroundKeepAliveEnabled(enabled: boolean): void {
  void native?.setEnabled(enabled).catch(() => undefined);
}
