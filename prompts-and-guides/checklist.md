# 🧠 AI ENGINEER — ML / DATA SCIENCE CHECKLIST

> **Main responsibility:** Build, evaluate, document, and package the machine-learning intelligence that powers the health-risk predictions.

---

## 1. 🛠️ Project Setup

- [ ] Create the ML project structure
- [ ] Set up Python virtual environment
- [ ] Install required dependencies
- [ ] Set up Pandas
- [ ] Set up NumPy
- [ ] Set up Scikit-learn
- [ ] Set up Matplotlib / Seaborn for EDA
- [ ] Set up Joblib for model serialization
- [ ] Add XGBoost only if useful and time allows
- [ ] Create `requirements.txt`
- [ ] Create reproducible training environment
- [ ] Add clear README/documentation for the ML pipeline
- [x] ~~Add `.gitignore`~~
- [ ] Make sure datasets and generated model files are properly organized

---

# 2. 📊 Data Collection

## Malaria / Health Dataset

- [ ] Identify the final target health dataset
- [ ] Download the relevant public dataset
- [ ] Verify dataset licensing / usage requirements
- [ ] Understand exactly what each column represents
- [ ] Identify geographic resolution
- [ ] Identify time resolution
- [ ] Identify missing values
- [ ] Identify unreliable or incomplete records
- [ ] Document the dataset source
- [ ] Document the dataset version/date

## Climate / Environmental Dataset

- [ ] Collect historical climate data
- [ ] Use Open-Meteo historical/reanalysis data where appropriate
- [ ] Collect historical temperature
- [ ] Collect historical rainfall/precipitation
- [ ] Collect relative humidity
- [ ] Collect rainy-day information if available
- [ ] Collect wind-related variables if useful
- [ ] Consider additional environmental variables only if they improve the model
- [ ] Ensure climate data matches the health dataset geographically
- [ ] Ensure climate data matches the health dataset temporally

---

# 3. 🧹 Data Cleaning

- [ ] Inspect dataset dimensions
- [ ] Inspect data types
- [ ] Remove duplicate records where appropriate
- [ ] Handle missing values
- [ ] Identify impossible values
- [ ] Identify outliers
- [ ] Standardize geographic names/IDs
- [ ] Standardize date/year formats
- [ ] Ensure numerical columns are actually numerical
- [ ] Document important cleaning decisions
- [ ] Make sure missing data is not accidentally interpreted as zero
- [ ] Verify that merged datasets align correctly

---

# 4. 🔎 Exploratory Data Analysis

- [ ] Understand the distribution of the target variable
- [ ] Plot target variable over time
- [ ] Compare health outcomes across geographic regions
- [ ] Examine temperature relationships
- [ ] Examine rainfall relationships
- [ ] Examine humidity relationships
- [ ] Examine possible lagged climate effects
- [ ] Identify correlations between important features
- [ ] Look for unusual geographic patterns
- [ ] Identify potential data leakage
- [ ] Document important findings
- [ ] Save useful visualizations for the final presentation/report

---

# 5. 🎯 Define the ML Target

- [ ] Clearly define exactly what the model predicts
- [ ] Define the unit of prediction
- [ ] Define the geographic resolution
- [ ] Define the prediction period
- [ ] Define what constitutes a successful prediction
- [ ] Document the target definition clearly

### Important

- [ ] Do not present an area-level prediction as an individual's probability of becoming sick
- [ ] Clearly distinguish prediction from diagnosis
- [ ] Clearly document the limitations of the target dataset
- [ ] If using modelled public estimates, explicitly state that the ML model learns from those estimates

---

# 6. ⚙️ Feature Engineering

Create meaningful features from the historical data.

- [ ] Previous-period health incidence/risk
- [ ] Previous-period average temperature
- [ ] Previous-period total rainfall
- [ ] Previous-period average humidity
- [ ] Number of rainy days
- [ ] Multi-year rainfall averages
- [ ] Multi-year temperature averages
- [ ] Geographic latitude
- [ ] Geographic longitude
- [ ] Other scientifically justified environmental features

## Feature Engineering Checks

- [ ] Avoid future information leaking into training features
- [ ] Make sure every feature would actually be available at prediction time
- [ ] Document how every feature was calculated
- [ ] Keep feature names consistent between training and inference
- [ ] Create a reusable feature-building pipeline

---

# 7. 🧪 Train / Validation / Test Split

- [ ] Use chronological splitting
- [ ] Do NOT randomly shuffle time-series observations
- [ ] Create training period
- [ ] Create validation period
- [ ] Create unseen test period
- [ ] Ensure test data is never used during training
- [ ] Document the exact date/year boundaries
- [ ] Verify there is no data leakage

