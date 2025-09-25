
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import NewRecordForm from "./components/NewRecordForm";
import PasswordScreen from "./components/PasswordScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import LapMetrics from "./components/LapMetrics";

function App() {
  return (
    <Routes>
      <Route path="/password" element={<PasswordScreen />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<NewRecordForm />} />
          <Route path="lap-metrics" element={<LapMetrics />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

