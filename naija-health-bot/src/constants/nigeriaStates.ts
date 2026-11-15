import { states } from "@/constants/healthContent";

/** Approximate state-capital coordinates for manual-location weather. */
export const stateCoordinates: Record<string, { latitude: number; longitude: number }> =
  {
    Abia: { latitude: 5.4527, longitude: 7.5248 },
    Adamawa: { latitude: 9.3265, longitude: 12.3984 },
    "Akwa Ibom": { latitude: 5.0077, longitude: 7.8537 },
    Anambra: { latitude: 6.2101, longitude: 7.074 },
    Bauchi: { latitude: 10.3158, longitude: 9.8442 },
    Bayelsa: { latitude: 4.7719, longitude: 6.0699 },
    Benue: { latitude: 7.3369, longitude: 8.7404 },
    Borno: { latitude: 11.8333, longitude: 13.15 },
    "Cross River": { latitude: 4.9757, longitude: 8.3417 },
    Delta: { latitude: 5.704, longitude: 5.9339 },
    Ebonyi: { latitude: 6.2649, longitude: 8.0137 },
    Edo: { latitude: 6.335, longitude: 5.6037 },
    Ekiti: { latitude: 7.6211, longitude: 5.2214 },
    Enugu: { latitude: 6.4584, longitude: 7.5464 },
    "FCT Abuja": { latitude: 9.0765, longitude: 7.3986 },
    Gombe: { latitude: 10.2904, longitude: 11.167 },
    Imo: { latitude: 5.485, longitude: 7.035 },
    Jigawa: { latitude: 12.45, longitude: 9.5333 },
    Kaduna: { latitude: 10.51, longitude: 7.4167 },
    Kano: { latitude: 12.0022, longitude: 8.592 },
    Katsina: { latitude: 12.9855, longitude: 7.6171 },
    Kebbi: { latitude: 12.45, longitude: 4.1994 },
    Kogi: { latitude: 7.8, longitude: 6.7333 },
    Kwara: { latitude: 8.4966, longitude: 4.5421 },
    Lagos: { latitude: 6.5244, longitude: 3.3792 },
    Nasarawa: { latitude: 8.5, longitude: 8.2 },
    Niger: { latitude: 9.6, longitude: 6.55 },
    Ogun: { latitude: 7.1608, longitude: 3.3483 },
    Ondo: { latitude: 7.25, longitude: 5.195 },
    Osun: { latitude: 7.7827, longitude: 4.5418 },
    Oyo: { latitude: 7.3775, longitude: 3.947 },
    Plateau: { latitude: 9.8965, longitude: 8.8583 },
    Rivers: { latitude: 4.8156, longitude: 7.0498 },
    Sokoto: { latitude: 13.0059, longitude: 5.2476 },
    Taraba: { latitude: 8.8833, longitude: 11.3667 },
    Yobe: { latitude: 11.748, longitude: 11.966 },
    Zamfara: { latitude: 12.1704, longitude: 6.6646 },
  };

const aliasToState: Record<string, string> = {
  abuja: "FCT Abuja",
  "federal capital territory": "FCT Abuja",
  fct: "FCT Abuja",
  "fct abuja": "FCT Abuja",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
};

/**
 * Map a reverse-geocode admin name onto our locked Nigerian state list.
 */
export function matchNigerianState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+State$/i, "");
  const lower = cleaned.toLowerCase();
  const alias = aliasToState[lower];
  if (alias) return alias;
  const exact = states.find((state) => state.toLowerCase() === lower);
  if (exact) return exact;
  const partial = states.find(
    (state) =>
      lower.includes(state.toLowerCase()) || state.toLowerCase().includes(lower),
  );
  return partial ?? null;
}

export function coordinatesForState(state: string) {
  return stateCoordinates[state] ?? null;
}
