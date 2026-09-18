# 💳 Modern Digital Banking Dashboard

> A full-stack fintech platform for personal finance management — accounts, transactions, budgets, bills, and rewards in one dashboard.

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white&style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white&style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white&style=flat-square)

---

## 🌐 Live Deployment

| Service | URL | Status |
|---|---|---|
| 🖥 Frontend (Vercel) | [modern-digital-banking-dashboard-three.vercel.app](https://modern-digital-banking-dashboard-three.vercel.app/login) | ✅ Live |
| ⚡ Backend API (Render) | [modern-digital-banking-dashboard-hto6.onrender.com](https://modern-digital-banking-dashboard-hto6.onrender.com) | ⚠️ Backend/DB currently asleep — see [Known Issues](#-known-issues--production-notes) |
| 📘 API Docs (Swagger) | [/docs](https://modern-digital-banking-dashboard-hto6.onrender.com/docs) | ⚠️ Same as above |

> **Note:** This is running on Render's free tier, where the Postgres instance expires after 90 days of inactivity. The frontend is still live and browsable, but API calls will fail until the backend is redeployed with a fresh database. See [How to Reproduce](#-how-to-reproduce--run-locally) to spin it up locally in the meantime.

---

## 🚀 Overview

The **Modern Digital Banking Dashboard** is a production-oriented personal finance platform that centralizes:

- 🏦 Multi-account management
- 💳 Transaction tracking & categorization
- 📊 Budget planning
- 📅 Bill monitoring with automated reminders
- 🎁 Rewards tracking
- 📈 Financial insights & alerts

It was built to practice the same skills a real fintech backend team needs: relational modeling for money-related data, stateless auth, background job processing, and a deploy pipeline split across two hosting providers.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────┐
│       React Frontend (Vercel)      │
│  Dashboard │ Accounts │ Budgets    │
└──────────────────┬─────────────────┘
                   │ REST API · JWT Auth
┌──────────────────┴─────────────────┐
│      FastAPI Backend (Render)      │
│  Auth │ Accounts │ Txns │ Celery   │
└──────────────────┬─────────────────┘
                   │ SQLAlchemy ORM
┌──────────────────┴─────────────────┐
│    PostgreSQL Database (Render)    │
│  Users │ Accounts │ Transactions   │
└────────────────────────────────────┘
```

- **Frontend** talks to FastAPI over CORS-restricted REST endpoints
- **FastAPI** owns authentication, business logic, and validation
- **PostgreSQL** stores all relational financial data
- **Celery** runs background bill reminders and alert generation, decoupled from the request/response cycle

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React.js, Tailwind CSS, Axios, React Router |
| **Backend** | FastAPI, SQLAlchemy ORM, PostgreSQL, Celery |
| **Auth** | JWT Tokens, Password Hashing, CORS Middleware |
| **Deployment** | Vercel (Frontend), Render (Backend + DB) |

---

## ✨ Core Features

### 🔐 Authentication & User Management
- Registration & login with JWT-based access tokens
- Passwords hashed before storage, never stored or logged in plaintext
- Per-user data isolation enforced at the query layer

### 🏦 Accounts & Transactions
- Multiple account types (Savings, Credit Card, Loan, etc.) per user
- CSV-based transaction ingestion
- Transaction filtering and detail views
- Manual and rule-based expense categorization
- Account balances derived dynamically from transaction history, not stored as a mutable field

### 📊 Budget Management
- Monthly, category-wise budget creation
- Automatic spent-vs-remaining calculation
- Budget progress visualization
- Overspending alerts

### 📅 Bills & Reminders
- Full CRUD on bills
- Status auto-updates: `upcoming` → `overdue` → `paid`
- Reminder jobs run in the background via Celery, not on the request thread
- Visual urgency indicators in the UI

### 🎁 Rewards & Currency Insights
- Rewards program tracking and points balance
- Currency conversion via an external exchange rate API
- Multi-currency visibility across accounts

### 📈 Financial Insights & Alerts
- Cash flow overview
- Top spending merchants
- Monthly burn rate analysis
- Low-balance and budget-exceeded notifications

---

## 🐛 Known Issues & Production Notes

Real problems hit during development and deployment — and how they were handled:

1. **Render free-tier database expiration.** Render's free Postgres tier deletes the instance after 90 days of inactivity. This project's demo database expired, which took down live API responses even though the frontend and backend service are both still deployed. This is the single clearest argument in this repo for why "free tier" and "production-ready" are different things — a real deployment needs either a paid always-on DB tier or an automated backup/restore step, neither of which this project currently has. **Fix in progress:** documenting a `pg_dump`/`pg_restore` seed script so the demo can be recreated on demand instead of relying on the DB never sleeping.
2. `[FILL IN — e.g. JWT refresh/expiry handling]`
3. `[FILL IN — e.g. CORS between Vercel and Render, or Celery on Render's free tier]`

---

## 📁 Project Structure

```
modern-digital-banking-dashboard/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── core/
│   │   └── services/
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 How to Reproduce / Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

> API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> App available at `http://localhost:3000`

---

## 🔐 Security

- ✅ Password hashing before storage
- ✅ JWT token validation on all protected routes
- ✅ CORS middleware configuration
- ✅ Environment-based secrets management
- ✅ Per-user data isolation

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Authentication module
- [x] Accounts & transactions
- [x] Budget tracking
- [x] Bill management
- [x] Rewards module
- [x] Insights & alerts

### 📅 Planned
- [ ] Automated DB seed/restore script so the live demo survives free-tier expiration
- [ ] Plaid API & Open Banking integration
- [ ] Exportable financial reports (PDF)
- [ ] Advanced analytics dashboard
- [ ] Admin monitoring module

---

## 🎯 What This Project Demonstrates

- Full-stack application architecture design across two separate hosting providers
- Secure, stateless authentication using JWT
- Relational database modeling for financial data (accounts, transactions, budgets as related, queryable entities rather than flat records)
- Background task processing with Celery, decoupled from the request/response cycle
- Real-world tradeoffs of free-tier cloud infrastructure, and what it takes to make a demo actually production-durable
- Separation of concerns in a modular REST API (routes / schemas / services / core)

---

## 👨‍💻 Author

**Anukalp Tejaswi** — B.Tech · Backend & Python Developer
