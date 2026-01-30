function BudgetCard({ budget, onEdit, onDelete }) {
  const {
    category,
    limit_amount,
    spent_amount,
    remaining_amount,
    is_over_budget,
  } = budget;

  const isOverall = category === null;

  const percentUsed =
    limit_amount > 0
      ? Math.min((spent_amount / limit_amount) * 100, 100)
      : 0;

  return (
    <div
      className={`rounded-xl p-4 shadow ${
        is_over_budget ? 'bg-red-50 border border-red-300' : 'bg-white'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">
          {isOverall ? 'Overall Monthly Budget' : category}
        </h3>

        <span
          className={`text-sm font-medium ${
            is_over_budget ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          ₹{spent_amount} / ₹{limit_amount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${
            is_over_budget ? 'bg-red-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {/* Footer */}
      <p
        className={`text-sm ${
          is_over_budget ? 'text-red-600' : 'text-gray-500'
        }`}
      >
        {is_over_budget
          ? `Over budget by ₹${Math.abs(remaining_amount)}`
          : `₹${remaining_amount} remaining`}
      </p>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">
          {isOverall ? 'Monthly Budget' : category}
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
