import { useEffect, useState } from "react";
import { getDashboard } from "../api";
import { showError } from "../utils/toast";
import BudgetsSection from "../components/BudgetsSection";

function Overview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDashboard();
        setSummary(res.data.summary);
      } catch {
        showError("Failed to load overview");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!summary) {
    return <div className="text-center py-10">No data available</div>;
  }

  return (
    <div className="space-y-8">
      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl p-6 border">
          <p className="text-sm text-slate-500">Total Balance</p>
          <p className="text-2xl font-bold mt-2">
            ₹{summary.total_balance}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.total_accounts} accounts
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border">
          <p className="text-sm text-green-600">Total Income</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            +₹{summary.total_income}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border">
          <p className="text-sm text-red-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            -₹{summary.total_expenses}
          </p>
        </div>
      </div>

      {/* ===== BUDGET SNAPSHOT ===== */}
      <div>
        <h2 className="text-lg font-bold mb-4">Budgets</h2>
        <BudgetsSection />
      </div>
    </div>
  );
}

export default Overview;
