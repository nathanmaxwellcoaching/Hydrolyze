import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import type { User } from '../store/SwimStore';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Checkbox, FormControlLabel } from '@mui/material';

const ManageUsers = observer(() => {
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isAdmin: false });
  const [editState, setEditState] = useState<Record<string, Partial<User>>>({});

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

  const handleStartEditing = (user: User) => {
    setEditState(prev => ({ ...prev, [user.id]: user }));
  };

  const handleEditChange = (id: string, field: keyof User, value: any) => {
    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (id: string) => {
    const updatedData = editState[id];
    if (updatedData) {
      await swimStore.updateUser(id, updatedData);
      setEditState(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  return (
    <Paper sx={{ p: 2, backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>Manage Users</Typography>
      
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#242424' }}>
        <Typography variant="h6" gutterBottom>Add New User</Typography>
        <form onSubmit={handleAddUser}>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <FormControlLabel
            control={<Checkbox checked={newUser.isAdmin} onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })} />}
            label="Is Admin"
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Add User</Button>
        </form>
      </Paper>

      <TableContainer component={Paper} sx={{ backgroundColor: '#242424' }}>
        <Table stickyHeader aria-label="manage users table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>Name</TableCell>
              <TableCell sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>Email</TableCell>
              <TableCell sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>Admin</TableCell>
              <TableCell sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {swimStore.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell sx={{ color: '#B0B0B0' }}>
                  {editState[user.id] ? (
                    <TextField value={editState[user.id]?.name} onChange={(e) => handleEditChange(user.id, 'name', e.target.value)} variant="standard" />
                  ) : (
                    user.name
                  )}
                </TableCell>
                <TableCell sx={{ color: '#B0B0B0' }}>
                  {editState[user.id] ? (
                    <TextField value={editState[user.id]?.email} onChange={(e) => handleEditChange(user.id, 'email', e.target.value)} variant="standard" />
                  ) : (
                    user.email
                  )}
                </TableCell>
                <TableCell sx={{ color: '#B0B0B0' }}>
                  {editState[user.id] ? (
                    <Checkbox checked={editState[user.id]?.isAdmin || false} onChange={(e) => handleEditChange(user.id, 'isAdmin', e.target.checked)} />
                  ) : (
                    user.isAdmin ? 'Yes' : 'No'
                  )}
                </TableCell>
                <TableCell>
                  {editState[user.id] ? (
                    <Button onClick={() => handleSave(user.id)} variant="contained" color="primary" size="small">Save</Button>
                  ) : (
                    <Button onClick={() => handleStartEditing(user)} variant="outlined" size="small">Edit</Button>
                  )}
                  <Button onClick={() => handleDeleteUser(user.id)} variant="contained" color="secondary" size="small" sx={{ ml: 1 }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default ManageUsers;
