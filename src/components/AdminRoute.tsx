import { observer } from 'mobx-react-lite';
import { Navigate, Outlet } from 'react-router-dom';
import swimStore from '../store/SwimStore';

const AdminRoute = observer(() => {
  if (!swimStore.isAuthenticated || !swimStore.currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
});

export default AdminRoute;
