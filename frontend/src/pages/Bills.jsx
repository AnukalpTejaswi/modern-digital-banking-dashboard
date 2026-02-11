import { useEffect, useState } from "react";
import { getBills, updateBill, deleteBill } from "../api";
import { showError, showSuccess, showConfirm } from "../utils/toast";
import AddBillModal from "../components/AddBillModal";

// Month names for dropdown
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function Bills() {
    // ========================
    // State management
    // ========================
    const [bills, setBills] = useState([]);               // All bills from API
    const [loading, setLoading] = useState(true);         // Page loading state
    const [isAddOpen, setIsAddOpen] = useState(false);    // Add bill modal
    const [actionLoadingId, setActionLoadingId] = useState(null); // Per-bill loading
    const [activeFilter, setActiveFilter] = useState("upcoming"); // Status filter

    // Month / year filters (default = current month/year)
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear()
    );

    // ========================
    // Mark bill as paid
    // ========================
    const handleMarkPaid = async (billId) => {
        try {
            setActionLoadingId(billId);

            // Update bill status on server
            await updateBill(billId, { status: "paid" });
            showSuccess("Bill marked as paid");

            // Refresh bills after update
            const res = await getBills();
            setBills(res.data);
        } catch {
            showError("Failed to update bill");
        } finally {
            setActionLoadingId(null);
        }
    };

    // ========================
    // Delete bill (with confirmation)
    // ========================
    const handleDeleteBill = (billId) => {
        showConfirm("Delete this bill permanently?", async () => {
            try {
                setActionLoadingId(billId);

                await deleteBill(billId);
                showSuccess("Bill deleted");

                // Refresh list after deletion
                const res = await getBills();
                setBills(res.data);
            } catch {
                showError("Failed to delete bill");
            } finally {
                setActionLoadingId(null);
            }
        });
    };

    // ========================
    // Initial data load
    // ========================
    useEffect(() => {
        async function load() {
            try {
                const res = await getBills();
                setBills(res.data);
            } catch {
                showError("Failed to load bills");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // ========================
    // Loading screen
    // ========================
    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    // ========================
    // Apply month/year + status filters
    // ========================
    const filteredBills = bills.filter((bill) => {
        const dueDate = new Date(bill.due_date);

        // Month & year filter
        const sameMonth =
            dueDate.getMonth() + 1 === selectedMonth &&
            dueDate.getFullYear() === selectedYear;

        if (!sameMonth) return false;

        // Status filter (single source of truth = bill.status)
        if (activeFilter === "paid") return bill.status === "paid";
        if (activeFilter === "overdue") return bill.status === "overdue";
        if (activeFilter === "upcoming") return bill.status === "upcoming";

        return true;
    });

    // ========================
    // Reusable bill renderer
    // ========================
    const renderBills = (list) =>
        list.map((bill) => (
            <div
                key={bill.id}
                className="flex justify-between items-center border-b pb-3"
            >
                {/* Bill details */}
                <div>
                    <p className="font-semibold">{bill.biller_name}</p>
                    <p className="text-sm text-gray-500">
                        Due: {new Date(bill.due_date).toLocaleDateString()}
                    </p>
                </div>

                {/* Amount, status & actions */}
                <div className="text-right space-y-1">
                    <p className="font-bold">₹{bill.amount_due}</p>

                    {/* Status badge */}
                    <span
                        className={`inline-block text-xs px-2 py-1 rounded ${
                            bill.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : bill.status === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                        {bill.status}
                    </span>

                    {/* Action buttons */}
                    <div className="flex flex-col items-end gap-1">
                        {bill.status !== "paid" && (
                            <button
                                onClick={() => handleMarkPaid(bill.id)}
                                disabled={actionLoadingId === bill.id}
                                className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                            >
                                {actionLoadingId === bill.id
                                    ? "Updating..."
                                    : "Mark as Paid"}
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBill(bill.id);
                            }}
                            disabled={actionLoadingId === bill.id}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                            {actionLoadingId === bill.id
                                ? "Deleting..."
                                : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        ));

    return (
        <div>
            {/* Page header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Bills</h1>

                <button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                    + Add Bill
                </button>
            </div>

            {/* Main content card */}
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                {bills.length === 0 && (
                    <p className="text-gray-500 text-center">
                        No bills added yet
                    </p>
                )}

                {/* Month & year selector (secondary heading intentionally kept) */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Bills</h2>

                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) =>
                                setSelectedMonth(Number(e.target.value))
                            }
                            className="border px-2 py-1 rounded"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>
                                    {m}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(Number(e.target.value))
                            }
                            className="border px-2 py-1 rounded"
                        >
                            {[2024, 2025, 2026].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Status filter buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setActiveFilter("overdue")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            activeFilter === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        Overdue
                    </button>

                    <button
                        onClick={() => setActiveFilter("upcoming")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            activeFilter === "upcoming"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        Upcoming
                    </button>

                    <button
                        onClick={() => setActiveFilter("paid")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            activeFilter === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        Paid
                    </button>
                </div>

                {/* Render final filtered list */}
                {renderBills(filteredBills)}

                {/* Add bill modal */}
                <AddBillModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    onBillAdded={async () => {
                        const res = await getBills();
                        setBills(res.data);
                    }}
                />
            </div>
        </div>
    );
}

export default Bills;
