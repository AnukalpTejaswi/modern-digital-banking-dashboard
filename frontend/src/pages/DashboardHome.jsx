import { useEffect, useState } from "react";
import { getDashboard, getBudgets } from "../api";
import { showError } from "../utils/toast";
import { useDate } from "../context/DateContext";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// -----------------------------
// Constants
// -----------------------------
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function DashboardHome() {
  // -----------------------------
  // State
  // -----------------------------
  const [dashboardData, setDashboardData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
  } = useDate();

  // -----------------------------
  // Load dashboard data
  // (accounts + transactions)
  // -----------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await getDashboard();
        setDashboardData(res.data);
      } catch {
        showError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // -----------------------------
  // Load budgets for month/year
  // -----------------------------
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const res = await getBudgets(selectedMonth, selectedYear);
        setBudgets(res.data);
      } catch {
        showError("Failed to load budgets");
      }
    };
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  if (loading) return <p>Loading...</p>;
  if (!dashboardData) return null;

  const accounts = dashboardData.accounts || [];
  const transactions = dashboardData.transactions || [];

  // -----------------------------
  // Monthly transactions
  // -----------------------------
  const monthlyTransactions = transactions.filter((txn) => {
    const d = new Date(txn.txn_date);
    return (
      d.getMonth() + 1 === selectedMonth &&
      d.getFullYear() === selectedYear
    );
  });

  // -----------------------------
  // Summary calculations
  // -----------------------------
  const totalIncome = monthlyTransactions
    .filter((t) => t.txn_type === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = monthlyTransactions
    .filter((t) => t.txn_type === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);

  const netCashFlow = totalIncome - totalExpense;

  const totalBalance = accounts.reduce(
    (s, a) => s + Number(a.balance),
    0
  );

  // -----------------------------
  // Top Spending Categories (Monthly)
  // -----------------------------
  const categorySpending = {};

  monthlyTransactions.forEach((t) => {
    if (t.txn_type === "debit") {
      categorySpending[t.category] =
        (categorySpending[t.category] || 0) + Number(t.amount);
    }
  });

  const topSpendingData = Object.entries(categorySpending)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // -----------------------------
  // Budget vs Spending (Monthly)
  // -----------------------------
  const spendingByCategory = {};
  monthlyTransactions.forEach((t) => {
    if (t.txn_type === "debit") {
      spendingByCategory[t.category] =
        (spendingByCategory[t.category] || 0) + Number(t.amount);
    }
  });

  const budgetVsSpendingData = budgets
    .filter((b) => b.category !== null)
    .map((b) => ({
      category: b.category,
      budget: Number(b.limit_amount),
      spent: spendingByCategory[b.category] || 0,
    }));

  // -----------------------------
  // Yearly Spending Trend
  // -----------------------------
  const yearlySpendingData = MONTHS.map((month, index) => {
    const monthNumber = index + 1;

    const totalSpent = transactions
      .filter((t) => {
        const d = new Date(t.txn_date);
        return (
          t.txn_type === "debit" &&
          d.getFullYear() === selectedYear &&
          d.getMonth() + 1 === monthNumber
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { month, spending: totalSpent };
  });

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <>
      {/* Month / Year Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          Summary for {MONTHS[selectedMonth - 1]} {selectedYear}
        </h2>

        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <SummaryCard title="Total Balance" value={`₹${totalBalance}`} />
        <SummaryCard title="Income" value={`+₹${totalIncome}`} color="green" />
        <SummaryCard title="Expense" value={`-₹${totalExpense}`} color="red" />
        <SummaryCard
          title="Net"
          value={`₹${netCashFlow}`}
          color={netCashFlow >= 0 ? "green" : "red"}
        />
      </div>

      {/* Top Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Top Spending Categories */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">
            Top Spending Categories
          </h3>

          {topSpendingData.length === 0 ? (
            <p className="text-gray-500 text-sm">No spending data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topSpendingData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Budget vs Spending */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">
            Budget vs Spending
          </h3>

          {budgetVsSpendingData.length === 0 ? (
            <p className="text-gray-500 text-sm">No budgets set.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={budgetVsSpendingData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budget" fill="#22c55e" />
                <Bar dataKey="spent" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Yearly Spending */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4">
          Yearly Spending Trend ({selectedYear})
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlySpendingData}>
            <XAxis dataKey="month" interval={0} angle={-10} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="spending"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="p-4 border rounded">
      <p className="text-sm">{title}</p>
      <p className={`text-2xl font-bold ${color ? `text-${color}-600` : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default DashboardHome;
