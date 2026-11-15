import * as Location from "expo-location";

import { matchNigerianState } from "@/constants/nigeriaStates";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export class LocationServiceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "permission_denied"
      | "unavailable"
      | "outside_nigeria"
      | "unresolved",
  ) {
    super(message);
    this.name = "LocationServiceError";
  }
}

/**
 * Foreground-only location. Explains denial so the UI can offer manual state.
 */
export async function requestForegroundLocation(): Promise<Coordinates> {
  const current = await Location.getForegroundPermissionsAsync();
  let status = current.status;
  if (status !== Location.PermissionStatus.GRANTED) {
    const asked = await Location.requestForegroundPermissionsAsync();
    status = asked.status;
  }
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new LocationServiceError(
      "Location is off. Choose your state to see local weather.",
      "permission_denied",
    );
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

type ReverseGeocodeResponse = {
  countryCode?: string;
  countryName?: string;
  principalSubdivision?: string;
  city?: string;
  locality?: string;
};

/**
 * Resolve Nigerian ADM1-style state from coordinates via BigDataCloud
 * (no API key). Results are matched to the app's state list.
 */
export async function resolveNigerianState(
  coords: Coordinates,
): Promise<{ state: string; label: string }> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new LocationServiceError(
      "Unable to identify your Nigerian state from GPS.",
      "unresolved",
    );
  }

  const data = (await response.json()) as ReverseGeocodeResponse;
  const country = (data.countryCode ?? "").toUpperCase();
  if (country && country !== "NG") {
    throw new LocationServiceError(
      "You appear to be outside Nigeria. Choose a Nigerian state manually.",
      "outside_nigeria",
    );
  }

  const state = matchNigerianState(data.principalSubdivision);
  if (!state) {
    throw new LocationServiceError(
      "Could not match your location to a Nigerian state. Choose one manually.",
      "unresolved",
    );
  }

  const place = data.city || data.locality;
  return {
    state,
    label: place ? `${place}, ${state}` : state,
  };
}
