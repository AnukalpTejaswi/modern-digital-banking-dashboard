import { useEffect, useState } from "react";
import { getAccounts, deleteAccount } from "../api";
import { showError, showSuccess, showConfirm } from "../utils/toast";
import { useNavigate } from "react-router-dom";
import AddAccountModal from "../components/AddAccountModal";

function Accounts() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
      const res = await getAccounts();
      setData({ accounts: res.data });
      } catch (err) {
        showError("Failed to load accounts");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDeleteAccount = (id) => {
    showConfirm("Delete this account?", async () => {
      await deleteAccount(id);
      showSuccess("Account deleted");
      const res = await getAccounts();
      setData({ accounts: res.data });
    });
  };

  // ------------------------
  // LOADING
  // ------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // ------------------------
  // ACCOUNTS LIST VIEW
  // ------------------------
  return (
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Accounts</h1>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            + Add Account
          </button>
        </div>

        <div className="bg-white rounded shadow p-4 space-y-3">
          {!data?.accounts?.length ? (
            <p className="text-center text-gray-500">
              No accounts found
            </p>
          ) : (
            data.accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => navigate(`/dashboard/accounts/${acc.id}`)}
                className="flex justify-between p-3 cursor-pointer rounded hover:bg-gray-100"
              >

                <div>
                  <p className="font-semibold">{acc.bank_name}</p>
                  <p className="text-sm text-gray-500">
                    {acc.account_type} • {acc.masked_account}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold">₹{acc.balance}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(acc.id);
                    }}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
          <AddAccountModal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onAccountAdded={async () => {
              setIsAddOpen(false);
              const res = await getAccounts();
              setData({ accounts: res.data });
            }}
          />
      </div>
  );
}

export default Accounts;
