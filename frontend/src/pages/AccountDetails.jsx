import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { getTransactions, deleteTransaction, updateTransactionCategory } from "../api";
import { showError, showSuccess, showConfirm } from "../utils/toast";
import { CATEGORIES } from "../constants/categories";

import AddTransactionModal from "../components/AddTransactionModal";
import CategoryBadge from "../components/CategoryBadge";
import UploadCSVModal from "../components/UploadCSVModal";

function AccountDetails() {

    const { accountId } = useParams();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
    const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

    const loadAccountData = async () => {
    try {
      const res = await getTransactions();

      const txns = res.data.filter(
        (t) => t.account_id === Number(accountId)
      );

      setTransactions(txns);
    } catch {
      showError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    loadAccountData();
    }, [accountId]);


    const handleDeleteTransaction = async (txnId) => {
    showConfirm("Delete this transaction?", async () => {
        try {
        await deleteTransaction(txnId);
        showSuccess("Transaction deleted");
        await loadAccountData();

        } catch (err) {
        showError("Failed to delete transaction");
        }
    });
    };

    const handleCategoryChange = async (txnId, newCategory) => {
        try {
            const res = await updateTransactionCategory(txnId, {
            category: newCategory,
            force: false,
            });

            if (res.data?.warning) {
            showConfirm(res.data.message, async () => {
                await updateTransactionCategory(txnId, {
                category: newCategory,
                force: true,
                });

                setTransactions((prev) =>
                prev.map((t) =>
                    t.id === txnId ? { ...t, category: newCategory } : t
                )
                );

                showSuccess("Category updated");
            });
            return;
            }

            setTransactions((prev) =>
            prev.map((t) =>
                t.id === txnId ? { ...t, category: newCategory } : t
            )
            );

            showSuccess("Category updated");
        } catch {
            showError("Failed to update category");
        }
    };
        

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">

        <Link
          to="/dashboard/accounts"
          className="text-indigo-600 font-medium hover:underline"
        >
          ← Back to Accounts
        </Link>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Transactions</h2>

                <div className="flex gap-2">
                    <button
                    onClick={() => setIsTxnModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                    >
                    + Add Transaction
                    </button>

                    <button
                    onClick={() => setIsCSVModalOpen(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded"
                    >
                    Upload CSV
                    </button>

                    <a
                    href="/sample-transactions.csv"
                    download
                    className="bg-gray-300 px-4 py-2 rounded text-sm flex items-center"
                    >
                    Download CSV
                    </a>
                </div>
            </div>

        
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center">No transactions</p>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between border-b py-3"
              >
                <div>
                  <p className="font-medium">
                    {txn.merchant || txn.description}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    {new Date(txn.txn_date).toLocaleDateString()}

                    <CategoryBadge category={txn.category || "Others"} />

                    <select
                        value={txn.category || "Others"}
                        onChange={(e) =>
                        handleCategoryChange(txn.id, e.target.value)
                        }
                        className="text-xs border rounded px-1 py-0.5"
                    >
                        {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                        ))}
                    </select>
                    </p>

                </div>

                <div className="text-right">
                  <p
                    className={`font-bold ${
                      txn.txn_type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {txn.txn_type === "credit" ? "+" : "-"}₹{txn.amount}
                  </p>
                  <button
                    onClick={() => handleDeleteTransaction(txn.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
          <AddTransactionModal
            isOpen={isTxnModalOpen}
            onClose={() => setIsTxnModalOpen(false)}
            accountId={Number(accountId)}
            onTransactionAdded={() => {
              setIsTxnModalOpen(false);
              loadAccountData();
            }}
          />

          <UploadCSVModal
            isOpen={isCSVModalOpen}
            onClose={() => setIsCSVModalOpen(false)}
            accountId={Number(accountId)}
            onUploadSuccess={() => {
              setIsCSVModalOpen(false);
              loadAccountData();
            }}
          />

      </div>
    </div>
  );
}

export default AccountDetails;
