import { useState } from "react";
import { createBill } from "../api";
import { showError, showSuccess } from "../utils/toast";

function AddBillModal({ isOpen, onClose, onBillAdded }) {
    // ========================
    // Form state
    // ========================
    const [billerName, setBillerName] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [amount, setAmount] = useState("");
    const [autoPay, setAutoPay] = useState(false);
    const [loading, setLoading] = useState(false);

    // Today's date for min date restriction
    const today = new Date().toISOString().split("T")[0];

    // Do not render modal if closed
    if (!isOpen) return null;

    // ========================
    // Form submission handler
    // ========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Required field validation
        if (!billerName || !dueDate || !amount) {
            showError("Please fill all required fields");
            return;
        }

        // Due date should not be in the past
        const selectedDate = new Date(dueDate);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate < currentDate) {
            showError("Bill due date cannot be in the past");
            return;
        }

        try {
            setLoading(true);

            // Create bill via API
            await createBill({
                biller_name: billerName,
                due_date: dueDate,
                amount_due: amount,
                auto_pay: autoPay,
            });

            showSuccess("Bill added");

            // Reset form and notify parent
            resetForm();
            onBillAdded();
            onClose();
        } catch {
            showError("Failed to add bill");
        } finally {
            setLoading(false);
        }
    };

    // ========================
    // Reset form state
    // ========================
    const resetForm = () => {
        setBillerName("");
        setDueDate("");
        setAmount("");
        setAutoPay(false);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Add Bill</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Biller name */}
                    <div>
                        <label className="block text-sm font-medium">
                            Biller Name
                        </label>
                        <input
                            type="text"
                            value={billerName}
                            onChange={(e) => setBillerName(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    {/* Due date */}
                    <div>
                        <label className="block text-sm font-medium">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            min={today}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium">
                            Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    {/* Auto-pay toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={autoPay}
                            onChange={(e) => setAutoPay(e.target.checked)}
                        />
                        <span className="text-sm">Enable Auto Pay</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="px-4 py-2 rounded border"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Add Bill"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddBillModal;
