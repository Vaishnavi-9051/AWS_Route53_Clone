import React, { useEffect, useState } from 'react';
import { fetchHostedZones, createHostedZone, updateHostedZone, deleteHostedZone } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import CreateHostedZoneModal from '@/components/hosted-zones/CreateHostedZoneModal';
import EditHostedZoneModal from '@/components/hosted-zones/EditHostedZoneModal';
import DeleteHostedZoneModal from '@/components/hosted-zones/DeleteHostedZoneModal';

type HostedZone = {
  zone_id: string;
  name: string;
  comment?: string;
  created_at: string;
};

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showCreate, setShowCreate] = useState(false);
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<HostedZone | null>(null);

  const { notify } = useNotification();

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHostedZones({ search, page, pageSize });
      setZones(data.hosted_zones);
    } catch (e) {
      console.error(e);
      setError('Failed to load hosted zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const handleCreate = async (values: { name: string; comment?: string }) => {
    try {
      await createHostedZone(values);
      notify('success', 'Hosted zone created');
      setShowCreate(false);
      loadZones();
    } catch (e) {
      notify('error', 'Failed to create hosted zone');
    }
  };

  const handleEdit = async (zoneId: string, values: { name?: string; comment?: string }) => {
    try {
      await updateHostedZone(zoneId, values);
      notify('success', 'Hosted zone updated');
      setEditZone(null);
      loadZones();
    } catch (e) {
      notify('error', 'Failed to update hosted zone');
    }
  };

  const handleDelete = async (zoneId: string) => {
    try {
      await deleteHostedZone(zoneId);
      notify('success', 'Hosted zone deleted');
      setDeleteZone(null);
      loadZones();
    } catch (e) {
      notify('error', 'Failed to delete hosted zone');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hosted Zones</h1>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search hosted zones"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 w-64"
        />
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded"
        >
          Create Hosted Zone
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
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Comment</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.zone_id} className="border-t">
                <td className="p-2">{z.name}</td>
                <td className="p-2 font-mono text-sm">{z.zone_id}</td>
                <td className="p-2">{z.comment ?? ''}</td>
                <td className="p-2">{new Date(z.created_at).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => setEditZone(z)}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteZone(z)}
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
          disabled={zones.length < pageSize}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {showCreate && (
        <CreateHostedZoneModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editZone && (
        <EditHostedZoneModal
          zone={editZone}
          onClose={() => setEditZone(null)}
          onSubmit={handleEdit}
        />
      )}
      {deleteZone && (
        <DeleteHostedZoneModal
          zone={deleteZone}
          onClose={() => setDeleteZone(null)}
          onConfirm={() => handleDelete(deleteZone.zone_id)}
        />
      )}
    </div>
  );
}
