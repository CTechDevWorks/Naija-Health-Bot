# 9JA HEALTH — MASTER PRODUCT MANAGER BRIEF

## 1. PRODUCT OVERVIEW

**9ja Health** is an AI-powered health and environmental intelligence mobile application designed initially for Nigeria.

The application combines:

- GPS/location intelligence
- Climate and weather data
- Public health data
- Machine learning
- AI-powered health information
- Evidence-based prevention guidance
- Automated Nigerian health reports

The core idea is simple:

> **Turn a user's environment and trusted public-health data into understandable, actionable health intelligence.**

The application should help users understand the health conditions around them, stay informed about relevant health risks, and take sensible preventive action.

The app is **not a diagnostic tool** and should never present itself as one.

---

# 2. THE PROBLEM

People often receive health information in fragmented and difficult-to-use ways.

A user may have access to:

- Weather apps
- News websites
- Government health announcements
- Search engines
- Medical websites
- Generic AI assistants

But these systems are disconnected.

A weather application tells the user that it is raining.

A health website explains diseases.

A government website publishes public-health announcements.

An AI chatbot answers questions.

None of these necessarily answer the more useful question:

> **“What does my environment and the latest public-health information mean for my health today, and what should I be aware of?”**

This problem is particularly relevant in Nigeria, where environmental conditions, geography, climate, and infectious-disease patterns can vary substantially between regions.

Users need a simpler way to connect these pieces of information.

---

# 3. THE SOLUTION

9ja Health brings these components together into one lightweight mobile experience.

The application:

1. Determines the user's location using GPS.
2. Identifies the relevant Nigerian geographic region.
3. Retrieves relevant climate/weather information.
4. Uses a machine-learning model to estimate area-level health risk where appropriate.
5. Provides evidence-based preventive guidance.
6. Allows users to ask health-related questions through an AI assistant.
7. Provides automated updates from trusted Nigerian health authorities.
8. Clearly communicates sources, limitations, and timestamps.

The product should feel like a **daily health companion**, not a medical diagnosis application.

---

# 4. PRODUCT VISION

The long-term vision is:

> **Build an intelligent environmental-health platform that helps people understand how their surroundings, climate, geography, and public-health conditions interact with their health.**

The initial implementation focuses on Nigeria and a specific health-risk use case.

The architecture should, however, allow the platform to expand in the future.

---

# 5. INITIAL HEALTH FOCUS

The MVP's primary predictive health use case is **malaria**.

This is intentional.

The application should not attempt to build separate ML predictors for every disease during the hackathon.

The initial intelligence layer focuses on malaria because:

- It is highly relevant to Nigeria.
- Environmental and climate conditions are important to its transmission.
- Public datasets are available.
- Historical malaria estimates can be combined with environmental data.
- It provides a strong demonstration of how environmental intelligence can support health awareness.

However:

> **The BRAND should not be malaria-specific.**

The product should be called **9ja Health**, not a name containing “malaria.”

This is important because the long-term platform should be capable of expanding beyond malaria.

---

# 6. TARGET USERS

## Primary Users

Everyday people in Nigeria who want simple, understandable health and environmental information.

Examples include:

- Students
- Families
- Young adults
- People living in urban areas
- People living in rural communities
- Users who want preventive health information
- Users who want to understand local environmental conditions

## Secondary Users

Potential future users include:

- Schools
- Community health organizations
- Public-health workers
- NGOs
- Researchers
- Local governments
- Healthcare organizations

The MVP should prioritize the ordinary individual user.

---

# 7. CORE USER EXPERIENCE

The intended experience is:

### Step 1 — Open the app

The application asks for foreground location permission.

### Step 2 — Determine location

GPS coordinates are used to identify the user's Nigerian state/region.

If GPS permission is denied, the user can manually select their state.

### Step 3 — Generate the health outlook

The backend combines:

- Geographic information
- Historical health data
- Climate data
- Current weather
- Machine-learning predictions
- Prevention rules

### Step 4 — Present the information

The user sees a simple dashboard containing:

- Their location
- Relevant health-risk information
- Current environmental conditions
- Preventive recommendations
- Recent Nigerian health updates
- Access to the AI health assistant

### Step 5 — Ask questions

The user can ask the health assistant questions about supported health topics.

---

# 8. MAIN FEATURES

