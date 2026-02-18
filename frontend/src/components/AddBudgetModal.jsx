import { useState, useEffect } from 'react';
import { createBudget, updateBudget } from '../api';
import { CATEGORIES } from '../constants/categories';
import { showSuccess, showError } from '../utils/toast';

// Month labels for dropdown
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function AddBudgetModal({ isOpen, onClose, onCreated, budget }) {
  // ========================
  // Initial date references
  // ========================
  const now = new Date();

  // ========================
  // Form state
  // ========================
  const [formData, setFormData] = useState({
    category: "",
    limit_amount: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  // ========================
  // Populate form when editing
  // ========================
  useEffect(() => {
    const now = new Date();

    if (budget) {
      setFormData((prev) => ({
        ...prev,
        category: budget.category || "",
        limit_amount: budget.limit_amount,
      }));
    } else {
      setFormData({
        category: "",
        limit_amount: "",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
    }
  }, [budget]);


  // Do not render modal if closed
  if (!isOpen) return null;

  // ========================
  // Submit handler
  // ========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent creating budgets for past months (create only)
    if (!budget) {
      const today = new Date();

      if (
        formData.year < today.getFullYear() ||
        (formData.year === today.getFullYear() &&
          formData.month < today.getMonth() + 1)
      ) {
        showError("Cannot create budgets for previous months");
        return;
      }
    }

    try {
      if (budget) {
        // Update existing budget (month/year are immutable)
        await updateBudget(budget.id, {
          category: formData.category || null,
          limit_amount: Number(formData.limit_amount),
        });

        showSuccess("Budget updated");
      } else {
        // Create new budget
        await createBudget({
          category: formData.category || null,
          limit_amount: Number(formData.limit_amount),
          month: formData.month,
          year: formData.year,
        });

        showSuccess("Budget created");
      }

      onCreated();
      onClose();
    } catch (err) {
      showError(
        err.response?.data?.detail || "Failed to save budget"
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.5)'}}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {budget ? "Edit Budget" : "Add Budget"}
        </h2>

        {/* Month / Year selectors (used only for creation) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Month
            </label>
            <select
              value={formData.month}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  month: Number(e.target.value),
                })
              }
              disabled={!!budget} // prevent editing month
              className="w-full border rounded px-3 py-2"
            >
              {MONTHS.map((m, i) => {
                // Disable previous months for current year
                const isPast =
                  formData.year === now.getFullYear() && i + 1 < now.getMonth() + 1;
                return (
                  <option key={m} value={i + 1} disabled={!budget && isPast}>
                    {m}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Year
            </label>
            <select
              value={formData.year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  year: Number(e.target.value),
                })
              }
              disabled={!!budget} // prevent editing year
              className="w-full border rounded px-3 py-2"
            >
              {[now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2].map(
                (y) => (
                  <option key={y} value={y} disabled={!budget && y < now.getFullYear()}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selector */}
          <select
            className="w-full border p-2 rounded"
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value,
              })
            }
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Monthly limit */}
          <input
            type="number"
            required
            placeholder="Monthly limit"
            className="w-full border p-2 rounded"
            value={formData.limit_amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                limit_amount: e.target.value,
              })
            }
          />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBudgetModal;
