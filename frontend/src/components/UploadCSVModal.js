import { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import { uploadTransactionsCSV } from '../api';
import { showSuccess, showError } from '../utils/toast';

function UploadCSVModal({ isOpen, onClose, accountId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0 });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

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

      window.dispatchEvent(new Event("transaction-added"));
      window.dispatchEvent(new Event("alert-updated"));

      onUploadSuccess();
      onClose();
      setFile(null);
    } catch (err) {
      showError('Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* Background */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Upload Transactions CSV
        </h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border p-2 rounded mb-4"
        />

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

    </div>,
    document.body
  );
}

export default UploadCSVModal;