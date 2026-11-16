
# 9ja Health — Technical Technology & Architecture Document

## 1. Document Purpose

This document defines the technologies, frameworks, libraries, APIs, infrastructure, development tools, and technical architecture that will be used to build **9ja Health**.

9ja Health is an AI-powered health and environmental intelligence application for Nigeria.

The initial predictive focus is malaria, but the technical architecture must be designed so that additional health risks and environmental intelligence features can be added later without rebuilding the entire system.

### Core technical pipeline

**GPS → Location → Climate Data → ML Prediction → Prevention screen (likelihood + tips) · Outlook (dataset trends) · RAG assistant · Fresh health updates**

---

# 2. Technology Stack Overview

| Layer | Technology |
|---|---|
| Mobile/Web App | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| Styling | NativeWind / StyleSheet |
| Backend | Python + FastAPI |
| ML | Python + scikit-learn |
| Data Processing | Pandas + NumPy |
| ML Models | Random Forest / Gradient Boosting / Ridge |
| Weather Data | Open-Meteo |
| Malaria Data | Malaria Atlas Project |
| Geographic Boundaries | geoBoundaries |
| Location | Expo Location |
| AI Assistant | LLM + RAG |
| Knowledge Sources | WHO + Nigerian public-health sources |
| Automation | Zapier |
| API Communication | REST / JSON |
| Validation | Pydantic + Zod |
| Testing | Pytest + Jest |
| Code Quality | ESLint + Prettier |
| Version Control | Git + GitHub |
| Backend Deployment | Render / Railway / similar |
| Mobile Distribution | Expo / EAS |
| Environment Variables | `.env` |
| Documentation | Markdown |
| API Documentation | FastAPI OpenAPI / Swagger |

---

# 3. Frontend / Mobile Application

## 3.1 React Native

**Technology:** React Native

React Native will be used to build the main 9ja Health mobile application.

The application should be lightweight and optimized for mobile devices.

### Responsibilities

- User interface
- Dashboard
- Location permission
- GPS collection
- API communication
- Health outlook display
- Weather display
- Prevention recommendations
- AI assistant interface
- Health reports
- Settings
- Notifications
- Local caching

---

# 4. Expo

**Technology:** Expo

Expo will simplify React Native development and provide access to native device functionality.

### Main Expo modules

- `expo-location`
- `expo-notifications`
- `expo-router`
- `expo-constants`
- `expo-device`

Expo Go should be used during rapid development where possible.

For production builds, use **EAS Build** where required.

---

# 5. TypeScript

**Technology:** TypeScript

TypeScript will be used throughout the frontend.

The project should avoid unnecessary `any` types.

Important types should be defined centrally.

Example conceptual types:

- `Location`
- `WeatherData`
- `MalariaOutlook`
- `PreventionRecommendation`
- `HealthReport`
- `ChatMessage`
- `APIResponse`

The frontend should consume strongly typed API responses.

---

# 6. Navigation

**Technology:** Expo Router

Expo Router will manage application navigation.

Recommended structure:

- Home
- Outlook
- Prevention
- Assistant
- Health Reports
- Settings

Navigation should remain simple and predictable.

---

# 7. Frontend Styling

The application can use:

**NativeWind**

or React Native's built-in:

**StyleSheet**

The final choice should prioritize:

- consistency
- performance
- maintainability
- responsive layouts
- easy theme customization

Do not introduce multiple styling systems unnecessarily.

---

# 8. Local Storage

**Technology:**

`@react-native-async-storage/async-storage`

Used for lightweight local persistence.

Possible stored information:

- Last successful health outlook
- User preferences
- Selected state fallback
- Notification preferences
- Cached health reports
- Basic app settings

Do not store sensitive health information unnecessarily.

---

# 9. Location Services

**Technology:** `expo-location`

The app will request foreground location permission.

The basic flow is:

**User opens app → Permission request → GPS coordinates → Backend**

The application should obtain:

- latitude
- longitude

The coordinates are sent to the backend.

The backend determines the user's Nigerian state using geographic boundaries.

---

# 10. Geographic Data

**Source:** geoBoundaries

