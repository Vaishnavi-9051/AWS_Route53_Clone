import React from " react\;
import { useNotification } from '@/contexts/NotificationContext';

type Props = {
 zoneId: string;
 record: { name: string; type: string; record_id: string };
 onClose: () => void;
 onConfirm: () => void;
};

export default function DeleteRecordModal({ zoneId, record, onClose, onConfirm }: Props) {
 const { notify } = useNotification();
 const handleDelete = async () => {
 try {
 await onConfirm();
 } catch (err) {
 notify('error', 'Failed to delete record');
 }
 };
 return (
 <div className=\fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50\>
 <div className=\bg-content-bg p-6 rounded shadow-lg w-96\>
 <h2 className=\text-xl font-bold mb-4\>Delete DNS Record</h2>
 <p>Are you sure you want to delete <strong>{record.name}</strong> ({record.type})?</p>
 <div className=\flex justify-end space-x-2 mt-4\>
 <button onClick={onClose} className=\px-4 py-2 border rounded\>Cancel</button>
 <button onClick={handleDelete} className=\px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded\>Delete</button>
 </div>
 </div>
 </div>
 );
}
