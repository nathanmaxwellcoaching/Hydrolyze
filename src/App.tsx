import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import NewRecordForm from './components/NewRecordForm';
import LapMetrics from './components/LapMetrics';
import LoginScreen from './components/LoginScreen';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ManageRecords from './components/ManageRecords';
import ManageUsers from './components/ManageUsers';

const App = observer(() => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<NewRecordForm />} />
          <Route path="lap-metrics" element={<LapMetrics />} />
          <Route path="manage-records" element={<ManageRecords />} />
          <Route element={<AdminRoute />}>
            <Route path="manage-users" element={<ManageUsers />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
});

export default App;
