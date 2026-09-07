import React, { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

type DNSRecord = {
  record_id: string;
  name: string;
  type: string;
};

type Props = {
  record: DNSRecord;
  onClose: () => void;
  /**
   * Called with recordId. Should return a Promise that resolves when deletion is complete.
   */
  onConfirm: () => Promise<void>;
};

export default function DeleteRecordModal({ record, onClose, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      notify('success', 'Record deleted');
      onClose();
    } catch (err) {
      notify('error', 'Failed to delete record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-content-bg p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Delete DNS Record</h2>
        <p>
          Are you sure you want to delete the record <strong>{record.name}</strong> of type{' '}
          <strong>{record.type}</strong>?
        </p>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            disabled={submitting}
          >
            {submitting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
