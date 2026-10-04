# AI Call Agent - Personal AI Call Screener

> **Real-Time Screening, Machine Learning Fraud Detection & Safe Call Routing**  
> An autonomous call screening platform that uses Machine Learning (Scikit-Learn TF-IDF + Logistic Regression), heuristic phishing rules, and an SQLite database to screen callers before routing them to the user.

---

## 🛠️ Technologies Used

- **Backend**: Python 3.11, FastAPI, Uvicorn, SQLAlchemy 2.0, SQLite (`app.db`), Pydantic v2
- **Machine Learning**: Scikit-Learn (TF-IDF Vectorizer + Logistic Regression), Joblib, Pandas, NumPy
- **Frontend**: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Datasets**: `real_calls.csv` (1,200+ labeled calls), `spam_numbers.csv` (spam registry)
- **Model Files**: `spam_model.pkl`, `tfidf_vectorizer.pkl`
- **Testing**: End-to-end automated verification suite (`run_e2e_screening_tests.py`)
- **Database Tool**: Custom terminal inspector (`db_viewer.py`) and Web Call History (`/call-history`)

---

## 🚀 Quick Execution

### 1. Start Backend Server
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API & Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Probe: `http://127.0.0.1:8000/health`

### 2. Start Frontend App
```powershell
cd frontend
npm run dev
```
- Open `http://localhost:3000` to access the call screener.

### 3. Run Automated E2E Verification
```powershell
cd backend
.\.venv\Scripts\python.exe run_e2e_screening_tests.py
```

### 4. Inspect SQLite Database
```powershell
cd backend
.\.venv\Scripts\python.exe db_viewer.py calls 5
```

---

For the complete project overview and training scripts, see the root [`README.md`](../README.md).
