const SummaryCards = ({
  totalBalance,
  totalIncome,
  totalExpense,
  netCashFlow,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      
      {/* Total Balance */}
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Total Balance</p>
        <h2 className="text-2xl font-bold">
          ₹ {totalBalance.toLocaleString()}
        </h2>
      </div>

      {/* Income */}
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">This Month Income</p>
        <h2 className="text-xl font-semibold text-green-600">
          ₹ {totalIncome.toLocaleString()}
        </h2>
      </div>

      {/* Expense */}
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">This Month Expense</p>
        <h2 className="text-xl font-semibold text-red-600">
          ₹ {totalExpense.toLocaleString()}
        </h2>
      </div>

      {/* Net */}
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Net Cash Flow</p>
        <h2
          className={`text-xl font-semibold ${
            netCashFlow >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          ₹ {netCashFlow.toLocaleString()}
        </h2>
      </div>

    </div>
  );
};

export default SummaryCards;
