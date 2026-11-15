import type { Coordinates } from "@/services/locationService";

export type WeatherSnapshot = {
  temperatureC: number;
  /** Apparent temperature (wind and humidity included). */
  feelsLikeC: number;
  humidityPct: number;
  /** Rainfall shown in the strip — prefers last 1h, else 3h if present. */
  rainfallMm: number;
  windSpeedKmh: number;
  /** Sky cover 0–100; useful for rain and outdoor planning. */
  cloudCoverPct: number;
  summary: string;
  source: string;
  updatedAt: string;
};

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherServiceError";
  }
}

const FETCH_TIMEOUT_MS = 12_000;

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getApiKey(): string {
  return (process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? "").trim();
}

/**
 * Hard timeout via Promise.race — more reliable on React Native than relying
 * solely on AbortController, which can leave fetch hung indefinitely.
 */
async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(
        new WeatherServiceError(
          "Weather request timed out. Check your connection and try again.",
        ),
      );
    }, FETCH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal });
        if (response.status === 401) {
          throw new WeatherServiceError(
            "OpenWeather rejected the API key. Check EXPO_PUBLIC_OPENWEATHER_API_KEY and restart Expo.",
          );
        }
        if (response.status === 429) {
          throw new WeatherServiceError(
            "OpenWeather rate limit reached. Try again in a moment.",
          );
        }
        if (!response.ok) {
          throw new WeatherServiceError(
            `Weather request failed (${response.status}).`,
          );
        }
        return await response.json();
      })(),
      timeout,
    ]);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (timedOut || (error instanceof Error && error.name === "AbortError")) {
      throw new WeatherServiceError(
        "Weather request timed out. Check your connection and try again.",
      );
    }
    throw new WeatherServiceError(
      "Unable to reach OpenWeather. Check your connection and try again.",
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Current weather via OpenWeather Current Weather Data API.
 * @see https://openweathermap.org/current
 */
export async function fetchCurrentWeather(
  coords: Coordinates,
): Promise<WeatherSnapshot> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new WeatherServiceError(
      "Weather is not configured. Add EXPO_PUBLIC_OPENWEATHER_API_KEY to naija-health-bot/.env and restart Expo.",
    );
  }

  const params = new URLSearchParams({
    lat: String(coords.latitude),
    lon: String(coords.longitude),
    appid: apiKey,
    units: "metric",
  });

  const json = (await fetchJson(
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
  )) as {
    weather?: Array<{ description?: string; main?: string }>;
    main?: { temp?: number; feels_like?: number; humidity?: number };
    wind?: { speed?: number };
    clouds?: { all?: number };
    rain?: { "1h"?: number; "3h"?: number };
    dt?: number;
    cod?: number | string;
    message?: string;
  };

  if (json.cod && Number(json.cod) !== 200) {
    throw new WeatherServiceError(
      typeof json.message === "string"
        ? `OpenWeather: ${json.message}`
        : "OpenWeather returned an error.",
    );
  }

  const temperatureC = asNumber(json.main?.temp);
  const humidityPct = asNumber(json.main?.humidity);
  const cloudCoverPct = asNumber(json.clouds?.all) ?? 0;
  // With units=metric, wind.speed is still metres per second.
  const windMs = asNumber(json.wind?.speed);
  const rain1h = asNumber(json.rain?.["1h"]);
  const rain3h = asNumber(json.rain?.["3h"]);
  const rainfallMm = rain1h ?? rain3h ?? 0;
  const summaryRaw =
    json.weather?.[0]?.description?.trim() ||
    json.weather?.[0]?.main?.trim() ||
    "Current conditions";
  const summary =
    summaryRaw.length > 0
      ? summaryRaw.charAt(0).toUpperCase() + summaryRaw.slice(1)
      : "Current conditions";

  if (temperatureC === null || humidityPct === null || windMs === null) {
    throw new WeatherServiceError("OpenWeather response was incomplete.");
  }

  const feelsLikeC = asNumber(json.main?.feels_like) ?? temperatureC;

  const updatedAt =
    typeof json.dt === "number"
      ? new Date(json.dt * 1000).toISOString()
      : new Date().toISOString();

  return {
    temperatureC: Math.round(temperatureC),
    feelsLikeC: Math.round(feelsLikeC),
    humidityPct: Math.round(humidityPct),
    rainfallMm: Math.round(rainfallMm * 10) / 10,
    windSpeedKmh: Math.round(windMs * 3.6),
    cloudCoverPct: Math.round(cloudCoverPct),
    summary,
    source: "OpenWeather",
    updatedAt,
  };
}
