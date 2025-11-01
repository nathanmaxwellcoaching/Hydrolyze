// This is a simplified route management approach
// In a real implementation, this would be managed by TanStack Router
export const routes = [
  {
    path: '',
    component: 'Dashboard',
  },
  {
    path: 'strava',
    component: 'StravaPage',
  },
  {
    path: 'manage-records',
    component: 'ManageRecords',
  },
  {
    path: 'goal-times',
    component: 'GoalTimes',
  },
  {
    path: 'manage-users',
    component: 'ManageUsers',
  },
  {
    path: 'swimmers',
    component: 'SwimmersTab',
  },
  {
    path: 'coaches',
    component: 'CoachesTab',
  },
  {
    path: 'achievement-rate',
    component: 'AchievementRatePage',
  }
];