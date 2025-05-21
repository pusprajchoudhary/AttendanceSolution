import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';

const AttendancePage = () => {
  const [date, setDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendanceLogs = async (selectedDate) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/attendance/date/${selectedDate.toISOString().split('T')[0]}`);
      setAttendanceLogs(response.data);
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceLogs(date);
  }, [date]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Calendar
            onChange={handleDateChange}
            value={date}
          />
        </Paper>

        <Paper elevation={3} sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Attendance Logs for {date.toLocaleDateString()}
          </Typography>
          
          {loading ? (
            <Typography>Loading...</Typography>
          ) : attendanceLogs.length > 0 ? (
            <List>
              {attendanceLogs.map((log, index) => (
                <React.Fragment key={log._id}>
                  <ListItem>
                    <ListItemText
                      primary={log.user.name}
                      secondary={`Time: ${new Date(log.timestamp).toLocaleTimeString()} | Location: ${log.location}`}
                    />
                  </ListItem>
                  {index < attendanceLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>No attendance records found for this date</Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AttendancePage; 