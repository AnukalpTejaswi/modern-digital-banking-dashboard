import { useState } from 'react';
import { uploadTransactionsCSV } from '../api';
import { showSuccess, showError } from '../utils/toast';

function UploadCSVModal({ isOpen, onClose, accountId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      showError('Please select a CSV file');
      return;
    }

    try {
      setLoading(true);
      const res = await uploadTransactionsCSV(accountId, file);
      showSuccess(res.message || 'CSV uploaded successfully');
      onUploadSuccess(); // refresh dashboard
      onClose();
      setFile(null);
    } catch (err) {
      console.error(err);
      showError('Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-6">
          Upload Transactions CSV
        </h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-6 border rounded-lg p-2"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadCSVModal;