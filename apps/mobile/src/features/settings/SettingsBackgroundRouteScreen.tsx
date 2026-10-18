import { ScreenScrollView as ScrollView } from "../../components/ui/ScreenScrollView";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText as Text } from "../../components/ui/AppText";
import { mobilePreferencesAtom, updateMobilePreferencesAtom } from "../../state/preferences";
import {
  backgroundKeepAliveAuthorization,
  type BackgroundKeepAliveAuthorization,
  requestBackgroundKeepAliveAuthorization,
} from "../background-keep-alive/backgroundKeepAlive";
import { SettingsActionRow } from "./components/SettingsActionRow";
import { SettingsSection } from "./components/SettingsSection";
import { SettingsSwitchRow } from "./components/SettingsSwitchRow";

function useKeepAliveAuthorization() {
  const [authorization, setAuthorization] = useState<BackgroundKeepAliveAuthorization | null>(null);
  const refresh = useCallback(
    () => void backgroundKeepAliveAuthorization().then(setAuthorization, () => undefined),
    [],
  );
  useEffect(() => {
    refresh();
    // Location access can change in system Settings while this screen is open.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  const request = useCallback(async () => {
    const status = await requestBackgroundKeepAliveAuthorization();
    setAuthorization(status);
    return status;
  }, []);
  return { authorization, request };
}

export function SettingsBackgroundRouteScreen() {
  const insets = useSafeAreaInsets();
  const preferencesResult = useAtomValue(mobilePreferencesAtom);
  const savePreferences = useAtomSet(updateMobilePreferencesAtom);
  const { authorization, request } = useKeepAliveAuthorization();
  const ready =
    AsyncResult.isSuccess(preferencesResult) &&
    !preferencesResult.waiting &&
    authorization !== null;
  const enabled =
    AsyncResult.isSuccess(preferencesResult) &&
    preferencesResult.value.backgroundKeepAliveEnabled === true &&
    authorization === "authorized";

  const setEnabled = async (next: boolean) => {
    if (!next) {
      savePreferences({ backgroundKeepAliveEnabled: false });
      return;
    }
    const status = authorization === "authorized" ? authorization : await request();
    if (status === "authorized") savePreferences({ backgroundKeepAliveEnabled: true });
  };

  return (
    <View collapsable={false} className="flex-1 bg-sheet">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName="gap-3 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) + 18 }}
      >
        <SettingsSection title="Background">
          <SettingsSwitchRow
            icon="wifi"
            label="Stay connected in the background"
            value={enabled}
            disabled={!ready || authorization === "denied"}
            onValueChange={(value) => void setEnabled(value)}
          />
        </SettingsSection>
        <Text className="px-2 text-sm text-foreground-muted">
          iOS pauses T3 Code shortly after you leave it, which closes its connections to your
          environments. Stay connected keeps the app running so threads are up to date the moment
          you return. It uses approximate location only to stay awake; your location is never read
          or sent anywhere. The location indicator shows while it is active, and it uses more
          battery.
        </Text>
        {authorization === "denied" ? (
          <>
            <SettingsSection title="Location access">
              <SettingsActionRow
                icon="wifi"
                label="Open Settings"
                onPress={() => void Linking.openSettings()}
              />
            </SettingsSection>
            <Text className="px-2 text-sm text-foreground-muted">
              Location access is off for T3 Code. Set it to While Using the App in Settings to stay
              connected in the background.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
