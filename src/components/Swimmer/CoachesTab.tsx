import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import swimStore from "../../store/SwimStore";
import { supabase } from "../../lib/supabaseClient";

interface Invitation {
  id: string;
  coach_id: string;
  swimmerEmail: string;
  status: string;
  coachName?: string;
  coachEmail?: string;
}

interface Coach {
  UID: string;
  name: string;
  email: string;
}

const CoachesTab = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (swimStore.currentUser) {
        const { data: invitationsData, error: invitationsError } = await supabase
          .from("invitations")
          .select("*")
          .eq("swimmerEmail", swimStore.currentUser.email)
          .eq("status", "pending");

        if (invitationsError) {
          console.error("Error fetching invitations:", invitationsError);
        } else {
          const coachIds = invitationsData.map(inv => inv.coach_id);
          if (coachIds.length === 0) {
            setInvitations([]);
            return;
          }
          const { data: coachesData, error: coachesError } = await supabase
            .from("users")
            .select("UID, name, email")
            .in("UID", coachIds);

          if (coachesError) {
            console.error("Error fetching coaches for invitations:", coachesError);
          } else {
            const fetchedInvitations = invitationsData.map((invitation: any) => {
              const coach = coachesData.find(c => c.UID === invitation.coach_id);
              return {
                ...invitation,
                coachName: coach ? coach.name : 'Unknown Coach',
                coachEmail: coach ? coach.email : 'unknown@example.com',
              };
            });
            setInvitations(fetchedInvitations);
          }
        }
      }
    };

    const fetchCoaches = async () => {
      if (swimStore.currentUser && swimStore.currentUser.coaches) {
        const { data, error } = await supabase
          .from("users")
          .select("UID, name, email")
          .in("UID", swimStore.currentUser.coaches);

        if (error) {
          console.error("Error fetching coaches:", error);
        } else {
          setCoaches(data as Coach[]);
        }
      }
    };

    fetchInvitations();
    fetchCoaches();
  }, [swimStore.currentUser]);

  const handleAccept = async (invitation: Invitation) => {
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error accepting invitation:", updateError);
      return;
    }

    if (swimStore.currentUser) {
      const { error: swimmerError } = await supabase
        .from("users")
        .update({ coaches: arrayUnion(invitation.coach_id) })
        .eq("UID", swimStore.currentUser.UID);

      if (swimmerError) {
        console.error("Error updating swimmer:", swimmerError);
        return;
      }

      const { error: coachError } = await supabase
        .from("users")
        .update({ swimmers: arrayUnion(swimStore.currentUser.UID) })
        .eq("UID", invitation.coach_id);

      if (coachError) {
        console.error("Error updating coach:", coachError);
        return;
      }
    }

    setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
    // Re-fetch coaches to update the list
    const fetchCoaches = async () => {
      if (swimStore.currentUser && swimStore.currentUser.coaches) {
        const { data, error } = await supabase
          .from("users")
          .select("UID, name, email")
          .in("UID", swimStore.currentUser.coaches);

        if (error) {
          console.error("Error fetching coaches:", error);
        } else {
          setCoaches(data as Coach[]);
        }
      }
    };
    fetchCoaches();
  };

  const handleReject = async (invitation: Invitation) => {
    const { error } = await supabase
      .from("invitations")
      .update({ status: "rejected" })
      .eq("id", invitation.id);

    if (error) {
      console.error("Error rejecting invitation:", error);
      return;
    }

    setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
  };

  const handleRemoveCoach = async (coachId: string) => {
    if (swimStore.currentUser) {
      const { error: swimmerError } = await supabase
        .from("users")
        .update({ coaches: arrayRemove(coachId) })
        .eq("UID", swimStore.currentUser.UID);

      if (swimmerError) {
        console.error("Error removing coach from swimmer:", swimmerError);
        return;
      }

      const { error: coachError } = await supabase
        .from("users")
        .update({ swimmers: arrayRemove(swimStore.currentUser.UID) })
        .eq("UID", coachId);

      if (coachError) {
        console.error("Error removing swimmer from coach:", coachError);
        return;
      }

      setCoaches(coaches.filter((coach) => coach.UID !== coachId));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        My Coaches
      </Typography>
      <List>
        {coaches.map((coach) => (
          <ListItem key={coach.UID}>
            <ListItemText primary={coach.name} secondary={coach.email} />
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#e74c3c",
                color: "white",
                "&:hover": { backgroundColor: "#c0392b" },
              }}
              onClick={() => handleRemoveCoach(coach.UID)}
            >
              Remove
            </Button>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Pending Invitations
      </Typography>
      <List>
        {invitations.map((invitation) => (
          <ListItem key={invitation.id}>
            <ListItemText
              primary={`Invitation from ${invitation.coachName} (${invitation.coachEmail})`}
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#2755b0ff",
                color: "white",
                "&:hover": { backgroundColor: "#1e4287" },
                mr: 1,
              }}
              onClick={() => handleAccept(invitation)}
            >
              Accept
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#e74c3c",
                color: "white",
                "&:hover": { backgroundColor: "#c0392b" },
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
