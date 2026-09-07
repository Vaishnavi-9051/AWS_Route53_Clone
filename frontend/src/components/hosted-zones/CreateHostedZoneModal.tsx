import React, { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

type CreateValues = { name: string; comment?: string };

type Props = {
  onClose: () => void;
  onSubmit: (values: CreateValues) => Promise<void>;
};

export default function CreateHostedZoneModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, comment: comment || undefined });
    } catch (err) {
      // onSubmit already notifies, but keep for safety
      notify('error', 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-content-bg p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Create Hosted Zone</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1">Domain name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded p-2"
              placeholder="example.com"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
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
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
