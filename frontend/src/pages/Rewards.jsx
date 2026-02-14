import { useEffect, useState, useCallback } from "react";
import {
  getRewards,
  createReward,
  updateReward,
  getRewardSummary,
} from "../api";

function Rewards() {
  const [rewards, setRewards] = useState([]);
  const [programName, setProgramName] = useState("");
  const [points, setPoints] = useState("");
  const [pointValue, setPointValue] = useState("");
  const [rewardCurrency, setRewardCurrency] = useState("INR");
  const [editingId, setEditingId] = useState(null);
  const [editPoints, setEditPoints] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [totalValue, setTotalValue] = useState(0);

  // Fetch rewards list
  const fetchRewards = async () => {
    try {
      const res = await getRewards();
      setRewards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch converted summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await getRewardSummary(selectedCurrency);
      setTotalValue(res.data.total_reward_value);
    } catch (err) {
      console.error(err);
    }
  }, [selectedCurrency]);

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, rewards]);

  // Create reward
  const handleCreate = async () => {
    if (!programName || !points || !pointValue) return;

    await createReward({
      program_name: programName,
      points_balance: Number(points),
      point_value: Number(pointValue),
      currency: rewardCurrency,
    });

    setProgramName("");
    setPoints("");
    setPointValue("");
    setRewardCurrency("INR");

    fetchRewards();
  };

  // Update reward points
  const handleUpdate = async (id) => {
    await updateReward(id, {
      points_balance: Number(editPoints),
    });

    setEditingId(null);
    setEditPoints("");

    fetchRewards();
  };


  const totalPoints = rewards.reduce(
    (acc, r) => acc + r.points_balance,
    0
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Rewards</h2>

      {/* Currency Selector + Refresh */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="INR">INR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>

        <button
          onClick={fetchSummary}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Add Reward */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <input
          className="border p-2 rounded"
          placeholder="Program Name"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="Points"
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="Value per Point"
          type="number"
          step="0.01"
          value={pointValue}
          onChange={(e) => setPointValue(e.target.value)}
        />

        <select
          value={rewardCurrency}
          onChange={(e) => setRewardCurrency(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="INR">INR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>

        <button
          onClick={handleCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* Totals */}
      <div className="mb-2 font-semibold">
        Total Points: {totalPoints}
      </div>

      <div className="mb-4 font-semibold">
        Total Reward Value: {totalValue} {selectedCurrency}
      </div>

      {/* Rewards List */}
      <div className="space-y-3">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-medium">
                {reward.program_name}
              </div>

              <div className="text-sm text-gray-600">
                {reward.points_balance} points
              </div>

              <div className="text-sm text-gray-600">
                Value per point: {reward.point_value} {reward.currency}
              </div>

              <div className="text-sm text-gray-600">
                Total value:{" "}
                {(reward.points_balance * reward.point_value).toFixed(2)}{" "}
                {reward.currency}
              </div>

              <div className="text-xs text-gray-400">
                Updated: {new Date(reward.last_updated).toLocaleString()}
              </div>
            </div>
            
            {editingId === reward.id ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  className="border p-1 rounded w-24"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                />
                <button
                  onClick={() => handleUpdate(reward.id)}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-red-400 text-white px-2 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingId(reward.id);
                  setEditPoints(reward.points_balance);
                }}
                className="bg-indigo-500 text-white px-3 py-1 rounded"
              >
                Update
              </button>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

export default Rewards;
