import React, { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

type HostedZone = {
  zone_id: string;
  name: string;
};

type Props = {
  zone: HostedZone;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteHostedZoneModal({ zone, onClose, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (e) {
      notify('error', 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-content-bg p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Delete Hosted Zone</h2>
        <p>Are you sure you want to delete <strong>{zone.name}</strong>?</p>
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
            onClick={handleConfirm}
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