---

# 8. 📏 Baseline Model

Create a simple baseline before building complicated models.

- [ ] Previous-period value baseline
- [ ] Simple mean/naive baseline where appropriate
- [ ] Calculate baseline MAE
- [ ] Calculate baseline RMSE
- [ ] Save baseline results
- [ ] Use the baseline as the benchmark for every ML model

### Goal

The final model should demonstrate that machine learning provides meaningful improvement over a simple baseline.

---

# 9. 🤖 ML Models

Start simple and increase complexity only when justified.

- [ ] Linear Regression / Ridge Regression
- [ ] Random Forest Regressor
- [ ] Gradient Boosting model
- [ ] XGBoost if time/resources allow
- [ ] Compare model performance
- [ ] Select the best model based on validation performance
- [ ] Avoid selecting a model simply because it is more complex
- [ ] Document why the final model was selected

---

# 10. 📈 Model Evaluation

Evaluate the final model on completely unseen data.

- [ ] MAE
- [ ] RMSE
- [ ] Compare against baseline
- [ ] Calculate percentage improvement over baseline
- [ ] Evaluate performance by geographic region
- [ ] Identify strongest-performing regions
- [ ] Identify weakest-performing regions
- [ ] Analyze prediction errors
- [ ] Check for systematic bias
- [ ] Check whether the model performs differently across regions

---

# 11. 🚨 False Positives / False Negatives

For the competition requirements:

- [ ] Define a research threshold for elevated risk
- [ ] Base the threshold on training data
- [ ] Clearly state that this is NOT a clinical threshold
- [ ] Calculate false positives
- [ ] Calculate false negatives
- [ ] Report precision/recall or other appropriate classification metrics if converting to categories
- [ ] Explain the consequences of each type of error
- [ ] Include examples in the final presentation

---

# 12. 🔍 Failure Analysis

The model must not be presented as perfect.

- [ ] Identify at least one successful prediction
- [ ] Identify at least one significant failure
- [ ] Explain why the model may have failed
- [ ] Investigate unusual climate conditions
- [ ] Investigate missing/inaccurate data
- [ ] Investigate geographic differences
- [ ] Investigate potential data limitations
- [ ] Document what could improve the model in a future version

This is especially important for judging.

---

# 13. 🧠 Model Explainability

Make the ML system understandable to judges.

- [ ] Identify important features
- [ ] Calculate feature importance where appropriate
- [ ] Create feature-importance visualization
- [ ] Explain what the model is learning
- [ ] Avoid claiming that feature importance proves causation
- [ ] Document important limitations

---

# 14. 💾 Model Export

- [ ] Save the final trained model
- [ ] Save the preprocessing pipeline
- [ ] Use Joblib where appropriate
- [ ] Create `malariaguard_model.joblib` or the final project model filename
- [ ] Create model metadata
- [ ] Record model version
- [ ] Record training dataset version
- [ ] Record feature names
- [ ] Record target definition
- [ ] Record evaluation metrics
- [ ] Record training date
- [ ] Verify the exported model can be loaded independently
- [ ] Test predictions after reloading the model

---

# 15. 🔌 Inference Contract

Create a clean function/API contract for the backend developer.

- [ ] Define required input features
- [ ] Define feature order or use named features
- [ ] Define expected data types
- [ ] Define output format
- [ ] Define prediction units
- [ ] Define prediction period
- [ ] Define model version
- [ ] Define possible errors
- [ ] Provide example input/output
- [ ] Test inference independently

The backend developer should be able to use the model without needing to understand the entire training pipeline.

---

# 16. 📚 ML Documentation

- [ ] Dataset documentation
- [ ] Feature documentation
- [ ] Training documentation
- [ ] Model documentation
- [ ] Evaluation documentation
- [ ] Known limitations
- [ ] Reproduction instructions
- [ ] Inference instructions

---

# 17. 🏆 Competition Deliverables

- [ ] Final model
- [ ] Baseline results
- [ ] Final metrics
- [ ] Model comparison
- [ ] Feature importance
- [ ] False-positive analysis
- [ ] False-negative analysis
- [ ] Success case
- [ ] Failure case
- [ ] Dataset sources
- [ ] Model limitations
- [ ] Technical explanation for judges

---

# 🤖 AI/ML DEVELOPER — BACKEND & AI SYSTEMS CHECKLIST

> **Main responsibility:** Turn the ML model and external data sources into a working backend that powers the mobile application.