## 8.1 📍 Location Intelligence

The application uses GPS to understand where the user is.

The mobile application obtains:

- Latitude
- Longitude

The backend then determines the relevant Nigerian administrative region using geographic boundaries.

For the MVP:

> GPS → Nigerian state/region

The application should not continuously track the user.

### Requirements

- Foreground location only
- Clear permission request
- Graceful permission denial
- Manual state fallback
- No unnecessary location history
- No continuous background tracking

---

# 9. 🌦️ ENVIRONMENTAL / WEATHER INTELLIGENCE

The application uses a weather provider such as Open-Meteo.

Potential information includes:

- Temperature
- Relative humidity
- Rainfall/precipitation
- Wind speed
- Forecast conditions
- Other environmental variables where scientifically useful

The weather layer serves two purposes:

### Purpose 1 — Inform the user

Example:

> Current conditions: warm, humid, with a high chance of rainfall.

### Purpose 2 — Support the intelligence layer

Historical environmental data can be used as features for the ML model.

Important:

> Current weather should NOT be presented as proof that a particular individual will become infected with a disease.

Weather informs the health context; it does not diagnose the user.

---

# 10. 🧠 MACHINE LEARNING HEALTH PREDICTION

The initial ML system predicts **area-level annual malaria incidence**.

The target is based on public malaria estimates such as those provided by the **Malaria Atlas Project (MAP)**.

The model should ideally estimate something equivalent to:

> Annual clinical Plasmodium falciparum malaria incidence rate per 1,000 population per year.

This is an **area-level statistical prediction**, not an individual's probability of infection.

---

# 11. ML DATA

The model may combine:

### Malaria data

- Historical incidence
- Geographic region
- Year
- Other appropriate public malaria variables

### Climate data

- Historical temperature
- Historical rainfall
- Historical humidity
- Rainy days
- Multi-year climate averages
- Other scientifically justified variables

### Geographic features

- Latitude
- Longitude
- Geographic identifiers

---

# 12. ML APPROACH

The AI engineer should:

1. Acquire the datasets.
2. Clean them.
3. Explore them.
4. Engineer features.
5. Create a baseline.
6. Train multiple models.
7. Evaluate them chronologically.
8. Select the best model.
9. Analyze failures.
10. Export the final model.
11. Provide a clean inference interface.

Potential models:

- Naive/previous-year baseline
- Linear/Ridge Regression
- Random Forest
- Gradient Boosting
- XGBoost if justified

The project should not use a complicated model simply to appear impressive.

---

# 13. MODEL VALIDATION

The ML system must use an appropriate time-based evaluation strategy.

Do NOT randomly shuffle historical observations if that would cause future information to leak into training.

The model must be evaluated on unseen data.

Required evaluation includes:

- MAE
- RMSE
- Comparison against baseline
- Geographic error analysis
- False-positive analysis
- False-negative analysis
- At least one successful prediction
- At least one failure case

The model's limitations must be explicitly documented.

---

# 14. IMPORTANT ML DISCLAIMER

The application must never say:

> “You have a 75% chance of getting malaria today.”

That would incorrectly imply an individual-level clinical probability that the model does not establish.

Instead, use language such as:

> “The model estimates elevated malaria incidence in your area.”

or:

> “Your area has a relatively elevated predicted annual malaria incidence.”

The exact wording should be clear, cautious, and understandable.

---

# 15. RISK CATEGORIES

If the product converts continuous predictions into categories such as:

- Low
- Moderate
- Elevated
- High

these categories must be clearly defined using the model/training data.

They are **model categories**, not medical or clinical thresholds.

The UI should never imply that a category represents a doctor's diagnosis.

---

# 16. 🛡️ PREVENTION ENGINE

9ja Health should turn environmental and health intelligence into simple preventive actions.

This should primarily be a **rules-based system**, not an LLM.

Examples:

- Environmental conditions may trigger reminders about mosquito-bite prevention.
- Relevant rainfall conditions may trigger environmental awareness.
- Elevated area-level malaria conditions may reinforce established preventive practices.

The system should provide general evidence-based guidance.

It should not:

- Diagnose users
- Prescribe medication
- Give personalized drug dosages
- Replace a doctor
- Claim that weather guarantees disease transmission

The prevention engine should be deterministic wherever possible so its behavior is predictable and auditable.