Nigeria ADM1 boundaries will be used.

ADM1 represents first-level administrative regions, such as:

- Lagos
- Kano
- Kaduna
- Rivers
- Oyo
- Enugu

etc.

The backend will perform:

**GPS coordinates → Point-in-polygon → Nigerian state**

The geographic boundary file will be stored on the backend.

---

# 11. Weather Intelligence

## 11.1 Open-Meteo

**Technology/API:** Open-Meteo

Open-Meteo will provide current and forecast environmental information.

### Potential variables

- Temperature
- Relative humidity
- Rainfall
- Precipitation
- Wind speed
- Rain probability
- Minimum temperature
- Maximum temperature

The exact variables should be defined centrally in the weather service.

---

# 12. Historical Climate Data

Open-Meteo historical/reanalysis data can be used during model development.

Historical data will be used to construct the climate features required by the ML model.

Examples:

- Annual rainfall
- Mean temperature
- Mean humidity
- Number of rainy days
- Previous-year climate
- Multi-year climate averages

Historical climate data must be matched correctly to the geographic and temporal resolution of the malaria dataset.

---

# 13. Malaria Data

## Malaria Atlas Project

**Technology/Data Source:** Malaria Atlas Project

MAP will provide the initial malaria target dataset.

The MVP target is:

**Annual clinical Plasmodium falciparum malaria incidence rate per 1,000 people per year.**

The model will initially operate at the Nigerian state/ADM1 level.

Important distinction:

The model is learning to predict an area-level malaria incidence estimate. It is **not** predicting the probability that a specific individual will contract malaria.

---

# 14. Machine Learning

## 14.1 Python

Python will be the primary language for:

- data processing
- experimentation
- model training
- evaluation
- inference
- ML services

---

# 15. Pandas

**Library:** Pandas

Used for:

- loading datasets
- cleaning data
- joining datasets
- transforming data
- aggregating climate data
- creating training tables
- exploratory data analysis

---

# 16. NumPy

**Library:** NumPy

Used for:

- numerical operations
- array processing
- mathematical transformations
- feature calculations
- ML preprocessing

---

# 17. Scikit-learn

**Library:** scikit-learn

Primary ML framework.

Potential models:

- Ridge Regression
- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor

The final model should be selected based on validation/test performance rather than assuming one algorithm is best.

---

# 18. Optional XGBoost

**Library:** XGBoost

XGBoost may be tested if time permits.

It should only be added if it provides meaningful improvement over simpler models.

The team should avoid adding dependencies simply because they are popular.

---

# 19. ML Target

The primary target is:

**Annual clinical P. falciparum incidence rate per 1,000 people per year.**

The target should remain continuous during model training.

Example:

`124.6 cases / 1,000 people / year`

Risk categories may be generated afterward for user-friendly presentation.

---

# 20. ML Features

Potential features include:

### Climate

- Previous-year mean temperature
- Previous-year rainfall
- Previous-year mean humidity
- Previous-year rainy days
- Three-year rainfall average
- Three-year temperature average

### Historical malaria

- Previous-year malaria incidence

### Geography

- Latitude
- Longitude
- State/region identifier where appropriate

Feature engineering must be implemented reproducibly.

---

# 21. Model Validation

The ML pipeline must use **chronological validation**.

Do not randomly shuffle historical data when that would allow future information to leak into training.

Example structure:

**Training → Earlier years**

**Validation → Later years**

**Testing → Latest unseen years**

The exact years depend on the available dataset.

---

# 22. ML Metrics

At minimum:

- MAE
- RMSE

Also report:

- baseline performance
- model improvement over baseline
- state-level errors
- largest errors
- prediction bias

---

# 23. Baseline Models

The ML model must be compared against simple baselines.

Possible baseline:

**Previous-year incidence**

If the ML model cannot beat a reasonable baseline, this should be documented rather than hidden.

---

# 24. False Positive / False Negative Analysis

Although the primary target is continuous, a research threshold may be applied to evaluate classification-style performance.

Example:

**High incidence = above the 75th percentile of training incidence**

This threshold is a **research/model evaluation threshold**, not a medical threshold.

Report separately:

