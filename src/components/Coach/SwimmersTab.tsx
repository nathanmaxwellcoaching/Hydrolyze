import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Button, Modal, TextField, List, ListItem, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import swimStore from '../../store/SwimStore';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


const SwimmersTab = observer(() => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    swimStore.loadInvitations();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInvite = async () => {
    await swimStore.inviteSwimmer(email);
    handleClose();
  };

  const handleRemoveSwimmer = async (swimmerId: string) => {
    await swimStore.removeSwimmer(swimmerId);
  };

  const swimmers = swimStore.currentUser?.swimmers
    ? swimStore.users.filter(u => swimStore.currentUser?.swimmers?.includes(u.id))
    : [];

  const pendingInvitations = swimStore.invitations.filter(i => i.coachId === swimStore.currentUser?.id);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">My Swimmers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Invite Swimmer
        </Button>
      </Box>
      <List>
        {swimmers.map(swimmer => (
          <ListItem key={swimmer.id}>
            <ListItemText primary={swimmer.name} secondary={swimmer.email} />
            <Button onClick={() => handleRemoveSwimmer(swimmer.id)}>Remove</Button>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Pending Invitations</Typography>
      <List>
        {pendingInvitations.map(invitation => (
          <ListItem key={invitation.id}>
            <ListItemText primary={invitation.swimmerEmail} />
          </ListItem>
        ))}
      </List>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Invite Swimmer
          </Typography>
          <TextField
            fullWidth
            label="Swimmer's Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button onClick={handleInvite} sx={{ mt: 2 }}>Send Invitation</Button>
        </Box>
      </Modal>
    </Box>
  );
});

export default SwimmersTab;