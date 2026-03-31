import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WealthRecord, RecordItem } from '../lib/types';
import { fetchRecordWithItems, updateRecord } from '../lib/api';
import RecordForm from '../components/RecordForm';
import styles from './PageShared.module.css';
import detailStyles from './RecordDetail.module.css';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<WealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchRecordWithItems(id)
      .then(setRecord)
      .catch(() => setError('Failed to load record.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (date: string, items: RecordItem[]) => {
    if (!id) return;
    await updateRecord(id, date, items);
    setSuccessMsg('Record saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) return <div className={styles.page}><div className="spinner" /></div>;
  if (error) return <div className={styles.page}><div className={detailStyles.errorMsg}>{error}</div></div>;
  if (!record) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Record Details</h1>
      {successMsg && (
        <div className={detailStyles.successBanner}>{successMsg}</div>
      )}
      <div className={styles.content}>
        <RecordForm
          initialDate={record.date}
          initialItems={record.record_items ?? []}
          onSave={handleSave}
          saveLabel="Save Changes"
          extraActions={
            <button
              type="button"
              className={detailStyles.btnClose}
              onClick={() => navigate('/records')}
            >
              Close
            </button>
          }
        />
      </div>
    </div>
  );
}