- False positives
- False negatives

---

# 25. Model Explainability

The application should provide understandable explanations for predictions.

Possible techniques:

- Feature importance
- Permutation importance
- SHAP, if time permits

The user-facing explanation should avoid pretending that a feature proves causation.

Example:

Instead of:

> Rainfall caused your malaria risk.

Use:

> Historical rainfall patterns are among the factors associated with higher predicted incidence in this model.

---

# 26. Model packaging

The trained model and preprocessing stay on the **backend**.

Conceptually:

**Training → Pipeline → saved model artefact → FastAPI inference → Prevention API → Prevention screen**

The mobile application must never load the model file directly. It only displays structured results from the Prevention endpoint.

All trained-model outputs (incidence estimate, category, period, factors, version) feed the **Prevention** section. Outlook does not consume ML inference.

---

# 27. Model Metadata

A separate metadata file should accompany the model.

Example information:

- Model version
- Training dataset
- Training period
- Feature list
- Target variable
- Evaluation metrics
- Training date
- Model type
- Target units

This improves reproducibility and transparency.

---

# 28. FastAPI Backend

**Technology:** FastAPI

FastAPI will serve as the main backend framework.

Responsibilities:

- API endpoints
- request validation
- authentication if added later
- ML inference
- GPS processing
- weather integration
- AI assistant
- health reports
- prevention logic
- error handling

---

# 29. Pydantic

**Technology:** Pydantic

Pydantic will validate API requests and responses.

Example:

The `/prevention` endpoint should reject:

- missing latitude
- missing longitude
- invalid coordinate values
- malformed JSON

This prevents invalid data from reaching the ML pipeline.

---

# 30. Backend Architecture

The backend should separate responsibilities.

Recommended structure:

`api/`

Contains API routes.

`services/`

Contains business logic.

`ml/`

Contains model and inference logic.

`data/`

Contains geographic/static datasets.

`knowledge_base/`

Contains RAG source material.

Example:

backend/

- main.py
- api/
  - prevention.py
  - chat.py
  - health.py
  - reports.py
- services/
  - location_service.py
  - weather_service.py
  - malaria_service.py
  - prevention_service.py
  - rag_service.py
  - reports_service.py
- ml/
  - feature_builder.py
  - model_metadata.json
  - (saved model artefact — format chosen by the ML engineer)
- data/
  - nigeria_admin1.geojson
- knowledge_base/

---

# 31. Main API

## POST `/api/v1/prevention`

Primary application endpoint for the trained malaria model.

Input:

- latitude
- longitude

Backend process:

**GPS → State → Weather → Feature Construction → ML → Prevention rules → Response**

Response contains (all for the **Prevention** screen):

- location
- malaria likelihood / incidence estimate
- risk category
- prediction period
- important factors
- model version
- environmental conditions used
- prevention recommendations (from the rules engine)
- sources
- timestamps

Outlook uses bundled dataset trends only and does not call this endpoint.

---

# 32. Weather API Service

The weather service should be isolated from the API route.

Responsibilities:

- Open-Meteo requests
- response validation
- normalization
- caching
- error handling

The rest of the application should not directly call Open-Meteo.

---

# 33. Malaria Inference Service

The malaria service should:

1. Load the model once.
2. Receive validated features.
3. Apply the correct preprocessing.
4. Run inference.
5. Return structured prediction information.

It should not retrain the model during normal API requests.

---

# 34. Prevention Engine

Prevention recommendations should primarily be deterministic rules.

Example inputs:

- rainfall
- humidity
- temperature
- model category
- time/context

Example outputs:

- mosquito-bite prevention reminders
- standing-water awareness
- bed-net reminders
- general prevention education

The LLM should not be responsible for inventing medical recommendations.

---

# 35. AI Health Assistant

The health assistant will use:

**LLM + Retrieval-Augmented Generation (RAG)**

The assistant will answer questions using trusted health information rather than relying entirely on the model's internal knowledge.

---

# 36. RAG Knowledge Base

Primary sources:

- WHO
- Nigerian public-health institutions
- verified government health information
- other approved authoritative sources

Potential Nigerian sources:

