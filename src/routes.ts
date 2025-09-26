// This is a simplified route management approach
// In a real implementation, this would be managed by TanStack Router
export const routes = [
  {
    path: '/',
    component: 'Dashboard',
  },
  {
    path: '/login',
    component: 'Login',
  },
  {
    path: '/register',
    component: 'Register',
  },
  {
    path: '/manage-records',
    component: 'ManageRecords',
  }
];