---

# 17. 💬 AI HEALTH ASSISTANT

The application contains an AI-powered health information assistant.

The assistant should be grounded in authoritative sources.

Primary sources should include:

- WHO
- Verified Nigerian public-health authorities
- Other authoritative health organizations where appropriate

The assistant should use retrieval-augmented generation where appropriate.

The basic pipeline is:

> User question → Retrieve trusted information → Generate grounded response → Cite sources

---

# 18. HEALTH ASSISTANT RESPONSIBILITIES

The assistant should help users understand topics such as:

- Disease transmission
- Symptoms
- Prevention
- Mosquito behavior
- Testing
- General treatment information
- General health guidance
- When professional medical attention may be appropriate

The exact scope should remain controlled by the product requirements.

---

# 19. HEALTH ASSISTANT SAFETY

The assistant must:

- Clearly state that it provides health information.
- Never claim to diagnose the user.
- Never pretend to be a doctor.
- Avoid personalized treatment plans.
- Avoid medication dosing.
- Avoid unsupported medical claims.
- Cite authoritative sources.
- Admit when reliable information is unavailable.
- Recommend professional care when appropriate.
- Handle potentially serious symptoms responsibly.

The assistant should never invent a source.

---

# 20. 📰 NIGERIAN DAILY HEALTH REPORT

A major product feature is a **daily Nigerian health report**.

The purpose is to help users stay informed about relevant health developments from Nigerian health authorities.

Potential sources include:

- Nigeria Centre for Disease Control and Prevention
- Federal Ministry of Health and Social Welfare
- National Primary Health Care Development Agency
- National Malaria Elimination Programme
- Other verified Nigerian public-health bodies

The report should prioritize authoritative information.

---

# 21. ⏰ DAILY HEALTH REPORT SCHEDULER (BACKEND)

The daily Nigerian health report is generated **entirely inside the backend**. There is **no Zapier** (or other external automation platform) in this product.

Expected flow:

> Backend scheduler (06:30 Africa/Lagos) → Specific AI request → Structured health-report answer → Store on backend → Mobile application displays it

### Behaviour

1. A backend function/scheduler checks the time.
2. At **06:30am** (Nigeria local time — `Africa/Lagos`), it runs once for that day.
3. It sends a **specific, fixed-purpose request** to the AI model (not an open-ended chat).
4. The AI returns a structured daily health-report answer grounded in trusted Nigerian / WHO public-health sources where available.
5. The backend stores the result.
6. The mobile app fetches and displays it on the Updates screen / dashboard preview.

The system should produce structured fields such as:

- Title
- Publication / generation date
- Source(s)
- Original URL(s) where applicable
- Relevant content / summary
- Topic
- Location (national or state where known)
- Urgency where appropriate
- AI-generated indicator

However:

> **AI must never invent the underlying health facts or fabricate sources.**

Original sources and dates should always be preserved when the answer is based on retrieved authoritative material.

AI-generated summaries should be clearly identifiable.

---

# 22. 🏠 MAIN DASHBOARD

The home screen should provide a quick overview without overwhelming the user.

Possible sections:

### Location

Show:

- State/region
- Location status

### Health Outlook

Show:

- Relevant area-level health prediction
- Risk category where appropriate
- Prediction period
- Clear explanation

### Environment

Show:

- Temperature
- Humidity
- Rainfall
- Forecast information

### Prevention

Show:

- A small number of relevant preventive recommendations

### Nigerian Health Update

Show:

- Latest important report
- Source
- Date
- Short summary

### Assistant

Provide an obvious way to ask a health question.

---

# 23. 📊 RISK / OUTLOOK SCREEN

A deeper screen can explain the prediction.

It may contain:

- Current prediction
- Historical trend
- Important factors
- Environmental context
- Model limitations
- Data sources
- Prediction date
- Update timestamp

The goal is **explainability**, not simply displaying a mysterious AI score.

---

# 24. 🛡️ PREVENTION SCREEN

The prevention screen provides practical actions.

It should be:

- Simple
- Evidence-based
- Actionable
- Easy to understand
- Non-alarmist

The application should avoid overwhelming users with medical information.

---

# 25. 💬 ASSISTANT SCREEN

The assistant should provide:

- Chat interface
- Clear scope
- Source citations
- Loading states
- Error handling
- Conversation history where appropriate

The assistant should remain focused on the product's supported health scope.

---

# 26. 📰 HEALTH REPORT SCREEN

The health-report screen should allow users to browse recent Nigerian health updates.

Each report should display:

- Title
- Summary
- Source
- Publication date
- Original source link
- Topic

AI summaries should be clearly distinguished from original reporting.

---

# 27. ⚙️ SETTINGS

Potential settings include:

- Location preference
- Manual state selection
- Notification preferences
- Health-report preferences
- Privacy information
- Data sources
- Disclaimer
- About the application

Avoid unnecessary account/authentication complexity for the MVP unless required.

---

# 28. 📱 TECHNOLOGY STACK

### Mobile

- React Native
- Expo
- TypeScript
- Expo Location
- Expo Notifications where appropriate
- AsyncStorage or equivalent local storage

### Backend

- Python
- FastAPI
- Pydantic
- HTTP client for external APIs

### Machine Learning

- Python
- Pandas
- NumPy
- Scikit-learn
- Joblib
- XGBoost if useful

### Data

- Malaria Atlas Project
- Open-Meteo
- geoBoundaries
- WHO
- Nigerian public-health sources

### Daily report scheduling

- Backend scheduler (runs at 06:30 Africa/Lagos)
- No Zapier or external workflow automation platform

### AI

A suitable LLM API may be used for the health assistant and the scheduled daily health report, but all API keys must remain server-side.

---

# 29. HIGH-LEVEL ARCHITECTURE

The application follows this conceptual architecture:

> React Native → FastAPI → Location Service → Weather Service → ML Service → Prevention Engine → Mobile UI

Additional systems:

> FastAPI → RAG Service → Trusted Health Sources

and:

> Backend scheduler (06:30) → AI daily-report request → Store report → Mobile UI

The architecture should remain modular so each service can evolve independently.

---

# 30. PRODUCT PHILOSOPHY

The product follows this principle:

> **ML predicts → Weather informs → Rules recommend → RAG explains → Backend scheduler keeps the daily health report fresh.**

Each technology should have a clear job.

### Machine Learning

Used for statistical prediction.

### Weather API

Used for environmental context.

### Rules

Used for deterministic prevention recommendations.

### RAG + LLM

Used for explaining health information from trusted sources, and for generating the scheduled daily health report answer.

### Backend daily scheduler

Used to run the 06:30am daily health-report job inside FastAPI — no Zapier.

Do not use AI simply because AI sounds impressive.

---

# 31. PRIVACY

The application should follow a privacy-conscious approach.

For the MVP:

- Use foreground location.
- Do not continuously track users.
- Do not unnecessarily store precise coordinates.
- Do not collect unnecessary personal information.
- Keep API keys server-side.
- Do not expose sensitive information in logs.

The application should explain why location is needed.

---

# 32. WHAT THE MVP IS NOT

The MVP is NOT:

- A diagnostic application
- A replacement for doctors
- A medical prescription system
- A medication recommender
- An emergency-response system
- A hospital-management system
- A general-purpose medical chatbot
- A disease predictor for every disease
- A continuous GPS tracker
- A social network
- A complex telemedicine platform

Do not add these features unless explicitly requested.

---

# 33. MVP PRIORITY

## 🔴 P0 — CORE DEMO

These must work before anything else:

- GPS
- Nigerian state detection
- Malaria dataset
- Historical climate dataset
- Feature engineering
- ML model
- Baseline
- Model evaluation
- Model export
- FastAPI backend
- Weather integration
- Main outlook endpoint
- Mobile dashboard
- Basic prevention recommendations

---

# 34. 🟡 P1 — HIGH-VALUE FEATURES

After P0 works:

- Health AI assistant
- RAG
- Nigerian health reports
- Backend 06:30 daily report scheduler
- Notifications
- Prediction explanation
- Historical trends
- Better source presentation
- Stronger error handling

---

# 35. 🟢 P2 — FUTURE / OPTIONAL

Only consider these after the core system is stable:

- Higher-resolution geographic prediction
- More diseases
- More environmental health risks
- Air-quality intelligence
- Flood/heat-health warnings
- Long-term climate-health trends
- Personalized health profiles
- Community-level health intelligence
- School/community dashboards
- Public-health dashboards
- Advanced notification system
- Offline capabilities
- More sophisticated RAG
- Multilingual support
- Voice assistant
- Integration with additional government health systems

---

# 36. FUTURE PRODUCT VISION

The long-term opportunity is to evolve from:

> **A malaria-focused environmental-health MVP**

into:

> **A Nigerian environmental-health intelligence platform.**

Future versions could combine:

### Climate

- Temperature
- Rainfall
- Humidity
- Heat
- Flooding
- Air quality

### Health

- Malaria
- Other infectious diseases
- Heat-related risks
- Environmental health risks
- Seasonal health patterns

### Geography

- State-level
- Local government-level
- Higher-resolution geographic intelligence

### Information

- Government health announcements
- Public-health advisories
- Local health trends
- Educational information

Eventually, the platform could become a system that answers:

> **“What is happening around me, how could it affect health, and what should I know?”**

---

# 37. SCIENTIFIC RESPONSIBILITY

The product must be scientifically honest.

Never exaggerate what the model knows.

Clearly distinguish:

- Correlation vs causation
- Area-level prediction vs individual risk
- Weather information vs disease transmission
- AI-generated summaries vs original reports
- Public estimates vs independently measured observations
- Prototype research vs clinically validated technology

If the data cannot support a claim, do not make the claim.

---

# 38. SOURCE TRANSPARENCY

Users should be able to understand where important information comes from.

Relevant sources should be identified, such as:

- Malaria Atlas Project
- Open-Meteo
- WHO
- Nigerian health authorities
- Other verified public datasets

Include timestamps where appropriate.

For AI-generated health information, provide source citations.

---

# 39. JUDGING / COMPETITION OBJECTIVE

The application should demonstrate that the team can combine:

- Real public datasets
- Machine learning
- Geospatial technology
- Climate data
- AI/RAG
- Backend-scheduled daily health reports
- Mobile development
- Backend engineering

The judges should be able to clearly understand:

1. The problem.
2. Why it matters.
3. Why existing tools are insufficient.
4. What 9ja Health does differently.
5. How the ML works.
6. Where the data comes from.
7. How GPS connects the user to the data.
8. How the AI assistant works.
9. How the backend 06:30 daily health-report job works.
10. What the model's limitations are.
11. What the team would build next.

---

# 40. DEMO STORY

The ideal demonstration should follow a real user journey.

### Opening

The user opens 9ja Health.

### Location

The application obtains their location.

### Intelligence

The application identifies the user's state and retrieves environmental information.

### Prediction

The ML model produces the area's health outlook.

### Explanation

The application explains what the prediction means and what it does NOT mean.

### Prevention

The application provides practical prevention guidance.

### Information

The user opens the latest Nigerian health update.

### AI

The user asks the health assistant a question.

### Sources

The application shows where the information came from.

This demonstrates the entire pipeline rather than showing disconnected features.

---

# 41. PRODUCT SUCCESS CRITERIA

The MVP is successful if:

- A user can open the application.
- Their location can be obtained or manually selected.
- The application identifies their region.
- Current environmental information is retrieved.
- The ML model produces a real prediction.
- The prediction is clearly explained.
- Prevention recommendations are generated.
- The AI assistant provides grounded health information.
- Nigerian health updates can be displayed.
- The system handles failures gracefully.
- The application does not make unsafe medical claims.
- The entire system can be demonstrated end-to-end.

---

# 42. DEVELOPMENT PRIORITY RULE

When deciding what to build next, always ask:

> **Does this make the core user experience more useful, reliable, explainable, or impressive to a judge?**

If yes, prioritize it.

If no, defer it.

Do not allow optional features to delay the core prediction pipeline.

---

# 43. FINAL PRODUCT IDENTITY

**Product:** 9ja Health

**Category:** AI-powered health and environmental intelligence

**Initial market:** Nigeria

**Initial predictive focus:** Malaria

**Primary interface:** Lightweight mobile application

**Core technologies:** GPS + climate data + machine learning + AI + public-health information + backend-scheduled daily reports

**Core promise:**

> **Understand your environment. Stay informed. Make better health decisions.**

**Core technical story:**

> **Location → Climate → ML → Health Intelligence → Prevention → Trusted Information**

**Long-term vision:**

> **A platform that connects environmental conditions and public-health intelligence to help Nigerians better understand and prepare for health risks around them.**