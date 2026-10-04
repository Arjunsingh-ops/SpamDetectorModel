# AI Call Screener & Spam Detection Platform

> **AI-Powered Call Screening, Real-Time Fraud Detection & Safe Call Routing**  
> An autonomous call-screening system. When an incoming call arrives, the AI answers first, asks who is calling and why, screens the conversation in real time using Machine Learning and heuristic rules, and routes safe calls to the recipient while quarantining spam and fraud attempts.

---

## 🌟 How It Works

```
                     CALLER (Browser Simulator)
                                │
                                ▼
                       FASTAPI BACKEND
             (POST /api/v1/telephony/incoming)
                                │
                                ▼
                        AI CALL SCREENER
          (Answers call, initiates screening dialogue)
                                │
                                ▼
                     HYBRID SPAM ENGINE
   ┌────────────────────────────┼────────────────────────────┐
   ▼                            ▼                            ▼
ML Classifier           Spam Number DB           Phishing Heuristics
(TF-IDF + Logistic      (spam_numbers.csv)       (OTP demands, bank KYC,
 Regression Model)                                urgent cutoff keywords)
   └────────────────────────────┬────────────────────────────┘
                                │
                                ▼
                       SAFETY POLICY GATE
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
    LOW RISK                UNCERTAIN               HIGH RISK
  (Score ≤ 0.30)         (0.31 – 0.70)            (Score ≥ 0.71)
        │                       │                       │
        ▼                       ▼                       ▼
  SAFE TO FORWARD         NEUTRAL FOLLOW-UP       AI HANDLES CALL
  Rings user screen;      AI asks caller for      Quarantined; user
  user can [ANSWER]       clearer intent          is not disturbed
```

---

## 🛠️ Technology Stack Used

### 1. Backend & API
- **Language**: Python 3.11
- **Web Framework**: FastAPI (Async REST API & Server-Sent Events)
- **ASGI Server**: Uvicorn
- **ORM & Database**: SQLAlchemy 2.0 with **SQLite** (`app.db`)
- **Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **Security**: OWASP security headers, CORS middleware, rate limiting

### 2. Machine Learning & Fraud Screening
- **Classifier**: Logistic Regression (`sklearn.linear_model.LogisticRegression`)
- **Text Vectorization**: TF-IDF Vectorizer (`sklearn.feature_extraction.text.TfidfVectorizer`, n-grams)
- **Model Serialization**: Joblib (`spam_model.pkl`, `tfidf_vectorizer.pkl`)
- **Data Processing**: Pandas, NumPy
- **Phishing Heuristics**: Deterministic pattern matching for OTP theft, KYC verification fraud, and urgent threats
- **Prompt Injection Defense**: Sanitization and heuristic shielding against caller instruction overrides

### 3. Frontend Application
- **Framework**: Next.js 16 (Turbopack)
- **Library**: React 19 (TypeScript)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Features**:
  - Smartphone-style Personal Call Screener interface
  - Interactive Two-Party In-Browser Call Simulator
  - Live Calls Monitor (`/live-calls`)
  - Recent Call History with Transcripts & CSV Export (`/call-history`)
  - Spam Review & Number Registry (`/spam-review`)
  - Assistant Settings & Forwarding Rules (`/settings`)

### 4. Datasets & Model Files
- **`real_calls.csv`**: 1,200+ labeled call transcripts (normal conversations vs scam calls).
- **`spam_numbers.csv`**: Known telemarketing and fraud phone numbers registry.
- **`expanded_calls.csv`**: Augmented conversation dataset for training.
- **`spam_model.pkl`**: Pre-trained scikit-learn Logistic Regression classifier.
- **`tfidf_vectorizer.pkl`**: Pre-trained TF-IDF vectorizer.

---

## 📁 Repository Structure