---

# 1. 🛠️ Backend Setup

- [ ] Create FastAPI project
- [ ] Set up Python virtual environment
- [ ] Create clean backend architecture
- [ ] Configure environment variables
- [x] ~~Create `.env.example`~~
- [x] ~~Add `.gitignore`~~
- [ ] Create `requirements.txt`
- [ ] Configure CORS
- [ ] Add API versioning
- [ ] Create health-check endpoint
- [ ] Add structured error handling
- [ ] Add basic logging
- [ ] Create README documentation

---

# 2. 📁 Backend Architecture

Organize the backend into clear responsibilities.

- [ ] API routes
- [ ] Pydantic schemas
- [ ] Services
- [ ] ML inference
- [ ] External API clients
- [ ] Location processing
- [ ] RAG/AI logic
- [ ] Health-report processing
- [ ] Daily report scheduler (06:30 Africa/Lagos)
- [ ] Configuration
- [ ] Utilities

### Principle

Keep API routes thin.

Routes should primarily:

- [ ] Validate input
- [ ] Call the appropriate service
- [ ] Return the response

Business logic should live in services rather than inside route handlers.

---

# 3. 📍 GPS / Location Service

- [ ] Accept latitude and longitude from the mobile application
- [ ] Validate GPS coordinates
- [ ] Reject impossible coordinates
- [ ] Load Nigerian administrative boundaries
- [ ] Implement point-in-polygon location detection
- [ ] Convert coordinates into Nigerian state/region
- [ ] Return standardized location information
- [ ] Handle coordinates outside Nigeria
- [ ] Handle locations that cannot be resolved
- [ ] Create manual-state fallback support
- [ ] Avoid storing precise coordinates unnecessarily

---

# 4. 🌦️ Weather Service

Integrate Open-Meteo or the selected weather provider.

- [ ] Create weather service
- [ ] Accept latitude/longitude
- [ ] Fetch current weather
- [ ] Fetch relevant forecast data
- [ ] Temperature
- [ ] Relative humidity
- [ ] Rainfall/precipitation
- [ ] Wind speed
- [ ] Additional variables only if required
- [ ] Validate API response
- [ ] Handle API failure
- [ ] Handle missing weather data
- [ ] Add appropriate caching
- [ ] Record weather update time
- [ ] Document data source and attribution requirements

---

# 5. 🧠 ML Inference Service

- [ ] Load trained model during application startup
- [ ] Do NOT retrain the model during API requests
- [ ] Load preprocessing pipeline if applicable
- [ ] Validate model inputs
- [ ] Build inference features
- [ ] Run prediction
- [ ] Validate model output
- [ ] Return prediction with units
- [ ] Return prediction year/period
- [ ] Return model version
- [ ] Handle model loading failure
- [ ] Handle inference failure

---

# 6. 🔗 GPS → Data → ML Pipeline

Test the entire pipeline.

- [ ] GPS coordinates received
- [ ] Coordinates validated
- [ ] State identified
- [ ] Correct geographic identifier selected
- [ ] Relevant health data selected
- [ ] Relevant climate data retrieved
- [ ] Features constructed
- [ ] Model inference performed
- [ ] Prediction returned
- [ ] Prediction transformed into user-friendly information

This should work as one reliable backend flow.

---

# 7. 🛡️ Prevention Recommendation Engine

Do NOT use an LLM for basic deterministic prevention rules.

- [ ] Create a dedicated prevention service
- [ ] Define evidence-based prevention rules
- [ ] Connect relevant environmental conditions to general prevention reminders
- [ ] Include mosquito-bite prevention
- [ ] Include bed-net guidance where appropriate
- [ ] Include environmental awareness
- [ ] Avoid diagnosing users
- [ ] Avoid prescribing medication
- [ ] Avoid personalized treatment plans
- [ ] Ensure recommendations are supported by authoritative health sources

---

# 8. 💬 Health AI Assistant

Create a health assistant focused on the project's defined health scope.

- [ ] Define assistant scope
- [ ] Create system prompt
- [ ] Create RAG pipeline
- [ ] Collect authoritative health sources
- [ ] Prioritize WHO information
- [ ] Add verified Nigerian public-health sources
- [ ] Chunk documents
- [ ] Generate embeddings
- [ ] Store/retrieve knowledge appropriately
- [ ] Implement semantic retrieval
- [ ] Generate grounded responses
- [ ] Return source citations
- [ ] Prevent unsupported claims
- [ ] Handle questions outside the assistant's scope
- [ ] Handle missing information gracefully

---

