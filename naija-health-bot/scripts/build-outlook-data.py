"""
Build bundled outlook JSON from MAP incidence + NASA POWER yearly CSVs.

Run from repo root:
  python naija-health-bot/scripts/build-outlook-data.py
"""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "nasa_power_yearly"
INCIDENCE_CSV = DATA_DIR / "malaria_incidence.csv"
CLIMATE_CSV = DATA_DIR / "climate_annual_all_states.csv"
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "outlook.json"

# App picker label → dataset names
INCIDENCE_NAME: dict[str, str] = {
    "FCT Abuja": "Abuja",
    "Nasarawa": "Nassarawa",
}
CLIMATE_NAME: dict[str, str] = {
    "FCT Abuja": "Abuja Federal Capital Territory",
}

APP_STATES = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT Abuja",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
]


def load_incidence() -> dict[str, list[dict]]:
    by_state: dict[str, list[tuple[int, float]]] = defaultdict(list)
    with INCIDENCE_CSV.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if row["Metric"] != "Incidence Rate" or row["Units"] != "Cases per Thousand":
                continue
            by_state[row["Name"]].append((int(row["Year"]), float(row["Value"])))

    # Reverse map dataset → app keys
    app_from_inc: dict[str, str] = {v: k for k, v in INCIDENCE_NAME.items()}
    out: dict[str, list[dict]] = {}
    for ds_name, rows in by_state.items():
        app_key = app_from_inc.get(ds_name, ds_name)
        rows.sort(key=lambda x: x[0])
        out[app_key] = [
            {"year": year, "value": round(value, 2)} for year, value in rows
        ]
    return out


def load_climate() -> dict[str, list[dict]]:
    by_state: dict[str, list[tuple[int, dict]]] = defaultdict(list)
    with CLIMATE_CSV.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            year = int(row["weather_year"])
            by_state[row["Name"]].append(
                (
                    year,
                    {
                        "temperature": round(float(row["temperature"]), 1),
                        "rainfall": round(float(row["rainfall"]), 0),
                        "humidity": round(float(row["humidity"]), 1),
                        "windSpeed": round(float(row["wind_speed"]), 2),
                    },
                )
            )

    app_from_clim: dict[str, str] = {}
    for app_key, ds_name in CLIMATE_NAME.items():
        app_from_clim[ds_name] = app_key

    out: dict[str, list[dict]] = {}
    for ds_name, rows in by_state.items():
        app_key = app_from_clim.get(ds_name, ds_name)
        rows.sort(key=lambda x: x[0])
        out[app_key] = [{"year": year, **vals} for year, vals in rows]
    return out


def national_average(incidence: dict[str, list[dict]]) -> list[dict]:
    buckets: dict[int, list[float]] = defaultdict(list)
    for series in incidence.values():
        for point in series:
            buckets[point["year"]].append(point["value"])
    years = sorted(buckets)
    return [
        {"year": y, "value": round(sum(buckets[y]) / len(buckets[y]), 2)}
        for y in years
    ]


def main() -> None:
    if not INCIDENCE_CSV.is_file():
        raise SystemExit(f"Missing {INCIDENCE_CSV}")
    if not CLIMATE_CSV.is_file():
        raise SystemExit(f"Missing {CLIMATE_CSV}")

    incidence = load_incidence()
    climate = load_climate()
    national = national_average(incidence)

    states_payload: dict[str, dict] = {}
    for name in APP_STATES:
        states_payload[name] = {
            "incidence": incidence.get(name, []),
            "climate": climate.get(name, []),
        }

    payload = {
        "meta": {
            "incidenceSource": "Malaria Atlas Project (MAP) Trends",
            "climateSource": "NASA POWER",
            "incidenceUnit": "Estimated cases per 1,000 population",
            "yearsIncidence": "2000–2025",
            "note": "Area-level estimates. Not personal risk or a diagnosis.",
        },
        "nationalAverageIncidence": national,
        "states": states_payload,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()