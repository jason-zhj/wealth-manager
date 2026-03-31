import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecordsList from './pages/RecordsList';
import NewRecord from './pages/NewRecord';
import RecordDetail from './pages/RecordDetail';

export default function App() {
  return (
    <BrowserRouter basename="/wealth-manager">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/records" element={<RecordsList />} />
              <Route path="/records/new" element={<NewRecord />} />
              <Route path="/records/:id" element={<RecordDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
