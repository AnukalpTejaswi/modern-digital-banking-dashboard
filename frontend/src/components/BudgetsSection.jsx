import { useEffect, useState, useCallback } from "react";
import { getBudgets, deleteBudget } from "../api";
import BudgetCard from "./BudgetCard.jsx";
import AddBudgetModal from "./AddBudgetModal";
import { showError, showSuccess } from "../utils/toast";
import { useDate } from "../context/DateContext";

function BudgetsSection() {
  const { selectedMonth, selectedYear } = useDate();

  const [budgets, setBudgets] = useState({
    overall: null,
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBudgets(selectedMonth, selectedYear);

      const overall = res.data.find((b) => b.category === null) || null;
      const categories = res.data.filter((b) => b.category !== null);

      setBudgets({ overall, categories });
    } catch {
      showError("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      showSuccess("Budget deleted");
      loadBudgets();
    } catch {
      showError("Failed to delete budget");
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  // ==============================
  // Helpers for progress bar
  // ==============================
  const calculatePercentage = (spent, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min(Math.round((spent / limit) * 100), 100);
  };

  const getBarColor = (percentage) => {
    if (percentage <= 60) return "bg-green-500";
    if (percentage <= 90) return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Budgets</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          + Add Budget
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading budgets...</p>
      ) : (
        <>
          {/* Overall Monthly Budget */}
          {budgets.overall && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-1">
                  Monthly Budget
                </h3>
                <p className="text-sm text-indigo-100 mb-4">
                  Overall spending limit for this month
                </p>
                <BudgetCard budget={budgets.overall} variant="hero" />
              </div>
            </div>
          )}

          {/* Category Budgets */}
          {budgets.categories.length === 0 ? (
            <p className="text-gray-500">
              No category budgets set for this month
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.categories.map((budget) => {
                const percentage = calculatePercentage(
                  budget.spent_amount,
                  budget.limit_amount
                );

                return (
                  <div key={budget.id} className="space-y-2">
                    <BudgetCard
                      budget={budget}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />

                    {/* Progress bar */}

                  </div>
                );
                })}

            </div>
          )}
        </>
      )}

      <AddBudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onCreated={loadBudgets}
        budget={editingBudget}
      />
    </div>
  );
}

export default BudgetsSection;
