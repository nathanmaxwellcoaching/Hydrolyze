import { observer } from 'mobx-react-lite';
import { Navigate, Outlet } from 'react-router-dom';
import swimStore from '../store/SwimStore';

const ProtectedRoute = observer(() => {
  if (!swimStore.isAuthenticated) {
    return <Navigate to="/password" replace />;
  }

  return <Outlet />;
});

export default ProtectedRoute;