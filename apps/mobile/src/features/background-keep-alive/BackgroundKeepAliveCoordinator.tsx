import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useEffect } from "react";

import { mobilePreferencesAtom } from "../../state/preferences";
import { setBackgroundKeepAliveEnabled, supportsBackgroundKeepAlive } from "./backgroundKeepAlive";

/** Applies the stored Stay Connected preference to the native keep-alive session. */
export function BackgroundKeepAliveCoordinator() {
  const preferences = useAtomValue(mobilePreferencesAtom);
  const enabled =
    AsyncResult.isSuccess(preferences) && preferences.value.backgroundKeepAliveEnabled === true;

  useEffect(() => {
    if (supportsBackgroundKeepAlive()) setBackgroundKeepAliveEnabled(enabled);
  }, [enabled]);

  return null;
}