- NCDC
- Federal Ministry of Health and Social Welfare
- NPHCDA
- National Malaria Elimination Programme

The source list should be explicitly maintained.

---

# 37. RAG Pipeline

Basic architecture:

**User Question**

↓

**Question Processing**

↓

**Knowledge Retrieval**

↓

**Relevant Sources**

↓

**LLM**

↓

**Grounded Answer**

↓

**Source Citations**

The assistant should indicate when information is unavailable rather than inventing an answer.

---

# 38. AI Safety

The assistant must not:

- diagnose users
- prescribe medication
- provide medication dosages
- pretend to be a doctor
- invent medical information
- claim certainty where evidence is uncertain

The assistant should encourage professional medical care when appropriate.

Emergency or severe symptoms should be handled with appropriate escalation guidance.

---

# 39. Health Report Automation

**Technology:** Zapier

Zapier will automate the collection and processing of Nigerian health updates.

Potential flow:

**Health Source → Zapier → Filter → AI Processing → Backend → App**

The automation can:

- detect new health updates
- extract article information
- summarize content
- classify topic
- identify location
- identify urgency
- send structured data to the backend

---

# 40. Health Report Data

Each report should contain structured fields such as:

- Title
- Summary
- Source
- Publication date
- Original URL
- Topic
- Location
- Urgency
- AI-generated summary indicator

The original source must always be preserved.

---

# 41. REST API

Communication between mobile and backend will use REST APIs.

Data format:

**JSON**

Example conceptual flow:

React Native

↓

HTTP request

↓

FastAPI

↓

Service

↓

External API / ML / Database

↓

JSON response

↓

React Native

---

# 42. API Client

The frontend should have a centralized API client.

Do not scatter raw `fetch()` calls throughout UI components.

Recommended organization:

`services/api.ts`

or a feature-based API service structure.

This allows:

- consistent error handling
- request configuration
- API base URL management
- easier backend replacement
- cleaner components

---

# 43. React Query / TanStack Query

**Technology:** TanStack Query

Recommended for server-state management.

Useful for:

- fetching outlook
- caching responses
- retrying requests
- loading states
- error states
- invalidating stale data

This is preferable to manually managing every API request with local React state.

---

# 44. Zod

**Technology:** Zod

Zod can be used on the TypeScript side for runtime validation of important API responses.

This creates an additional safety layer between:

**Backend → Network → Frontend**

---

# 45. Notifications

**Technology:** Expo Notifications

Used for:

- daily health reminders
- new health reports
- prevention reminders
- future environmental alerts

Notifications should not make alarming medical claims.

---

# 46. Database

For the MVP, the team should avoid introducing a database unless persistent server-side storage is actually required.

If persistent storage is needed, a PostgreSQL-compatible database should be used.

Potential technology:

**Supabase PostgreSQL**

Possible future uses:

- user accounts
- saved health reports
- notification preferences
- historical outlooks
- analytics
- user settings

The MVP should not add a database simply for the sake of having one.

---

# 47. Authentication

Authentication is **not required for the core MVP**.

The main predictive experience should work without forcing users to create an account.

If accounts become necessary later:

**Supabase Auth**

can be introduced.

---

# 48. Caching

Caching should be used to reduce unnecessary external API requests.

Potential cache targets:

- Open-Meteo responses
- health reports
- static geographic data
- RAG retrieval data

The cache strategy should respect data freshness requirements.

---

# 49. Environment Variables

Secrets must never be hardcoded.

Examples:

- API keys
- LLM keys
- backend URLs
- database credentials
- Zapier webhook secrets

Development:

`.env`

Production:

Platform-managed environment variables.

Never commit `.env` files containing secrets to GitHub.

---

# 50. Git and GitHub

**Technology:** Git + GitHub

GitHub will be the source-control platform.

Recommended branch structure:

- `main`
- `develop`
- feature branches

Example:

`feature/weather-service`

`feature/ml-inference`

`feature/health-assistant`

Commits should describe actual changes.

---

# 51. Testing

## Frontend

Potential tools:

- Jest
- React Native Testing Library

Test:

- components
- hooks
- API states
- validation
- navigation