# 9. 🚑 Health Safety Boundaries

The assistant must:

- [ ] Clearly state that it provides information rather than diagnosis
- [ ] Avoid pretending to be a doctor
- [ ] Avoid prescribing medication
- [ ] Avoid giving personalized drug dosages
- [ ] Avoid making definitive diagnoses
- [ ] Recommend professional medical care when appropriate
- [ ] Escalate potentially serious situations appropriately
- [ ] Never fabricate medical sources
- [ ] Never fabricate health reports

---

# 10. 📰 Nigerian Health Reports

Create a system for delivering reliable health updates from Nigerian public-health authorities.

Potential authoritative sources include:

- [ ] Nigeria Centre for Disease Control and Prevention
- [ ] Federal Ministry of Health and Social Welfare
- [ ] National Primary Health Care Development Agency
- [ ] National Malaria Elimination Programme
- [ ] Other verified government/public-health sources

---

# 11. ⏰ Backend Daily Health-Report Scheduler

Build the in-backend daily report job. **Do not use Zapier.**

- [ ] Identify reliable official health-update / knowledge sources for grounding
- [ ] Implement backend scheduler (APScheduler or equivalent lifespan/cron job)
- [ ] Configure timezone as `Africa/Lagos`
- [ ] Trigger the job at **06:30am** Nigeria local time
- [ ] Ensure the job runs once per calendar day (idempotent)
- [ ] Define the specific fixed-purpose AI request/prompt for the daily report
- [ ] Send that request to the AI model from the backend
- [ ] Ground the answer with RAG / trusted sources where appropriate
- [ ] Extract / normalize title
- [ ] Extract / normalize publication or generation date
- [ ] Extract / normalize source(s)
- [ ] Extract / normalize original URL(s) where applicable
- [ ] Extract / normalize relevant content / summary
- [ ] Classify topic
- [ ] Classify location
- [ ] Classify urgency where appropriate
- [ ] Persist the structured report on the backend
- [ ] Ensure AI summaries are clearly labelled
- [ ] Never allow the AI to invent information or fabricate sources
- [ ] Test duplicate / same-day re-runs
- [ ] Test scheduler failure / missed run recovery
- [ ] Test malformed AI responses

---

# 12. 📰 Health Report API

Create:

- [ ] Health reports endpoint
- [ ] Pagination or reasonable result limits
- [ ] Source information
- [ ] Publication date
- [ ] Original URL
- [ ] Summary
- [ ] Topic
- [ ] Location
- [ ] Urgency
- [ ] AI-generated-summary indicator

---

# 13. 🔌 Main Outlook API

Create the primary endpoint used by the mobile application.

The endpoint should:

- [ ] Accept GPS coordinates
- [ ] Validate coordinates
- [ ] Resolve location
- [ ] Retrieve weather
- [ ] Prepare ML features
- [ ] Run ML inference
- [ ] Generate prevention recommendations
- [ ] Return structured results
- [ ] Include source information
- [ ] Include update timestamps
- [ ] Handle failures gracefully

---

# 14. 📡 API Contract

Freeze the API contract early so the mobile developer can work independently.

- [ ] Define request schemas
- [ ] Define response schemas
- [ ] Define error responses
- [ ] Define HTTP status codes
- [ ] Define location format
- [ ] Define weather format
- [ ] Define prediction format
- [ ] Define recommendation format
- [ ] Define health-report format
- [ ] Document all endpoints

---

# 15. 🔐 Backend Security

- [ ] Keep API keys server-side
- [ ] Keep LLM credentials server-side
- [ ] Validate all incoming requests
- [ ] Validate external API responses
- [ ] Avoid logging sensitive information
- [ ] Configure CORS correctly
- [ ] Protect internal endpoints where necessary
- [ ] Do not expose model internals unnecessarily
- [ ] Do not expose environment variables

---

# 16. ⚡ Performance & Reliability

- [ ] Cache weather responses where appropriate
- [ ] Load ML model once instead of per request
- [ ] Avoid unnecessary external API calls
- [ ] Set reasonable request timeouts
- [ ] Handle third-party API failures
- [ ] Handle model failures
- [ ] Handle empty responses
- [ ] Return useful error messages
- [ ] Keep API response times reasonable

---

# 17. 🧪 Backend Testing

Test:

- [ ] Valid GPS coordinates
- [ ] Invalid GPS coordinates
- [ ] GPS outside Nigeria
- [ ] Unknown state
- [ ] Weather API success
- [ ] Weather API failure
- [ ] Missing weather data
- [ ] ML model success
- [ ] ML model failure
- [ ] Invalid model features
- [ ] Prevention rules
- [ ] Chat assistant
- [ ] Health reports
- [ ] Daily report scheduler (06:30) ingestion
- [ ] Full outlook pipeline

