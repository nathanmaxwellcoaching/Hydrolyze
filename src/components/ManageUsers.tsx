import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import type { User } from '../store/SwimStore';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Checkbox, FormControlLabel, Box } from '@mui/material';
import anime from 'animejs';

const ManageUsers = observer(() => {
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isAdmin: false });
  const [editState, setEditState] = useState<Record<string, Partial<User>>>({});
  const pageRef = useRef(null);

  useEffect(() => {
    anime({
      targets: pageRef.current,
      opacity: [0, 1],
      translateY: [50, 0],
      easing: 'easeInOutQuad',
      duration: 800,
    });
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await swimStore.addUser(newUser.name, newUser.email, newUser.password, newUser.isAdmin);
      setNewUser({ name: '', email: '', password: '', isAdmin: false });
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await swimStore.deleteUser(id);
    }
  };

  const handleStartEditing = (user: User) => setEditState(prev => ({ ...prev, [user.id]: user }));

  const handleEditChange = (id: string, field: keyof User, value: any) => {
    setEditState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (id: string) => {
    const updatedData = editState[id];
    if (updatedData) {
      await swimStore.updateUser(id, updatedData);
      setEditState(prev => { const newState = { ...prev }; delete newState[id]; return newState; });
    }
  };

  const formInputStyles = {
    '& .MuiInputBase-root': { backgroundColor: '#191919', color: '#FFFFFF', borderRadius: '8px' },
    '& .MuiInputLabel-root': { color: '#a9a9a9', '&.Mui-focused': { color: '#FFFFFF' } },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#444' },
      '&:hover fieldset': { borderColor: 'var(--color-accent-orange)' },
    },
  };

  const cardStyles = {
    p: 2,
    background: 'var(--color-background-card-gradient)',
    color: 'var(--color-text-primary)',
    borderRadius: '16px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  };

  return (
    <Box ref={pageRef} sx={{ opacity: 0 }}>
      <Paper sx={{ ...cardStyles, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Add New User</Typography>
        <form onSubmit={handleAddUser}>
          <TextField fullWidth margin="normal" label="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} sx={formInputStyles} />
          <TextField fullWidth margin="normal" label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} sx={formInputStyles} />
          <TextField fullWidth margin="normal" label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} sx={formInputStyles} />
          <FormControlLabel control={<Checkbox checked={newUser.isAdmin} onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })} sx={{ color: 'var(--color-text-secondary)', '&.Mui-checked': { color: 'var(--color-accent-orange)' } }} />} label="Is Admin" />
          <Button type="submit" variant="contained" sx={{ mt: 2, backgroundColor: 'var(--color-accent-orange)', '&:hover': { backgroundColor: '#e04402' } }}>Add User</Button>
        </form>
      </Paper>

      <Paper sx={cardStyles}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Manage Users</Typography>
        <TableContainer>
          <Table stickyHeader aria-label="manage users table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-text-primary)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)' }}>Name</TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-text-primary)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)' }}>Email</TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-text-primary)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)' }}>Admin</TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-text-primary)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {swimStore.users.map((user) => (
                <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}>
                  <TableCell sx={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    {editState[user.id] ? <TextField value={editState[user.id]?.name} onChange={(e) => handleEditChange(user.id, 'name', e.target.value)} variant="standard" sx={{ '& .MuiInputBase-input': { color: 'var(--color-text-primary)' } }} /> : user.name}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    {editState[user.id] ? <TextField value={editState[user.id]?.email} onChange={(e) => handleEditChange(user.id, 'email', e.target.value)} variant="standard" sx={{ '& .MuiInputBase-input': { color: 'var(--color-text-primary)' } }} /> : user.email}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    {editState[user.id] ? <Checkbox checked={editState[user.id]?.isAdmin || false} onChange={(e) => handleEditChange(user.id, 'isAdmin', e.target.checked)} sx={{ color: 'var(--color-text-secondary)', '&.Mui-checked': { color: 'var(--color-accent-orange)' } }} /> : (user.isAdmin ? 'Yes' : 'No')}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid var(--color-border)' }}>
                    {editState[user.id] ? (
                      <Button onClick={() => handleSave(user.id)} variant="contained" size="small" sx={{ backgroundColor: 'var(--color-accent-green)', mr: 1 }}>Save</Button>
                    ) : (
                      <Button onClick={() => handleStartEditing(user)} variant="outlined" size="small" sx={{ borderColor: 'var(--color-accent-yellow)', color: 'var(--color-accent-yellow)', mr: 1 }}>Edit</Button>
                    )}
                    <Button onClick={() => handleDeleteUser(user.id)} variant="contained" size="small" sx={{ backgroundColor: 'var(--color-accent-red)' }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
});

export default ManageUsers;