## Backend

**Pytest**

Test:

- API endpoints
- GPS validation
- state resolution
- weather service
- ML inference
- prevention rules
- error handling

## ML

Test:

- feature generation
- preprocessing
- model loading
- inference
- prediction schema

---

# 52. Code Quality

Frontend:

- ESLint
- Prettier
- TypeScript strict mode

Backend:

- Ruff
- Black
- Pytest
- Type hints

The codebase should maintain consistent formatting and naming conventions.

---

# 53. Documentation

The repository should contain documentation for:

- setup
- environment variables
- architecture
- API endpoints
- ML pipeline
- model training
- model evaluation
- deployment
- RAG sources
- external APIs

Recommended files:

- `README.md`
- `ARCHITECTURE.md`
- `API.md`
- `ML.md`
- `.env.example`

---

# 54. Deployment

## Frontend

Potential:

**Expo / EAS**

for mobile builds.

## Backend

Potential:

**Render**

or another Python-compatible cloud platform.

The exact provider can change without changing the application architecture.

---

# 55. API Documentation

FastAPI automatically provides OpenAPI documentation.

Development endpoints should expose:

- Swagger UI
- OpenAPI schema

This allows frontend developers to understand the backend contract.

---

# 56. Security

The application should:

- validate all incoming requests
- protect API secrets
- use HTTPS in production
- avoid unnecessary collection of precise location data
- avoid storing GPS coordinates unless necessary
- sanitize user-generated content
- rate-limit expensive endpoints where appropriate
- protect AI endpoints from abuse
- never expose server-side API keys to the mobile application

---

# 57. Privacy

Location is sensitive information.

The MVP should follow a minimal-data principle.

The app should:

- request location only when needed
- use foreground location
- avoid continuous background tracking
- avoid unnecessary storage of exact coordinates
- allow manual state selection if GPS permission is denied

The application should clearly explain why location is requested.

---

# 58. Performance

The application should prioritize:

- fast initial load
- lightweight UI
- minimal API calls
- caching
- lazy loading where useful
- efficient image usage
- efficient ML inference

The ML model should be loaded once when the backend starts.

It should not be loaded for every request.

---

# 59. Error Handling

Every external dependency can fail.

The application must handle:

- GPS unavailable
- permission denied
- Open-Meteo unavailable
- MAP data unavailable
- model unavailable
- backend unavailable
- AI provider unavailable
- Zapier failure
- malformed data

The user should receive useful fallback states instead of raw errors.

---

# 60. Application State States

Every major feature should account for:

### Loading

Data is being retrieved.

### Success

Data is available.

### Empty

No relevant data exists.

### Error

Something failed.

### Offline

Network unavailable.

The UI should never appear broken simply because an API failed.

---

# 61. Recommended Repository Structure

9ja-health/

### `mobile/`

- `app/`
- `components/`
- `features/`
- `services/`
- `hooks/`
- `types/`
- `constants/`
- `assets/`

### `backend/`

- `api/`
- `services/`
- `ml/`
- `data/`
- `knowledge_base/`
- `tests/`
- `main.py`

### `docs/`

- `ARCHITECTURE.md`
- `API.md`
- `ML.md`
- `DATA_SOURCES.md`

### Root

- `README.md`
- `.gitignore`
- `.env.example`

---

# 62. Development Tools

Recommended development tools:

- Cursor
- VS Code
- Git
- GitHub
- Postman or Insomnia
- Expo Go
- Android Emulator
- Chrome/Firefox developer tools
- Python virtual environment
- npm/pnpm
- Jupyter Notebook for ML experimentation

---

# 63. Data Science Environment

The ML team can use:

- Jupyter Notebook
- Pandas
- NumPy
- Matplotlib
- scikit-learn
- optional XGBoost

Notebooks should be used for experimentation, but production logic should eventually move into reusable Python modules.

---

# 64. External Services

The core external services are:

### Malaria Atlas Project

Provides malaria incidence data.

### Open-Meteo

Provides weather and climate data.

### geoBoundaries

Provides Nigerian administrative boundaries.

### WHO

Provides authoritative malaria/health information.