---

# 18. 📱 Mobile Integration

Work with the mobile developer to verify:

- [ ] GPS request works
- [ ] Permission denial works
- [ ] Manual location fallback works
- [ ] Outlook endpoint works
- [ ] Weather appears correctly
- [ ] ML prediction appears correctly
- [ ] Prevention recommendations appear correctly
- [ ] Assistant works
- [ ] Health reports appear correctly
- [ ] Backend errors are handled correctly
- [ ] Loading states work correctly

---

# 19. 🚀 Deployment

- [ ] Select backend hosting
- [ ] Configure production environment variables
- [ ] Deploy FastAPI backend
- [ ] Verify health endpoint
- [ ] Verify CORS
- [ ] Verify external APIs
- [ ] Verify model loading
- [ ] Verify ML inference
- [ ] Verify health assistant
- [ ] Verify 06:30 daily report scheduler
- [ ] Test production API from mobile application
- [ ] Document production URL/configuration

---

# 🔄 SHARED INTEGRATION CHECKLIST

> **Both developers should complete these together before the final demo.**

## API Contract

- [ ] AI Engineer provides final model input specification
- [ ] AI Engineer provides final model output specification
- [ ] AI/ML Dev integrates inference contract
- [ ] Both test the same sample inputs
- [ ] Both verify units and feature ordering
- [ ] Model version is documented

## End-to-End Pipeline

- [ ] GPS → location
- [ ] Location → geographic dataset
- [ ] Location → weather
- [ ] Weather + historical features → ML model
- [ ] ML model → prediction
- [ ] Prediction → user-facing interpretation
- [ ] Environmental conditions → prevention recommendations
- [ ] Health sources → RAG assistant
- [ ] Backend scheduler (06:30) → AI daily report → health reports
- [ ] Backend → mobile application

## Failure States

- [ ] GPS denied
- [ ] GPS unavailable
- [ ] Invalid location
- [ ] Weather API unavailable
- [ ] ML model unavailable
- [ ] Missing data
- [ ] RAG retrieval failure
- [ ] LLM failure
- [ ] Daily report scheduler failure
- [ ] No health reports available
- [ ] Backend unavailable

## Final Competition Quality

- [ ] No fake data presented as real
- [ ] No fake ML predictions
- [ ] No fabricated health information
- [ ] All important data sources documented
- [ ] Model limitations documented
- [ ] Health disclaimer included
- [ ] Sources visible to users where appropriate
- [ ] Error handling works
- [ ] Loading states work
- [ ] Core demo works without manual intervention
- [ ] Code is clean and well-organized
- [ ] Important logic is commented
- [ ] README is complete
- [ ] Environment setup is documented
- [ ] Final production build tested

---

# 🏆 MVP PRIORITY

## 🔴 P0 — MUST WORK

- [ ] Health dataset
- [ ] Climate dataset
- [ ] Target definition
- [ ] Feature engineering
- [ ] Baseline
- [ ] ML model
- [ ] Model evaluation
- [ ] Model export
- [ ] FastAPI backend
- [ ] GPS → location
- [ ] Weather API
- [ ] Main prediction endpoint
- [ ] Mobile integration

## 🟡 P1 — HIGH VALUE

- [ ] Prevention recommendation engine
- [ ] Prediction explanation
- [ ] Model limitations
- [ ] Health AI assistant
- [ ] RAG
- [ ] Nigerian health reports
- [ ] Backend 06:30 daily report scheduler
- [ ] Notifications
- [ ] Better error handling
- [ ] Improved visualizations

## 🟢 P2 — ONLY IF EVERYTHING ELSE WORKS

- [ ] Historical trend charts
- [ ] Advanced RAG
- [ ] More sophisticated environmental modelling
- [ ] Advanced notifications
- [ ] More detailed geographic analysis
- [ ] Additional AI features
- [ ] Advanced analytics

> **Do not let P2 features delay P0 functionality.**

---

# 🧩 TEAM PRINCIPLE

### AI Engineer

**Data → Features → Model → Evaluation → Export**

### AI/ML Developer

**Model → Backend → APIs → AI → Automation → Mobile Integration**

### Together

**Location → Data → ML → Intelligence → Recommendations → User**

The goal is not to build the biggest system.

The goal is to build a **small, technically credible, scientifically responsible, well-engineered system that judges can understand, test, and trust.**