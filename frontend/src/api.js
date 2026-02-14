import axios from 'axios';

// ==========================================
// STEP 1: Create Axios Instance
// ==========================================
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// ==========================================
// STEP 2: Add Token to Every Request
// ==========================================
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==========================================
// STEP 3: Export API Functions
// ==========================================

// LOGIN
export const login = (email, password) => {
  return API.post('/auth/login', { email, password });
};

// REGISTER
export const register = (data) => {
  return API.post('/auth/register', data);
};

// DASHBOARD
export const getDashboard = () => {
  return API.get('/dashboard/overview');
};


// ================================
// ACCOUNTS
// ================================

// ACCOUNTS
export const getAccounts = () => {
  return API.get('/accounts');
};

// CREATE ACCOUNT
export const createAccount = (accountData) => {
  return API.post('/accounts', accountData);
};

// Delete ACCOUNT
export const deleteAccount = (accountId) => {
  return API.delete(`/accounts/${accountId}`);
};


// ================================
// TRANSACTIONS
// ================================

// TRANSACTIONS
export const getTransactions = () => {
  return API.get('/transactions');
};

// CREATE TRANSACTION
export const createTransaction = (data) => {
  return API.post('/transactions/', data);
};

// UPDATE TRANSACTION CATEGORY
export const updateTransactionCategory = (transactionId, payload) => {
  return API.put(`/transactions/${transactionId}`, payload);
};

// DELETE TRANSACTION
export const deleteTransaction = (transactionId) => {
  return API.delete(`/transactions/${transactionId}`);
};

// UPLOAD TRANSACTIONS VIA CSV
export const uploadTransactionsCSV = (accountId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return API.post(`/transactions/upload-csv/${accountId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


// ================================
// BUDGETS
// ================================

// CREATE BUDGET
export const createBudget = (data) => {
  return API.post('/budgets', data);
};

// GET BUDGETS FOR MONTH & YEAR
export const getBudgets = (month, year) => {
  return API.get('/budgets', {
    params: { month, year },
  });
};

// UPDATE BUDGET
export const updateBudget = (id, data) =>
  API.put(`/budgets/${id}`, data);

// DELETE BUDGET
export const deleteBudget = (id) =>
  API.delete(`/budgets/${id}`);


// ================================
// BILLS
// ================================

// GET all bills
export const getBills = () => {
  return API.get("/bills");
};

// CREATE bill
export const createBill = (data) => {
  return API.post("/bills", data);
};

// UPDATE bill
export const updateBill = (id, data) => {
  return API.put(`/bills/${id}`, data);
};

// DELETE bill
export const deleteBill = (id) => {
  return API.delete(`/bills/${id}`);
};

// ================================
// Alerts
// ===============================

// GET unread alerts
export const getAlerts = () => {
  return API.get("/alerts");
};

// MARK alert as read
export const markAlertRead = (alertId) => {
  return API.patch(`/alerts/${alertId}/read`);
};

// UPDATE PROFILE
export const updateProfile = (data) => {
  return API.put("/auth/me", data);
};

// ===============================
// Rewards APIs
// ===============================
export const getRewards = () => {
  return API.get("/rewards/");
};

export const createReward = (data) => {
  return API.post("/rewards/", data);
};

export const updateReward = (id, data) => {
  return API.put(`/rewards/${id}`, data);
};

export const getRewardSummary = (currency) => {
  return API.get(`/rewards/summary?target_currency=${currency}`);
};


export default API;