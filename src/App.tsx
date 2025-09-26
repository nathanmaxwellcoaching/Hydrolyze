import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import NewRecordForm from './components/NewRecordForm';
import LapMetrics from './components/LapMetrics';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import ProtectedRoute from './components/ProtectedRoute';
import ManageRecords from './components/ManageRecords';

const App = observer(() => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegistrationScreen />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<NewRecordForm />} />
          <Route path="lap-metrics" element={<LapMetrics />} />
          <Route path="manage-records" element={<ManageRecords />} />
        </Route>
      </Route>
    </Routes>
  );
});

export default App;