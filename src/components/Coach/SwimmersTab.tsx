import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import swimStore from "../../store/SwimStore";
import { supabase } from "../../lib/supabaseClient";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

interface Swimmer {
  UID: string; // Changed from id
  name: string;
  email: string;
}

interface Invitation {
  id: string;
  swimmerEmail: string;
}

const SwimmersTab = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>(
    []
  );

  useEffect(() => {
    const fetchSwimmers = async () => {
      if (swimStore.currentUser && swimStore.currentUser.userType === "coach") {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .contains("coaches", [swimStore.currentUser.UID]); // Query users whose 'coaches' array contains the current coach's UID

        if (error) {
          console.error("Error fetching swimmers:", error);
        } else {
          setSwimmers(data as Swimmer[]);
        }
      }
    };

    const fetchPendingInvitations = async () => {
      if (swimStore.currentUser) {
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("coachId", swimStore.currentUser.UID)
          .eq("status", "pending");

        if (error) {
          console.error("Error fetching pending invitations:", error);
        } else {
          setPendingInvitations(data as Invitation[]);
        }
      }
    };

    fetchSwimmers();
    fetchPendingInvitations();
  }, [swimStore.currentUser]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInvite = async () => {
    if (swimStore.currentUser && swimStore.currentUser.userType === "coach") { // Changed user_type to userType
      const { error } = await supabase.from("invitations").insert([
        {
          coach_id: swimStore.currentUser.UID, // Changed id to UID
          swimmerEmail: email,
          status: "pending",
        },
      ]);

      if (error) {
        console.error("Error sending invitation:", error);
      } else {
        handleClose();
      }
    }
  };

  const handleRemoveSwimmer = async (swimmerUID: string) => { // Changed swimmerId to swimmerUID
    if (swimStore.currentUser) {
      // Remove the current coach's UID from the swimmer's 'coaches' array
      const { error: swimmerError } = await supabase
        .from("users")
        .update({ coaches: supabase.raw('array_remove(coaches, ?)', [swimStore.currentUser.UID]) }) // Use Supabase raw SQL for array_remove
        .eq("UID", swimmerUID); // Use UID for lookup

      if (swimmerError) {
        console.error("Error removing coach from swimmer:", swimmerError);
        return;
      }

      setSwimmers(swimmers.filter((swimmer) => swimmer.UID !== swimmerUID)); // Filter by UID
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">My Swimmers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Invite Swimmer
        </Button>
      </Box>
      <List>
        {swimmers.map((swimmer) => (
          <ListItem key={swimmer.UID}>
            <ListItemText primary={swimmer.name} secondary={swimmer.email} />
            <Button onClick={() => handleRemoveSwimmer(swimmer.UID)}>
              Remove
            </Button>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Pending Invitations
      </Typography>
      <List>
        {pendingInvitations.map((invitation) => (
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
          <Button onClick={handleInvite} sx={{ mt: 2 }}>
            Send Invitation
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default SwimmersTab;
