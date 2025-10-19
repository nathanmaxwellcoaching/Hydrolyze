import { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText } from '@mui/material';
import swimStore from '../../store/SwimStore';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, getDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase-config';

interface Invitation {
  id: string;
  coachId: string;
  swimmerEmail: string;
  status: string;
  coachName?: string;
  coachEmail?: string;
}

interface Coach {
  id: string;
  name: string;
  email: string;
}

const CoachesTab = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (swimStore.currentUser) {
        const invitationsCollection = collection(db, 'invitations');
        const q = query(
          invitationsCollection,
          where('swimmerEmail', '==', swimStore.currentUser.email),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const fetchedInvitations = await Promise.all(querySnapshot.docs.map(async (invitationDoc) => {
          const invitation = { ...invitationDoc.data(), id: invitationDoc.id } as Invitation;
          const coachDoc = await getDoc(doc(db, 'users', invitation.coachId));
          if (coachDoc.exists()) {
            const coachData = coachDoc.data() as Coach;
            invitation.coachName = coachData.name;
            invitation.coachEmail = coachData.email;
          }
          return invitation;
        }));
        setInvitations(fetchedInvitations);
      }
    };

    const fetchCoaches = async () => {
      if (swimStore.currentUser && swimStore.currentUser.coaches) {
        const coachPromises = swimStore.currentUser.coaches.map(coachId => getDoc(doc(db, 'users', coachId)));
        const coachDocs = await Promise.all(coachPromises);
        const fetchedCoaches = coachDocs.map(doc => ({ ...doc.data(), id: doc.id } as Coach));
        setCoaches(fetchedCoaches);
      }
    };

    fetchInvitations();
    fetchCoaches();
  }, [swimStore.currentUser]);

  const handleAccept = async (invitation: Invitation) => {
    const invitationRef = doc(db, 'invitations', invitation.id);
    await updateDoc(invitationRef, { status: 'accepted' });

    if (swimStore.currentUser) {
      const swimmerRef = doc(db, 'users', swimStore.currentUser.id);
      await updateDoc(swimmerRef, {
        coaches: arrayUnion(invitation.coachId),
      });

      const coachRef = doc(db, 'users', invitation.coachId);
      await updateDoc(coachRef, {
        swimmers: arrayUnion(swimStore.currentUser.id),
      });
    }

    setInvitations(invitations.filter(inv => inv.id !== invitation.id));
    // Re-fetch coaches to update the list
    const fetchCoaches = async () => {
      if (swimStore.currentUser && swimStore.currentUser.coaches) {
        const coachPromises = swimStore.currentUser.coaches.map(coachId => getDoc(doc(db, 'users', coachId)));
        const coachDocs = await Promise.all(coachPromises);
        const fetchedCoaches = coachDocs.map(doc => ({ ...doc.data(), id: doc.id } as Coach));
        setCoaches(fetchedCoaches);
      }
    };
    fetchCoaches();
  };

  const handleReject = async (invitation: Invitation) => {
    const invitationRef = doc(db, 'invitations', invitation.id);
    await updateDoc(invitationRef, { status: 'rejected' });
    setInvitations(invitations.filter(inv => inv.id !== invitation.id));
  };

  const handleRemoveCoach = async (coachId: string) => {
    if (swimStore.currentUser) {
      const swimmerRef = doc(db, 'users', swimStore.currentUser.id);
      await updateDoc(swimmerRef, {
        coaches: arrayRemove(coachId),
      });

      const coachRef = doc(db, 'users', coachId);
      await updateDoc(coachRef, {
        swimmers: arrayRemove(swimStore.currentUser.id),
      });

      setCoaches(coaches.filter(coach => coach.id !== coachId));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>My Coaches</Typography>
      <List>
        {coaches.map(coach => (
          <ListItem key={coach.id}>
            <ListItemText primary={coach.name} secondary={coach.email} />
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#e74c3c', 
                color: 'white', 
                '&:hover': { backgroundColor: '#c0392b' } 
              }}
              onClick={() => handleRemoveCoach(coach.id)}
            >
              Remove
            </Button>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Pending Invitations</Typography>
      <List>
        {invitations.map(invitation => (
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
};

export default CoachesTab;