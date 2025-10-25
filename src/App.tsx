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
import GoalTimes from './components/GoalTimes';
import StravaPage from './components/StravaPage';
import RegistrationScreen from './components/RegistrationScreen';
import CalendarView from './components/CalendarView';
import SwimmersTab from './components/Coach/SwimmersTab';
import CoachesTab from './components/Swimmer/CoachesTab';
import AchievementRatePage from './components/AchievementRatePage';

import StandardDeviationPage from './components/StandardDeviationPage';

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
          <Route path="goal-times" element={<GoalTimes />} />
          <Route path="strava" element={<StravaPage />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="swimmers" element={<SwimmersTab />} />
          <Route path="coaches" element={<CoachesTab />} />
          <Route path="achievement-rate" element={<AchievementRatePage />} />
          <Route path="standard-deviation" element={<StandardDeviationPage />} />
          <Route element={<AdminRoute />}>
            <Route path="manage-records" element={<ManageRecords />} />
            <Route path="manage-users" element={<ManageUsers />} />
          </Route>

          {/* Silences React-Router warnings for static assets */}
          <Route path="*" element={null} />
        </Route>
      </Route>
    </Routes>
  );
});

export default App;