import { useState } from 'react';
import { createPortal } from "react-dom";
import { createTransaction } from '../api';
import { showSuccess, showError } from '../utils/toast';

function AddTransactionModal({
  isOpen,
  onClose,
  accountId,
  onTransactionAdded,
}) {
    const INITIAL_FORM_STATE = {
    amount: '',
    txn_type: 'debit',
    category: 'Others',
    description: '',
    merchant: '',
    currency: 'INR',
    txn_date: '',
    posted_date: new Date().toISOString().slice(0, 10), // Default to today
    };
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  if (!isOpen) return null;


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent negative or zero amount
    if (Number(formData.amount) <= 0) {
      showError('Amount must be greater than zero');
      return;
    }

    // Prevent future-dated transactions
    const today = new Date().toISOString().slice(0, 10);
    if (formData.txn_date > today) {
      showError('Transaction date cannot be in the future');
      return;
    }

    try {
      await createTransaction({
        account_id: accountId,
        amount: Number(formData.amount),
        txn_type: formData.txn_type,
        category: formData.category,
        description: formData.description || null,
        merchant: formData.merchant.trim(),
        currency: formData.currency,
        txn_date: formData.txn_date,
        posted_date: today, // Always use system date
      });

      showSuccess('Transaction added successfully');

      setFormData(INITIAL_FORM_STATE);
      onTransactionAdded();  
      onClose();              
    } catch (error) {
      showError('Failed to add transaction');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* Background */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/30"
        onClick={() => {
          setFormData(INITIAL_FORM_STATE);
          onClose();
        }}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Amount"
            className="w-full border p-2 rounded"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
          />

          <select
            className="w-full border p-2 rounded"
            value={formData.txn_type}
            onChange={(e) =>
              setFormData({ ...formData, txn_type: e.target.value })
            }
          >
            <option value="debit">Debit (Expense)</option>
            <option value="credit">Credit (Income)</option>
          </select>

          <select
            className="w-full border p-2 rounded"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option>Income</option>
            <option>Food</option>
            <option>Groceries</option>
            <option>Transport</option>
            <option>Bills</option>
            <option>Shopping</option>
            <option>Entertainment</option>
            <option>Health</option>
            <option>Education</option>
            <option>Others</option>
          </select>

          <select
            className="w-full border p-2 rounded"
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="CNY">CNY (¥)</option>
          </select>

          <input
            type="text"
            placeholder="Description (optional)"
            className="w-full border p-2 rounded"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Merchant"
            className="w-full border p-2 rounded"
            required
            value={formData.merchant}
            onChange={(e) =>
              setFormData({ ...formData, merchant: e.target.value })
            }
          />

          <label className="block text-sm font-medium mb-1">
            Transaction Date
          </label>

          <input
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            className="w-full border p-2 rounded"
            value={formData.txn_date}
            onChange={(e) =>
              setFormData({ ...formData, txn_date: e.target.value })
            }
          />

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setFormData(INITIAL_FORM_STATE);
                onClose();
              }}
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

    </div>,
    document.body
  );
}

export default AddTransactionModal;
