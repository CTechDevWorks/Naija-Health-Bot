import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { coordinatesForState } from "@/constants/nigeriaStates";
import {
  LocationServiceError,
  requestForegroundLocation,
  resolveNigerianState,
  type Coordinates,
} from "@/services/locationService";
import {
  fetchCurrentWeather,
  WeatherServiceError,
  type WeatherSnapshot,
} from "@/services/weatherService";

export type LocationSource = "gps" | "manual" | "unknown";

export type EnvironmentStatus =
  | "loading"
  | "ready"
  | "needs_manual"
  | "weather_error"
  | "error";

type EnvironmentContextValue = {
  status: EnvironmentStatus;
  state: string | null;
  placeLabel: string | null;
  source: LocationSource;
  coords: Coordinates | null;
  weather: WeatherSnapshot | null;
  message: string | null;
  refreshFromGps: () => Promise<void>;
  setManualState: (state: string) => Promise<void>;
};

const Context = createContext<EnvironmentContextValue | null>(null);

async function loadWeather(coords: Coordinates) {
  return fetchCurrentWeather(coords);
}

export function EnvironmentProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<EnvironmentStatus>("loading");
  const [state, setState] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [source, setSource] = useState<LocationSource>("unknown");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const applyWeather = useCallback(async (nextCoords: Coordinates) => {
    const snapshot = await loadWeather(nextCoords);
    setWeather(snapshot);
    setCoords(nextCoords);
    return snapshot;
  }, []);

  const refreshFromGps = useCallback(async () => {
    const id = ++requestId.current;
    setStatus("loading");
    setMessage(null);
    try {
      const position = await requestForegroundLocation();
      if (id !== requestId.current) return;
      const resolved = await resolveNigerianState(position);
      if (id !== requestId.current) return;
      setState(resolved.state);
      setPlaceLabel(resolved.label);
      setSource("gps");
      await applyWeather(position);
      if (id !== requestId.current) return;
      setStatus("ready");
    } catch (error) {
      if (id !== requestId.current) return;
      setWeather(null);
      if (error instanceof LocationServiceError) {
        setSource("unknown");
        setMessage(error.message);
        setStatus(
          error.code === "permission_denied" ||
            error.code === "outside_nigeria" ||
            error.code === "unresolved"
            ? "needs_manual"
            : "error",
        );
        return;
      }
      if (error instanceof WeatherServiceError) {
        setMessage(error.message);
        setStatus("weather_error");
        return;
      }
      setMessage("Unable to update your location right now.");
      setStatus("error");
    }
  }, [applyWeather]);

  const setManualState = useCallback(
    async (nextState: string) => {
      const id = ++requestId.current;
      setStatus("loading");
      setMessage(null);
      setState(nextState);
      setPlaceLabel(nextState);
      setSource("manual");
      const point = coordinatesForState(nextState);
      if (!point) {
        setWeather(null);
        setMessage("No weather point is configured for that state yet.");
        setStatus("weather_error");
        return;
      }
      try {
        await applyWeather(point);
        if (id !== requestId.current) return;
        setStatus("ready");
      } catch (error) {
        if (id !== requestId.current) return;
        setWeather(null);
        setMessage(
          error instanceof WeatherServiceError
            ? error.message
            : "Unable to retrieve weather for that state.",
        );
        setStatus("weather_error");
      }
    },
    [applyWeather],
  );

  useEffect(() => {
    void refreshFromGps();
  }, [refreshFromGps]);

  return (
    <Context.Provider
      value={{
        status,
        state,
        placeLabel,
        source,
        coords,
        weather,
        message,
        refreshFromGps,
        setManualState,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useEnvironment() {
  const value = useContext(Context);
  if (!value) throw new Error("EnvironmentProvider is required");
  return value;
}
