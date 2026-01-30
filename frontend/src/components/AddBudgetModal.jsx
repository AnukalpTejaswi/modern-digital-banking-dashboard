import { useState, useEffect } from 'react';
import { createBudget, updateBudget } from '../api';
import { CATEGORIES } from '../constants/categories';
import { showSuccess, showError } from '../utils/toast';

function AddBudgetModal({ isOpen, onClose, onCreated, budget }) {
  const [form, setForm] = useState({
      category: '',
      limit_amount: '',
    });
    useEffect(() => {
      if (budget) {
        setForm({
          category: budget.category || '',
          limit_amount: budget.limit_amount,
        });
      } else {
        setForm({
          category: '',
          limit_amount: '',
        });
      }
    }, [budget]);


  if (!isOpen) return null;

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (budget) {
        await updateBudget(budget.id, {
          category: form.category || null,
          limit_amount: Number(form.limit_amount),
        });
      } else {
        await createBudget({
          category: form.category || null,
          limit_amount: Number(form.limit_amount),
          month,
          year,
        });
}

      showSuccess('Budget created');
      onCreated();
      onClose();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to create budget');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Budget</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="w-full border p-2 rounded"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            {CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="number"
            required
            placeholder="Monthly limit"
            className="w-full border p-2 rounded"
            value={form.limit_amount}
            onChange={(e) =>
              setForm({ ...form, limit_amount: e.target.value })
            }
          />

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
