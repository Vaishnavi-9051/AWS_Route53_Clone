import React, { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

type DNSRecord = {
  record_id: string;
  name: string;
  type: string;
  ttl: number;
  value: string;
};

type Props = {
  record: DNSRecord;
  onClose: () => void;
  /**
   * Called with (recordId, updatedValues).
   * Should return a Promise that resolves when the update is complete.
   */
  onSubmit: (recordId: string, values: { name?: string; type?: string; ttl?: number; value?: string }) => Promise<void>;
};

export default function EditRecordModal({ record, onClose, onSubmit }: Props) {
  const [name, setName] = useState(record.name);
  const [type, setType] = useState(record.type);
  const [ttl, setTtl] = useState(record.ttl);
  const [value, setValue] = useState(record.value);
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(record.record_id, { name, type, ttl, value });
      notify('success', 'Record updated');
      onClose();
    } catch (err) {
      notify('error', 'Failed to update record');
    } finally {
      setSubmitting(false);
    }
  };

  const recordTypes = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-content-bg p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit DNS Record</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded p-2"
            >
              {recordTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block mb-1">TTL (seconds)</label>
            <input
              type="number"
              min={0}
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1">Value</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
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
              disabled={submitting}
            >
              {submitting ? 'Updating…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
