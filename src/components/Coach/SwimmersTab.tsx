import { useState, useEffect } from 'react';
import { Box, Typography, Button, Modal, TextField, List, ListItem, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import swimStore from '../../store/SwimStore';
import { collection, addDoc, getDoc, doc, updateDoc, arrayRemove, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';

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

interface Swimmer {
  id: string;
  name: string;
  email: string;
}

interface Invitation {
  id: string;
  swimmerEmail: string;
}

const SwimmersTab = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    const fetchSwimmers = async () => {
      if (swimStore.currentUser && swimStore.currentUser.swimmers) {
        const swimmerPromises = swimStore.currentUser.swimmers.map(swimmerId => getDoc(doc(db, 'users', swimmerId)));
        const swimmerDocs = await Promise.all(swimmerPromises);
        const fetchedSwimmers = swimmerDocs.map(doc => ({ ...doc.data(), id: doc.id } as Swimmer));
        setSwimmers(fetchedSwimmers);
      }
    };

    const fetchPendingInvitations = async () => {
      if (swimStore.currentUser) {
        const invitationsCollection = collection(db, 'invitations');
        const q = query(
          invitationsCollection,
          where('coachId', '==', swimStore.currentUser.id),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const fetchedInvitations = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Invitation));
        setPendingInvitations(fetchedInvitations);
      }
    };

    fetchSwimmers();
    fetchPendingInvitations();
  }, [swimStore.currentUser]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInvite = async () => {
    if (swimStore.currentUser && swimStore.currentUser.userType === 'coach') {
      const invitationsCollection = collection(db, 'invitations');
      await addDoc(invitationsCollection, {
        coachId: swimStore.currentUser.id,
        swimmerEmail: email,
        status: 'pending',
      });
      handleClose();
    }
  };

  const handleRemoveSwimmer = async (swimmerId: string) => {
    if (swimStore.currentUser) {
      const coachRef = doc(db, 'users', swimStore.currentUser.id);
      await updateDoc(coachRef, {
        swimmers: arrayRemove(swimmerId),
      });

      const swimmerRef = doc(db, 'users', swimmerId);
      await updateDoc(swimmerRef, {
        coaches: arrayRemove(swimStore.currentUser.id),
      });

      setSwimmers(swimmers.filter(swimmer => swimmer.id !== swimmerId));
    }
  };

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
};

export default SwimmersTab;