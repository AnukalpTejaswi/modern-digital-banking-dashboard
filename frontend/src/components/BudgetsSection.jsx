import { useEffect, useState, useCallback } from 'react';
import { getBudgets } from '../api';
import BudgetCard from './BudgetCard.jsx';
import AddBudgetModal from './AddBudgetModal';
import { showError, showSuccess } from '../utils/toast';
import { deleteBudget } from '../api';

function BudgetsSection() {
  const [budgets, setBudgets] = useState({ overall: null, categories: [],});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      showSuccess('Budget deleted');
      loadBudgets();
    } catch {
      showError('Failed to delete budget');
    }
  };


  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBudgets(month, year);
      const overall = res.data.find(b => b.category === null);
      const categories = res.data.filter(b => b.category !== null);
      setBudgets({ overall, categories });
    } catch {
      showError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [month, year]);


  useEffect(() => {
  loadBudgets();
}, [loadBudgets]);


  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Monthly Budget
        </h3>
        <BudgetCard
          budget={budgets.overall}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    )}

    {/* Category Budgets */}
    {budgets.categories.length === 0 ? (
      <p className="text-gray-500">
        No category budgets set for this month
      </p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.categories.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

        ))}
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
