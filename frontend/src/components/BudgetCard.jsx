import { useEffect, useState } from "react";

function BudgetCard({ budget, onEdit, onDelete, variant = "normal" }) {
  const {
    category,
    limit_amount,
    spent_amount,
    remaining_amount,
    is_over_budget,
  } = budget;

  const isOverall = category === null;
  const WARNING_THRESHOLD = 70;

  const percentUsed =
    limit_amount > 0
      ? Math.min((spent_amount / limit_amount) * 100, 100)
      : 0;

  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentUsed);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentUsed]);

  const statusLabel =
    percentUsed >= 100
      ? "Limit Reached"
      : percentUsed >= WARNING_THRESHOLD
      ? "Near Limit"
      : "On Track";

  const statusStyle =
    variant === "hero"
      ? "bg-white/20 text-white"
      : percentUsed >= 100
      ? "bg-red-100 text-red-700"
      : percentUsed >= WARNING_THRESHOLD
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  const cardBg = 
    percentUsed >= 100
      ? "bg-red-50"
      : percentUsed >= 70
      ? "bg-yellow-50"
      : "bg-white";

  const barColor =
    percentUsed >= 100
      ? "bg-red-500"
      : percentUsed >= WARNING_THRESHOLD
      ? "bg-yellow-400"
      : "bg-green-500";

      
  return (
    <div
        className={`rounded-xl p-4 shadow ${cardBg} ${
          percentUsed >= 100 ? "animate-shake" : ""
        }`}
      >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">
          {category || "Monthly Budget"}
        </h3>

        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle}`}
        >
          {percentUsed >= 100 ? "⚠️" : "✅"} {statusLabel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

      {/* Percentage */}
      <p className="text-xs text-center text-gray-500 mb-2">
        {Math.round(percentUsed)}% used
      </p>

      {/* Footer */}
      <p className="text-center mb-2">
        {is_over_budget ? (
          <span className="text-red-600 font-medium">
            Over by ₹{Math.abs(remaining_amount)}
          </span>
        ) : (
          <span className="text-slate-600">
            ₹{remaining_amount} remaining
          </span>
        )}
      </p>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">
          {isOverall ? "Monthly Budget" : category}
        </h3>

        <div className="flex gap-2 text-sm">
          <button
            onClick={() => onEdit(budget)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(budget.id)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetCard;