```
minior projct gbu/
├── README.md                           # Project documentation (this file)
├── real_calls.csv                      # Labeled call dataset (training corpus)
├── spam_numbers.csv                    # Known spam phone numbers registry
├── expanded_calls.csv                  # Augmented training dataset
├── main.py                             # ML model training script
├── api.py                              # Standalone FastAPI prototype
│
├── ai-call-agent/                      # Main Full-Stack Application
│   ├── backend/                        # FastAPI Python 3.11 Backend
│   │   ├── app/
│   │   │   ├── main.py                 # Application entrypoint & middleware
│   │   │   ├── api/v1/                 # Endpoints (telephony, calls, spam, history)
│   │   │   ├── spam/                   # Hybrid spam detection engine & rules
│   │   │   ├── services/               # Call state machine & orchestrator
│   │   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   └── core/                   # Config, database setup, and logging
│   │   ├── app.db                      # SQLite database
│   │   ├── db_viewer.py                # Terminal SQLite database inspector
│   │   ├── requirements.txt            # Python dependencies
│   │   └── run_e2e_screening_tests.py  # 12 Automated verification scenarios
│   │
│   └── frontend/                       # Next.js 16 + React 19 Frontend
│       ├── app/                        # Pages (home, live-calls, call-history, spam-review)
│       ├── components/                 # Smartphone screener & UI components
│       ├── lib/                        # API client & SSE state management
│       └── package.json                # Frontend dependencies
│
└── frontend/                           # Lightweight HTML/CSS/JS prototype
    ├── index.html
    ├── script.js
    └── style.css
```

---

## 🚀 How to Run

### Step 1: Start Backend Server

```powershell
cd "ai-call-agent/backend"

# Run FastAPI backend with Uvicorn
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- **Backend API**: `http://127.0.0.1:8000`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`

### Step 2: Start Frontend UI

```powershell
cd "ai-call-agent/frontend"

# Run Next.js development server
npm run dev
```
- **Web App**: Open **`http://localhost:3000`** in your browser.

---

## 📱 Testing the Call Screener

1. Open **`http://localhost:3000`**.
2. At the top of the Home page, use the **Personal Call Screener**:
   - **Simulate Legitimate Caller**: Simulates a friend calling $\rightarrow$ Evaluates as Low Risk $\rightarrow$ Smartphone interface rings $\rightarrow$ Click **[ANSWER]** to connect.
   - **Simulate OTP Scam**: Simulates a fraudster demanding OTP/bank credentials $\rightarrow$ Flagged as High Risk $\rightarrow$ Quarantined without ringing the user.
   - **Browser A (Caller)**: Enter custom caller statements to test real-time classification.

---

## 🗄️ Database Inspection

The system stores all call logs, transcript segments, and spam assessments in **SQLite** at `ai-call-agent/backend/app.db`.

To inspect the database from the terminal:

```powershell
cd "ai-call-agent/backend"

# List all tables and row counts
.\.venv\Scripts\python.exe db_viewer.py

# View latest call records
.\.venv\Scripts\python.exe db_viewer.py calls 5

# View live transcripts
.\.venv\Scripts\python.exe db_viewer.py transcript_segments 10

# Run a custom SQL query
.\.venv\Scripts\python.exe db_viewer.py --query "SELECT caller_number, caller_name, spam_score, status FROM calls"
```

You can also view call records with transcripts and export to CSV directly in the UI at **`http://localhost:3000/call-history`**.

---

## 🧪 Testing & Verification

Run the full end-to-end automated verification suite (12 test scenarios):

```powershell
cd "ai-call-agent/backend"
.\.venv\Scripts\python.exe run_e2e_screening_tests.py
```

### Retraining the ML Model

To retrain the Logistic Regression model and re-export the pickle files:

```powershell
cd "d:/minior projct gbu"
python main.py
```
*(Loads `real_calls.csv`, trains `TfidfVectorizer` + `LogisticRegression`, and saves `spam_model.pkl` and `tfidf_vectorizer.pkl`)*.
