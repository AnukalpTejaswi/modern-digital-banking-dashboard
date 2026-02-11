function AlertPopup({ alert, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 text-center">
        <h2 className="font-bold text-lg mb-2">Reminder</h2>
        <p className="text-gray-700">{alert.message}</p>

        <button
          onClick={onClose}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default AlertPopup;