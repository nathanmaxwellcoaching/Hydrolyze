import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const SwimRecordsTable = observer(() => {
  return (
    <Paper sx={{ p: 2, backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>Recent Swims</Typography>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="swim records table">
          <TableHead>
            <TableRow>
              {swimStore.visibleColumns.map((column) => (
                <TableCell key={column} sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {swimStore.filteredSwims.map((record) => (
              <TableRow key={record.id}>
                {swimStore.visibleColumns.map((column) => (
                  <TableCell key={column} sx={{ color: '#B0B0B0' }}>
                    {record[column as keyof typeof record]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default SwimRecordsTable;

