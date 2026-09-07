import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchDNSRecords,
  createDNSRecord,
  updateDNSRecord,
  deleteDNSRecord,
} from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import CreateRecordModal from '@/components/hosted-zones/records/CreateRecordModal';
import EditRecordModal from '@/components/hosted-zones/records/EditRecordModal';
import DeleteRecordModal from '@/components/hosted-zones/records/DeleteRecordModal';

type DNSRecord = {
  record_id: string;
  name: string;
  type: string;
  ttl: number;
  value: string;
  created_at: string;
};

export default function DNSRecordsPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<DNSRecord | null>(null);

  const { notify } = useNotification();

  const loadRecords = async () => {
    if (!zoneId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDNSRecords(zoneId, {
        search,
        type: typeFilter || undefined,
        page,
        pageSize,
      });
      setRecords(data.dns_records);
    } catch (e) {
      console.error(e);
      setError('Failed to load DNS records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId, search, typeFilter, page]);

  const handleCreate = async (values: {
    name: string;
    type: string;
    ttl: number;
    value: string;
  }) => {
    try {
      await createDNSRecord(zoneId, values);
      notify('success', 'Record created');
      setShowCreate(false);
      loadRecords();
    } catch (e) {
      notify('error', 'Failed to create record');
    }
  };

  const handleEdit = async (recordId: string, values: {
    name?: string;
    type?: string;
    ttl?: number;
    value?: string;
  }) => {
    try {
      await updateDNSRecord(zoneId, recordId, values);
      notify('success', 'Record updated');
      setEditRecord(null);
      loadRecords();
    } catch (e) {
      notify('error', 'Failed to update record');
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      await deleteDNSRecord(zoneId, recordId);
      notify('success', 'Record deleted');
      setDeleteRecord(null);
      loadRecords();
    } catch (e) {
      notify('error', 'Failed to delete record');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">DNS Records for Zone {zoneId}</h1>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search records"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 w-48"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Types</option>
          <option value="A">A</option>
          <option value="AAAA">AAAA</option>
          <option value="CNAME">CNAME</option>
          <option value="TXT">TXT</option>
          <option value="MX">MX</option>
          <option value="NS">NS</option>
          <option value="PTR">PTR</option>
          <option value="SRV">SRV</option>
          <option value="CAA">CAA</option>
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded"
        >
          Create Record
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="min-w-full border-collapse">
          <thead className="bg-header-bg text-header-text">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">TTL</th>
              <th className="p-2 text-left">Value</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.record_id} className="border-t">
                <td className="p-2">{rec.name}</td>
                <td className="p-2 font-mono">{rec.type}</td>
                <td className="p-2">{rec.ttl}</td>
                <td className="p-2 break-all">{rec.value}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => setEditRecord(rec)}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteRecord(rec)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1">Page {page}</span>
        <button
          disabled={records.length < pageSize}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {showCreate && (
        <CreateRecordModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editRecord && (
        <EditRecordModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSubmit={handleEdit}
        />
      )}
      {deleteRecord && (
        <DeleteRecordModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onConfirm={() => handleDelete(deleteRecord.record_id)}
        />
      )}
    </div>
  );
}
