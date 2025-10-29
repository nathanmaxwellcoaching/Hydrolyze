import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Button, List, ListItem, ListItemText } from '@mui/material';
import swimStore from '../../store/SwimStore';
import type { Invitation } from '../../store/SwimStore';
import { useAuth } from '../../contexts/AuthContext';

const CoachesTab = observer(() => {
  const { userProfile } = useAuth();

  useEffect(() => {
    swimStore.loadInvitations();
  }, [userProfile]);

  const handleAccept = async (invitation: Invitation) => {
    await swimStore.acceptInvitation(invitation);
  };

  const handleReject = async (invitation: Invitation) => {
    await swimStore.rejectInvitation(invitation);
  };

  const handleRemoveCoach = async (coachId: string) => {
    await swimStore.removeCoach(coachId);
  };

  const coaches = userProfile?.coaches
    ? swimStore.users.filter(u => userProfile?.coaches?.includes(u.UID))
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>My Coaches</Typography>
      <List>
        {coaches.map(coach => (
          <ListItem key={coach.UID}>
            <ListItemText primary={coach.name} secondary={coach.email} />
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#e74c3c', 
                color: 'white', 
                '&:hover': { backgroundColor: '#c0392b' } 
              }}
              onClick={() => handleRemoveCoach(coach.UID)}
            >
              Remove
            </Button>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Pending Invitations</Typography>
      <List>
        {swimStore.invitations.map(invitation => (
          <ListItem key={invitation.id}>
            <ListItemText primary={`Invitation from ${invitation.coachName} (${invitation.coachEmail})`} />
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#2755b0ff', 
                color: 'white', 
                '&:hover': { backgroundColor: '#1e4287' },
                mr: 1
              }}
              onClick={() => handleAccept(invitation)}
            >
              Accept
            </Button>
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#e74c3c', 
                color: 'white', 
                '&:hover': { backgroundColor: '#c0392b' } 
              }}
              onClick={() => handleReject(invitation)}
            >
              Reject
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
});

export default CoachesTab;