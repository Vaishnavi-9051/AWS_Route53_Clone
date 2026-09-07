import React, { useEffect, useState } from " react\;
import { useNotification } from '@/contexts/NotificationContext';

type Props = {
 zoneId: string;
 record: {
 record_id: string;
 name: string;
 type: string;
 ttl: number;
 value: string;
 };
 onClose: () => void;
 onSubmit: (recordId: string, values: { name?: string; type?: string; ttl?: number; value?: string }) => Promise<void>;
};

const recordTypes = ['A','AAAA','CNAME','TXT','MX','NS','PTR','SRV','CAA'];

export default function EditRecordModal({ zoneId, record, onClose, onSubmit }: Props) {
 const [name, setName] = useState(record.name);
 const [type, setType] = useState(record.type);
 const [ttl, setTtl] = useState(record.ttl);
 const [value, setValue] = useState(record.value);
 const [submitting, setSubmitting] = useState(false);
 const { notify } = useNotification();

 useEffect(() => {
 setName(record.name);
 setType(record.type);
 setTtl(record.ttl);
 setValue(record.value);
 }, [record]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);
 try {
 await onSubmit(record.record_id, { name, type, ttl, value });
 } catch (err) {
 notify('error', 'Failed to update record');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className=\fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50\>
 <div className=\bg-content-bg p-6 rounded shadow-lg w-96\>
 <h2 className=\text-xl font-bold mb-4\>Edit DNS Record</h2>
 <form onSubmit={handleSubmit}>
 <div className=\mb-3\>
 <label className=\block mb-1\>Name</label>
 <input type=\text\ value={name} onChange={e => setName(e.target.value)} required className=\w-full border rounded p-2\ />
 </div>
 <div className=\mb-3\>
 <label className=\block mb-1\>Type</label>
 <select value={type} onChange={e => setType(e.target.value)} className=\w-full border rounded p-2\>
 {recordTypes.map(t => (<option key={t} value={t}>{t}</option>))}
 </select>
 </div>
 <div className=\mb-3\>
 <label className=\block mb-1\>TTL (seconds)</label>
 <input type=\number\ value={ttl} onChange={e => setTtl(Number(e.target.value))} min={0} className=\w-full border rounded p-2\ />
 </div>
 <div className=\mb-3\>
 <label className=\block mb-1\>Value</label>
 <input type=\text\ value={value} onChange={e => setValue(e.target.value)} required className=\w-full border rounded p-2\ />
 </div>
 <div className=\flex justify-end space-x-2 mt-4\>
 <button type=\button\ onClick={onClose} className=\px-4 py-2 border rounded\ disabled={submitting}>Cancel</button>
 <button type=\submit\ className=\px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded\ disabled={submitting}>Update</button>
 </div>
 </form>
 </div>
 </div>
 );
}
