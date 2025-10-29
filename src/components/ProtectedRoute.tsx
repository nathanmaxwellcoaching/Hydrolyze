import { observer } from 'mobx-react-lite';
import { Navigate, Outlet } from 'react-router-dom';
import swimStore from '../store/SwimStore';

const ProtectedRoute = observer(() => {
  if (swimStore.isLoading) {
    return <div>Loading...</div>;
  }

  if (!swimStore.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
});

export default ProtectedRoute;