### Nigerian health institutions

Provide local health information.

### LLM Provider

Provides the AI assistant capability.

### Zapier

Automates health-information ingestion.

---

# 65. MVP Technology Boundary

The MVP should deliberately avoid unnecessary complexity.

### Required

- React Native
- Expo
- TypeScript
- FastAPI
- Python
- Pandas
- NumPy
- scikit-learn
- Open-Meteo
- Malaria Atlas Project
- geoBoundaries
- RAG
- LLM
- Zapier
- Git/GitHub

### Useful but optional

- TanStack Query
- Zod
- XGBoost
- SHAP
- PostgreSQL/Supabase
- Jest
- React Native Testing Library

### Avoid unless required

- complex authentication
- social features
- background GPS
- large interactive maps
- custom mobile-native modules
- microservices
- Kubernetes
- complicated event-driven architecture
- unnecessary databases
- training an LLM from scratch

---

# 66. Future Technology Expansion

The architecture should allow future expansion into:

### More diseases

- Dengue
- Cholera
- Lassa fever
- Heat-related health risks
- Other climate-sensitive diseases

### More environmental intelligence

- Air quality
- Flood risk
- Heat stress
- Water quality
- Environmental hazards

### More geographic resolution

Current:

**State/ADM1**

Future:

**LGA → community → potentially finer geographic models**

Only increase geographic resolution when reliable data supports it.

---

# 67. Future ML Improvements

Potential future technologies:

- XGBoost
- LightGBM
- Temporal models
- spatial ML
- geospatial ML
- SHAP
- uncertainty estimation
- ensemble models
- satellite-derived environmental features

These should only be introduced when they improve the product scientifically.

---

# 68. Future AI Improvements

Potential future AI capabilities:

- multilingual health assistant
- Nigerian-language support
- voice assistant
- personalized educational health information
- multimodal health/environmental information
- better RAG retrieval
- source ranking
- automated knowledge-base updates

AI should remain grounded in trusted information.

---

# 69. Future Data Infrastructure

As the product grows, the architecture can evolve toward:

**Data ingestion → Data warehouse → Feature engineering → Model training → Model registry → Inference API → Mobile application**

Possible technologies later:

- PostgreSQL
- object storage
- scheduled pipelines
- MLflow
- Docker
- cloud object storage
- workflow orchestration

These are **future-scale technologies**, not requirements for the hackathon MVP.

---

# 70. Technical Product Principle

The architecture should follow this principle:

**Simple enough to build quickly.**

**Structured enough to maintain.**

**Scientific enough to defend.**

**Flexible enough to scale.**

The team should not build infrastructure simply because it looks impressive.

Every technology must solve a real problem.

---

# 71. Final Technology Map

### User

↓

### React Native + Expo

GPS / UI / Notifications

↓

### FastAPI

API Gateway

↓

### Location Service

GPS → Nigerian State

↓

### Weather Service

Open-Meteo

↓

### ML Service

scikit-learn → Prevention API

↓

### Malaria Data

Malaria Atlas Project

↓

### Health Intelligence (Prevention screen)

Prediction + Environmental Context

↓

### Prevention Engine

Deterministic health recommendations

↓

### RAG Assistant

LLM + WHO + Nigerian health sources

↓

### Health Reports

Zapier + Nigerian health sources

↓

### User

**Understand the environment → Understand the health outlook → Take sensible preventive action → Stay informed.**

---

# 72. Core Technology Philosophy

9ja Health should not be a collection of disconnected AI features.

Each technology has a defined role:

**GPS** tells us where the user is.

**Open-Meteo** tells us what the environment is like.

**Malaria Atlas Project** provides the historical malaria target.

**Machine Learning** identifies patterns and produces an area-level incidence prediction.

**Rules** turn environmental information into practical prevention reminders.

**RAG + LLM** explains health information using trusted sources.

**Zapier** keeps Nigerian health information fresh.

**FastAPI** connects everything.

**React Native + Expo** turns the intelligence into a usable mobile experience.

The final architecture is therefore:

**Location → Data → ML → Intelligence → Prevention → Explanation → Action**

That is the technical foundation of 9ja Health.