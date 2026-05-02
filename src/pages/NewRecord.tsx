import { useNavigate } from 'react-router-dom';
import { RecordItem } from '../lib/types';
import { createRecord } from '../lib/dataApi';
import RecordForm from '../components/RecordForm';
import styles from './PageShared.module.css';

export default function NewRecord() {
  const navigate = useNavigate();

  const handleSave = async (date: string, items: RecordItem[]) => {
    await createRecord(date, items);
    navigate('/records');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Add Record</h1>
      <div className={styles.content}>
        <RecordForm onSave={handleSave} saveLabel="Save Record" />
      </div>
    </div>
  );
}
