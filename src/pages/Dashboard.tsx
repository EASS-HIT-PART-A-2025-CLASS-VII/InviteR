import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Grid,
  AlertColor,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { Add as AddIcon, WhatsApp as WhatsAppIcon, Sms as SmsIcon, Delete as DeleteIcon, Edit as EditIcon, Send as SendIcon, FilterList as FilterListIcon, RestartAlt as RestartAltIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import type { GuestStatus, Guest, Event, Wave, User } from '../types';

const DashboardContainer = styled(Container)`
  padding: 2rem 0;
`;

const HeaderContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ButtonContainer = styled(Box)`
  display: flex;
  gap: 1rem;
`;

const LogoutButton = styled(Button)`
  background-color: #f44336;
  color: white;
  &:hover {
    background-color: #d32f2f;
  }
`;

const ProfileButton = styled(Button)`
  background-color: #2196f3;
  color: white;
  &:hover {
    background-color: #1976d2;
  }
`;

const ActionButton = styled(Button)`
  margin: 0.5rem;
`;

const GuestDialog = styled(Dialog)`
  & .MuiDialog-paper {
    min-width: 400px;
  }
`;

const WaveDialog = styled(Dialog)`
  & .MuiDialog-paper {
    min-width: 500px;
  }
`;

const WeddingDetails = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

const DetailItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const GuestTable = styled(Table)`
  margin-top: 2rem;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatusSelect = styled(Select)`
  min-width: 120px;
`;

const QuantitySelect = styled(Select)`
  min-width: 80px;
`;

const Dashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [statusTabValue, setStatusTabValue] = useState(0);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [waveDialogOpen, setWaveDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedWave, setSelectedWave] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as AlertColor });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [openAddGuest, setOpenAddGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ 
    name: '', 
    phone: '', 
    quantity: 1, 
    status: 'pending' as const, 
    wave: 0,
    table: '' 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteGuestDialogOpen, setDeleteGuestDialogOpen] = useState(false);
  const [deleteWaveDialogOpen, setDeleteWaveDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<string | null>(null);
  const [waveToDelete, setWaveToDelete] = useState<any>(null);
  const [newWave, setNewWave] = useState({
    name: '',
    date: '',
    time: '',
    type: 'sms' as 'sms' | 'whatsapp' | 'phone',
    message: ''
  });
  const [editGuestDialogOpen, setEditGuestDialogOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [resetWaveId, setResetWaveId] = useState<number | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [statusesToSend, setStatusesToSend] = useState<string[]>(['טרם ענה']);

  const statusOptions = [
    'טרם ענה',
    'מגיע',
    'לא מגיע',
    'אולי'
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStatusTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setStatusTabValue(newValue);
  };

  const getFilteredGuests = () => {
    switch (statusTabValue) {
      case 0: // כל האורחים
        return guests;
      case 1: // מגיעים
        return guests.filter(guest => guest.status === 'מגיע');
      case 2: // לא מגיעים
        return guests.filter(guest => guest.status === 'לא מגיע');
      case 3: // אולי
        return guests.filter(guest => guest.status === 'אולי');
      case 4: // מספר לא תקין
        return guests.filter(guest => guest.status === 'מספר לא תקין');
      default:
        return guests;
    }
  };

  const handleAddGuest = async () => {
    console.log('=== Starting handleAddGuest ===');
    console.log('Current user state:', user);
    console.log('Current newGuest state:', newGuest);

    if (!user || !user.events || user.events.length === 0) {
      console.error('No user or events found:', { user });
      showSnackbar('לא נמצא אירוע', 'error');
      return;
    }

    // Validate guest data
    if (!newGuest.name || !newGuest.phone) {
      console.error('Invalid guest data:', newGuest);
      showSnackbar('שם ומספר טלפון הם שדות חובה', 'error');
      return;
    }

    try {
      console.log('=== Preparing request ===');
      console.log('API endpoint:', API_ENDPOINTS.GUESTS.BASE);
      console.log('New guest details:', newGuest);
      console.log('User phone:', user.phoneNumber);
      console.log('Event ID:', user.events[0]._id);

      const requestBody = {
        phoneNumber: user.phoneNumber,
        eventId: user.events[0]._id,
        guest: newGuest
      };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      console.log('=== Sending request ===');
      const response = await fetch(API_ENDPOINTS.GUESTS.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid server response');
      }

      // Update the local state with the new guest
      if (user && user.events && user.events.length > 0) {
        const updatedEvents = [...user.events];
        updatedEvents[0] = data.event;
        setUser({ ...user, events: updatedEvents });
        setGuests(data.event.guests);
        console.log('Updated guests list:', data.event.guests);
      }

      // Reset form and close dialog
      setNewGuest({ name: '', phone: '', quantity: 1, status: 'pending', wave: 0, table: '' });
      setOpenAddGuest(false);
      showSnackbar('אורח נוסף בהצלחה', 'success');
    } catch (error) {
      console.error('Error in handleAddGuest:', error);
      showSnackbar(error instanceof Error ? error.message : 'שגיאה בהוספת אורח', 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files) return;
    
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('phoneNumber', user.phoneNumber);

    try {
      const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        showSnackbar(`Imported ${data.imported} guests successfully`, 'success');
        fetchGuests();
      } else {
        showSnackbar(data.message, 'error');
      }
    } catch (error) {
      console.error('Error importing guests:', error);
      showSnackbar('Error importing guests', 'error');
    }
  };

  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (user) {
      fetchGuests();
    }
  }, [user]);

  const fetchGuests = async () => {
    if (!user) return;

    try {
      console.log('Fetching guests for user:', user.phoneNumber);
      const url = `${API_ENDPOINTS.GUESTS.BASE}?phoneNumber=${user.phoneNumber}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Log the raw response
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid server response - could not parse JSON');
      }

      console.log('Parsed response:', data);
      
      if (data.guests) {
        setGuests(data.guests);
      } else {
        console.warn('No guests array in response:', data);
        setGuests([]);
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      showSnackbar(error instanceof Error ? error.message : 'שגיאה בטעינת אורחים', 'error');
    }
  };

  const handleStatusChange = async (guestId: string, newStatus: GuestStatus) => {
    try {
      if (!user || !user.events || user.events.length === 0) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }

      const eventId = user.events[0]._id;
      console.log('Updating guest status:', { guestId, newStatus, eventId });

      const response = await fetch(API_ENDPOINTS.GUESTS.UPDATE_STATUS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId,
          guestId,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      console.log('Status update response:', data);

      // Update local state
      setUser(prev => {
        if (!prev) return null;
        const updatedEvents = prev.events.map(event => {
          if (event._id === eventId) {
            return {
              ...event,
              guests: event.guests.map(guest => {
                if (guest._id === guestId) {
                  return {
                    ...guest,
                    status: newStatus,
                    confirmedQuantity: newStatus === 'מגיע' ? guest.quantity : 0
                  };
                }
                return guest;
              })
            };
          }
          return event;
        });
        return { ...prev, events: updatedEvents };
      });

      showSnackbar('סטטוס עודכן בהצלחה', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('שגיאה בעדכון סטטוס', 'error');
    }
  };

  const handleQuantityChange = async (guestId: string, newQuantity: number) => {
    try {
      if (!user || !user.events || user.events.length === 0) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }

      const eventId = user.events[0]._id;
      console.log('Updating guest quantity:', { guestId, newQuantity, eventId });

      const response = await fetch(API_ENDPOINTS.GUESTS.UPDATE_QUANTITY, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId,
          guestId,
          quantity: newQuantity
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const data = await response.json();
      console.log('Quantity update response:', data);

      // Update local state
      setUser((prevUser: User | null) => {
        if (!prevUser) return null;
        const updatedEvents = prevUser.events.map((event: Event) => {
          if (event._id === eventId) {
            return {
              ...event,
              guests: event.guests.map((guest: Guest) => {
                if (guest._id === guestId) {
                  return {
                    ...guest,
                    quantity: newQuantity,
                    // If status is 'מגיע', update confirmedQuantity as well
                    confirmedQuantity: guest.status === 'מגיע' ? newQuantity : guest.confirmedQuantity
                  };
                }
                return guest;
              })
            };
          }
          return event;
        });
        return { ...prevUser, events: updatedEvents };
      });

      showSnackbar('כמות עודכנה בהצלחה', 'success');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showSnackbar('שגיאה בעדכון כמות', 'error');
    }
  };

  const handleConfirmedQuantityChange = async (guestId: string, newConfirmed: number) => {
    try {
      if (!user || !user.events || user.events.length === 0) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }
      const eventId = user.events[0]._id;
      const response = await fetch(API_ENDPOINTS.GUESTS.UPDATE_QUANTITY, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId,
          guestId,
          confirmedQuantity: newConfirmed
        })
      });
      if (!response.ok) throw new Error('שגיאה בעדכון כמות מאושרת');
      const data = await response.json();
      // Update local state
      if (user && user.events && user.events.length > 0) {
        const updatedEvents = [...user.events];
        updatedEvents[0] = data.event;
        setUser({ ...user, events: updatedEvents });
        setGuests(data.event.guests);
      }
      showSnackbar('כמות מאושרת עודכנה', 'success');
    } catch (error) {
      showSnackbar('שגיאה בעדכון כמות מאושרת', 'error');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      if (!user || !user.events || user.events.length === 0) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }

      const eventId = user.events[0]._id;
      console.log('Deleting guest:', { guestId, eventId });

      const response = await fetch(
        `${API_ENDPOINTS.GUESTS.BASE}/${guestId}?phoneNumber=${user.phoneNumber}&eventId=${eventId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }

      const data = await response.json();
      console.log('Delete response:', data);

      // Update local state
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          events: prev.events.map(event => {
            if (event._id === eventId) {
              return {
                ...event,
                guests: event.guests.filter(guest => guest._id !== guestId)
              };
            }
            return event;
          })
        };
      });

      showSnackbar('אורח נמחק בהצלחה', 'success');
    } catch (error) {
      console.error('Error deleting guest:', error);
      showSnackbar('שגיאה במחיקת אורח', 'error');
    }
  };

  const handleGuestClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setGuestDialogOpen(true);
  };

  const handleWaveClick = (wave: Wave) => {
    setSelectedWave(wave);
    setWaveDialogOpen(true);
  };

  const handleCloseGuestDialog = () => {
    setGuestDialogOpen(false);
    setSelectedGuest(null);
  };

  const handleCloseWaveDialog = () => {
    setWaveDialogOpen(false);
    setSelectedWave(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleAddGuestClick = () => {
    setOpenAddGuest(true);
  };

  const handleCloseAddGuest = () => {
    setOpenAddGuest(false);
    setNewGuest({ name: '', phone: '', quantity: 1, status: 'pending', wave: 0, table: '' });
  };

  const handleNewGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewGuest(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }));
  };

  const handleDeleteGuestClick = (guestId: string) => {
    setGuestToDelete(guestId);
    setDeleteGuestDialogOpen(true);
  };

  const handleDeleteWaveClick = (wave: any) => {
    setWaveToDelete(wave);
    setDeleteWaveDialogOpen(true);
  };

  const handleDeleteGuestConfirm = async () => {
    if (guestToDelete) {
      await handleDeleteGuest(guestToDelete);
      setDeleteGuestDialogOpen(false);
      setGuestToDelete(null);
    }
  };

  const handleDeleteWaveConfirm = async () => {
    if (waveToDelete) {
      await handleDeleteWave();
      setDeleteWaveDialogOpen(false);
      setWaveToDelete(null);
    }
  };

  const handleDeleteGuestCancel = () => {
    setDeleteGuestDialogOpen(false);
    setGuestToDelete(null);
  };

  const handleDeleteWaveCancel = () => {
    setDeleteWaveDialogOpen(false);
    setWaveToDelete(null);
  };

  const handleAddWave = async () => {
    try {
      if (!user || !user.events || user.events.length === 0) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }

      // Validate wave data
      if (!newWave.name || !newWave.date || !newWave.time || !newWave.message) {
        showSnackbar('כל השדות הם חובה', 'error');
        return;
      }

      const eventId = user.events[0]._id;
      if (!eventId) {
        showSnackbar('לא נמצא מזהה אירוע', 'error');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/waves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId,
          wave: newWave
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בהוספת גל');
      }

      const data = await response.json();
      
      // Update local state
      if (user && user.events && user.events.length > 0) {
        const updatedEvents = [...user.events];
        updatedEvents[0] = data.event;
        setUser({ ...user, events: updatedEvents });
      }

      // Reset form and close dialog
      setNewWave({
        name: '',
        date: '',
        time: '',
        type: 'sms',
        message: ''
      });
      setWaveDialogOpen(false);
      showSnackbar('גל נוסף בהצלחה', 'success');
    } catch (error) {
      console.error('Error adding wave:', error);
      showSnackbar(error instanceof Error ? error.message : 'שגיאה בהוספת גל', 'error');
    }
  };

  const handleUpdateWave = async () => {
    try {
      if (!user || !user.events || user.events.length === 0 || !selectedWave) {
        showSnackbar('לא נמצא אירוע או גל', 'error');
        return;
      }

      // Validate wave data
      if (!newWave.name || !newWave.date || !newWave.time || !newWave.message) {
        showSnackbar('כל השדות הם חובה', 'error');
        return;
      }

      const eventId = user.events[0]._id;
      if (!eventId) {
        showSnackbar('לא נמצא מזהה אירוע', 'error');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/waves/${selectedWave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId,
          wave: {
            ...newWave,
            id: selectedWave.id
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בעדכון גל');
      }

      const data = await response.json();
      
      // Update local state
      if (user && user.events && user.events.length > 0) {
        const updatedEvents = [...user.events];
        updatedEvents[0] = data.event;
        setUser({ ...user, events: updatedEvents });
      }

      // Reset form and close dialog
      setNewWave({
        name: '',
        date: '',
        time: '',
        type: 'sms',
        message: ''
      });
      setWaveDialogOpen(false);
      setSelectedWave(null);
      showSnackbar('גל עודכן בהצלחה', 'success');
    } catch (error) {
      console.error('Error updating wave:', error);
      showSnackbar(error instanceof Error ? error.message : 'שגיאה בעדכון גל', 'error');
    }
  };

  const handleDeleteWave = async () => {
    if (!user || !user.events || user.events.length === 0 || !waveToDelete) {
      showSnackbar('לא נמצא אירוע או גל', 'error');
      return;
    }
    const eventId = user.events[0]._id;
    try {
      const response = await fetch(
        `${API_ENDPOINTS.GUESTS.BASE}/waves/${waveToDelete.id}?phoneNumber=${user.phoneNumber}&eventId=${eventId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        showSnackbar('שגיאה במחיקת גל', 'error');
        return;
      }
      const data = await response.json();
      if (user && user.events && user.events.length > 0) {
        const updatedEvents = [...user.events];
        updatedEvents[0] = data.event;
        setUser({ ...user, events: updatedEvents });
      }
      setWaveToDelete(null);
      showSnackbar('גל נמחק בהצלחה', 'success');
    } catch (error) {
      showSnackbar('שגיאה במחיקת גל', 'error');
    }
  };

  const handleSendNow = async (wave: Wave) => {
    if (wave.active === false) {
      showSnackbar('הגל הזה אינו פעיל', 'error');
      return;
    }
    try {
      if (!user || !user.events || user.events.length === 0) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }

      const currentEvent = user.events[0];
      if (!currentEvent) {
        showSnackbar('לא נמצא אירוע', 'error');
        return;
      }

      const sendResponse = await fetch(API_ENDPOINTS.GUESTS.WAVES.SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId: currentEvent._id,
          waveId: wave.id,
          statusesToSend
        }),
      });

      if (!sendResponse.ok) {
        throw new Error('Failed to send wave');
      }

      const data = await sendResponse.json();
      showSnackbar(`הגל נשלח בהצלחה ל-${data.sentTo} אורחים`, 'success');
      
      // Refresh waves list
      const wavesResponse = await fetch(`${API_ENDPOINTS.GUESTS.WAVES.BASE}?phoneNumber=${user.phoneNumber}&eventId=${currentEvent._id}`);
      if (!wavesResponse.ok) {
        throw new Error('Failed to refresh waves');
      }
      const wavesData = await wavesResponse.json();
      
      // Update the event's waves
      const updatedEvent = {
        ...currentEvent,
        waves: wavesData.waves
      };
      
      // Update user state
      setUser({
        ...user,
        events: [updatedEvent, ...user.events.slice(1)]
      });
    } catch (error: unknown) {
      console.error('Error sending wave:', error);
      showSnackbar('שגיאה בשליחת הגל', 'error');
    }
  };

  const handleEditGuestClick = (guest: Guest) => {
    setGuestToEdit(guest);
    setEditGuestDialogOpen(true);
  };

  const handleEditGuestChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    if (!guestToEdit) return;
    const { name, value } = e.target;
    setGuestToEdit(prev => prev ? { ...prev, [name!]: name === 'quantity' || name === 'wave' ? Number(value) : value } : null);
  };

  const handleEditGuestStatusChange = (e: SelectChangeEvent) => {
    if (!guestToEdit) return;
    const { name, value } = e.target;
    setGuestToEdit(prev => prev ? { ...prev, [name!]: value } : null);
  };

  const handleEditGuestSave = async () => {
    if (!guestToEdit || !user || !user.events || user.events.length === 0) return;
    try {
      const eventId = user.events[0]._id;
      console.log('Updating guest:', guestToEdit);
      const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/${guestToEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          eventId,
          guest: {
            ...guestToEdit,
            table: guestToEdit.table || ''
          }
        })
      });
      if (!response.ok) throw new Error('שגיאה בעדכון אורח');
      const data = await response.json();
      console.log('Update response:', data);
      // Update local state
      const updatedEvents = [...user.events];
      updatedEvents[0] = data.event;
      setUser({ ...user, events: updatedEvents });
      setGuests(data.event.guests);
      setEditGuestDialogOpen(false);
      setGuestToEdit(null);
      showSnackbar('האורח עודכן בהצלחה', 'success');
    } catch (error) {
      console.error('Error updating guest:', error);
      showSnackbar('שגיאה בעדכון אורח', 'error');
    }
  };

  const handleResetWave = (waveId: number) => {
    setResetWaveId(waveId);
    setResetDialogOpen(true);
  };

  const handleConfirmResetWave = async () => {
    if (!user || !user.events || user.events.length === 0 || resetWaveId == null) return;
    const eventId = user.events[0]._id;
    try {
      const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/waves/${resetWaveId}/reset-send-count`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: user.phoneNumber, eventId })
      });
      if (!response.ok) throw new Error('שגיאה באיפוס קאונטר');
      const data = await response.json();
      // Update local state
      if (user && user.events && user.events.length > 0) {
        const updatedEvents = [...user.events];
        updatedEvents[0] = data.event;
        setUser({ ...user, events: updatedEvents });
      }
      setResetDialogOpen(false);
      setResetWaveId(null);
      showSnackbar('הקאונטר אופס בהצלחה', 'success');
    } catch (error) {
      showSnackbar('שגיאה באיפוס קאונטר', 'error');
      setResetDialogOpen(false);
      setResetWaveId(null);
    }
  };

  const handleCancelResetWave = () => {
    setResetDialogOpen(false);
    setResetWaveId(null);
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = searchQuery === '' || 
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phone.includes(searchQuery);
    
    const matchesPendingFilter = !showOnlyPending || 
      (guest.status !== 'מגיע' && guest.status !== 'לא מגיע');
    
    const matchesStatusTab = (() => {
      switch (statusTabValue) {
        case 0: // כל האורחים
          return true;
        case 1: // מגיעים
          return guest.status === 'מגיע';
        case 2: // לא מגיעים
          return guest.status === 'לא מגיע';
        case 3: // אולי
          return guest.status === 'אולי';
        case 4: // מספר לא תקין
          return guest.status === 'מספר לא תקין';
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesPendingFilter && matchesStatusTab;
  });

  if (!user) {
    return <Typography>Please log in to view the dashboard.</Typography>;
  }

  if (!user?.events || user.events.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            ברוכים הבאים ל-InviteR!
          </Typography>
          <Typography variant="body1" paragraph>
            לפני שתוכלו להתחיל להוסיף אורחים, עליכם להגדיר את פרטי האירוע שלכם.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/profile')}
            sx={{ mt: 2 }}
          >
            הגדרת פרטי האירוע
          </Button>
        </Paper>
      </Container>
    );
  }

  const currentEvent = user.events[0];
  if (!currentEvent) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            שגיאה בטעינת האירוע
          </Typography>
          <Typography variant="body1" paragraph>
            לא ניתן לטעון את פרטי האירוע. אנא נסה שוב מאוחר יותר.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/profile')}
            sx={{ mt: 2 }}
          >
            חזרה לפרופיל
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <DashboardContainer>
      <HeaderContainer>
        <Typography variant="h4" component="h1">
          דשבורד
        </Typography>
        <ButtonContainer>
          <ProfileButton
            variant="contained"
            onClick={() => navigate('/profile')}
          >
            עריכת פרופיל
          </ProfileButton>
          <LogoutButton
            variant="contained"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
          >
            התנתק
          </LogoutButton>
        </ButtonContainer>
      </HeaderContainer>
      
      {user?.events && user.events.length > 0 && (
        <WeddingDetails>
          <Typography variant="h5" gutterBottom>
            פרטי האירוע
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <DetailItem>
                <Typography variant="subtitle1" color="textSecondary">
                  שם החתן והכלה
                </Typography>
                <Typography variant="body1">
                  {user.events[0].name}
                </Typography>
              </DetailItem>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailItem>
                <Typography variant="subtitle1" color="textSecondary">
                  תאריך
                </Typography>
                <Typography variant="body1">
                  {new Date(user.events[0].date).toLocaleDateString('he-IL')}
                </Typography>
              </DetailItem>
            </Grid>
            <Grid item xs={12}>
              <DetailItem>
                <Typography variant="subtitle1" color="textSecondary">
                  מיקום
                </Typography>
                <Typography variant="body1">
                  {user.events[0].location}
                </Typography>
              </DetailItem>
            </Grid>
          </Grid>
        </WeddingDetails>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="אורחים" />
          <Tab label="גלים" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <ActionButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddGuest(true)}
          >
            הוספת אורח
          </ActionButton>
          <Button
            variant="outlined"
            component="label"
            sx={{ margin: '0.5rem' }}
          >
            ייבא מאקסל
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={statusTabValue} onChange={handleStatusTabChange}>
            <Tab label="כל האורחים" />
            <Tab label="מגיעים" />
            <Tab label="לא מגיעים" />
            <Tab label="אולי" />
            <Tab label="מספר לא תקין" />
          </Tabs>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            רשימת אורחים
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="חיפוש לפי שם או מספר טלפון"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
            <Button
              variant={showOnlyPending ? "contained" : "outlined"}
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              startIcon={<FilterListIcon />}
            >
              {showOnlyPending ? 'הצג את כל האורחים' : 'הצג רק ממתינים לתשובה'}
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>שם</TableCell>
                  <TableCell>טלפון</TableCell>
                  <TableCell>כמות</TableCell>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>כמה אישרו</TableCell>
                  <TableCell>גל</TableCell>
                  <TableCell>מספר שולחן</TableCell>
                  <TableCell>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest._id}>
                    <TableCell>{guest.name}</TableCell>
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>
                      <QuantitySelect
                        value={guest.quantity}
                        onChange={(e) => handleQuantityChange(guest._id, Number(e.target.value))}
                        size="small"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <MenuItem key={num} value={num}>
                            {num}
                          </MenuItem>
                        ))}
                      </QuantitySelect>
                    </TableCell>
                    <TableCell>
                      <StatusSelect
                        value={guest.status}
                        onChange={(e) => handleStatusChange(guest._id, e.target.value as GuestStatus)}
                        size="small"
                      >
                        <MenuItem value="מגיע">מגיע</MenuItem>
                        <MenuItem value="לא מגיע">לא מגיע</MenuItem>
                        <MenuItem value="אולי">אולי</MenuItem>
                        <MenuItem value="מספר לא תקין">מספר לא תקין</MenuItem>
                      </StatusSelect>
                    </TableCell>
                    <TableCell>
                      {guest.status === 'מגיע' ? (
                        <Select
                          value={guest.confirmedQuantity || ''}
                          onChange={(e) => handleConfirmedQuantityChange(guest._id, Number(e.target.value))}
                          size="small"
                          displayEmpty
                        >
                          <MenuItem value="" disabled>בחר</MenuItem>
                          {Array.from({ length: guest.quantity }, (_, i) => i + 1).map(num => (
                            <MenuItem key={num} value={num}>{num}</MenuItem>
                          ))}
                        </Select>
                      ) : null}
                    </TableCell>
                    <TableCell>{guest.wave}</TableCell>
                    <TableCell>{guest.table || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGuestClick(guest._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditGuestClick(guest)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGuests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {searchQuery ? 'לא נמצאו תוצאות לחיפוש' : 'אין אורחים להצגה'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <ActionButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setWaveDialogOpen(true)}
          >
            הוספת גל
          </ActionButton>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>תאריך</TableCell>
                <TableCell>שעה</TableCell>
                <TableCell>סוג</TableCell>
                <TableCell>הודעה</TableCell>
                <TableCell>מספר שליחות</TableCell>
                <TableCell>איפוס קאונטר</TableCell>
                <TableCell>פעיל</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentEvent?.waves.map((wave) => (
                <TableRow key={wave.id}>
                  <TableCell>{new Date(wave.date).toLocaleDateString('he-IL')}</TableCell>
                  <TableCell>{wave.time}</TableCell>
                  <TableCell>{wave.type}</TableCell>
                  <TableCell>{wave.message}</TableCell>
                  <TableCell>{wave.sendCount || 0}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleResetWave(wave.id)}
                    >
                      <RestartAltIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={wave.active !== false}
                      onChange={async (e) => {
                        if (!user || !user.events || user.events.length === 0) return;
                        const eventId = user.events[0]._id;
                        const response = await fetch(`${API_ENDPOINTS.GUESTS.BASE}/waves/${wave.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            phoneNumber: user.phoneNumber,
                            eventId,
                            wave: { ...wave, active: e.target.checked }
                          })
                        });
                        if (response.ok) {
                          const data = await response.json();
                          const updatedEvents = [...user.events];
                          updatedEvents[0] = data.event;
                          setUser({ ...user, events: updatedEvents });
                          showSnackbar('סטטוס הגל עודכן', 'success');
                        } else {
                          showSnackbar('שגיאה בעדכון סטטוס הגל', 'error');
                        }
                      }}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedWave(wave);
                          setNewWave({
                            name: wave.name || '',
                            date: wave.date,
                            time: wave.time,
                            type: wave.type,
                            message: wave.message
                          });
                          setWaveDialogOpen(true);
                        }}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteWaveClick(wave)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      {(!wave.status || wave.status === 'pending') && wave.active !== false && (
                        <IconButton
                          size="small"
                          onClick={() => handleSendNow(wave)}
                          sx={{ color: 'success.main' }}
                        >
                          <SendIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <GuestDialog open={openAddGuest} onClose={() => setOpenAddGuest(false)}>
        <DialogTitle>הוספת אורח</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="שם"
            fullWidth
            value={newGuest.name}
            onChange={handleNewGuestChange}
          />
          <TextField
            margin="dense"
            name="phone"
            label="טלפון"
            fullWidth
            value={newGuest.phone}
            onChange={handleNewGuestChange}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="כמות"
            type="number"
            fullWidth
            value={newGuest.quantity}
            onChange={handleNewGuestChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>מספר שולחן</InputLabel>
            <Select
              name="table"
              value={newGuest.table}
              label="מספר שולחן"
              onChange={e => setNewGuest(prev => ({ ...prev, table: e.target.value }))}
            >
              <MenuItem value="">ללא</MenuItem>
              {Array.from({ length: 40 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddGuest(false)}>ביטול</Button>
          <Button onClick={handleAddGuest} variant="contained">
            הוסף
          </Button>
        </DialogActions>
      </GuestDialog>

      <WaveDialog open={waveDialogOpen} onClose={() => setWaveDialogOpen(false)}>
        <DialogTitle>{selectedWave ? 'עריכת גל' : 'הוספת גל חדש'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="שם הגל"
              value={newWave.name}
              onChange={(e) => setNewWave({ ...newWave, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="תאריך"
              type="date"
              value={newWave.date}
              onChange={(e) => setNewWave({ ...newWave, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>דקות</InputLabel>
                <Select
                  value={newWave.time.split(':')[1]}
                  onChange={(e) => {
                    const hours = newWave.time.split(':')[0];
                    setNewWave({ ...newWave, time: `${hours}:${e.target.value}` });
                  }}
                  label="דקות"
                >
                  {['00', '15', '30', '45'].map((minute) => (
                    <MenuItem key={minute} value={minute}>
                      {minute}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>שעה</InputLabel>
                <Select
                  value={newWave.time.split(':')[0]}
                  onChange={(e) => {
                    const minutes = newWave.time.split(':')[1];
                    setNewWave({ ...newWave, time: `${e.target.value}:${minutes}` });
                  }}
                  label="שעה"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <MenuItem key={hour} value={hour}>
                        {hour}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth>
              <InputLabel>סוג הגל</InputLabel>
              <Select
                value={newWave.type}
                onChange={(e) => setNewWave({ ...newWave, type: e.target.value as 'sms' | 'whatsapp' | 'phone' })}
                label="סוג הגל"
              >
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="phone">טלפון</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="הודעה"
                value={newWave.message}
                onChange={(e) => setNewWave({ ...newWave, message: e.target.value })}
                fullWidth
                multiline
                rows={4}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  משתנים זמינים - לחץ כדי להוסיף:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { key: '{Name}', label: 'שם האורח' },
                    { key: '{EventDate}', label: 'תאריך האירוע' },
                    { key: '{EventLocation}', label: 'מיקום האירוע' },
                    { key: '{GroomName}', label: 'שם החתן' },
                    { key: '{BrideName}', label: 'שם הכלה' },
                    { key: '{GroomPhone}', label: 'טלפון החתן' },
                    { key: '{BridePhone}', label: 'טלפון הכלה' }
                  ].map((variable) => (
                    <Button
                      key={variable.key}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const cursorPosition = (document.querySelector('textarea') as HTMLTextAreaElement)?.selectionStart || 0;
                        const textBefore = newWave.message.substring(0, cursorPosition);
                        const textAfter = newWave.message.substring(cursorPosition);
                        setNewWave({
                          ...newWave,
                          message: textBefore + variable.key + textAfter
                        });
                      }}
                      sx={{
                        fontSize: '0.8rem',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {variable.label}
                    </Button>
                  ))}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  דוגמה: שלום {newWave.name ? '{Name}' : 'שם האורח'}, אתם מוזמנים לחתונה של {newWave.name ? '{GroomName}' : 'שם החתן'} ו-{newWave.name ? '{BrideName}' : 'שם הכלה'} בתאריך {newWave.name ? '{EventDate}' : 'תאריך האירוע'} ב-{newWave.name ? '{EventLocation}' : 'מיקום האירוע'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">בחר סטטוסי אורחים לשליחה:</Typography>
              <FormGroup row>
                {statusOptions.map(status => (
                  <FormControlLabel
                    key={status}
                    control={
                      <Checkbox
                        checked={statusesToSend.includes(status)}
                        onChange={e => {
                          if (e.target.checked) {
                            setStatusesToSend(prev => [...prev, status]);
                          } else {
                            setStatusesToSend(prev => prev.filter(s => s !== status));
                          }
                        }}
                      />
                    }
                    label={status}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setWaveDialogOpen(false);
            setSelectedWave(null);
            setNewWave({
              name: '',
              date: '',
              time: '',
              type: 'sms',
              message: ''
            });
          }}>ביטול</Button>
          <Button 
            onClick={selectedWave ? handleUpdateWave : handleAddWave} 
            variant="contained" 
            color="primary"
          >
            {selectedWave ? 'עדכן גל' : 'הוסף גל'}
          </Button>
        </DialogActions>
      </WaveDialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteGuestDialogOpen}
        onClose={handleDeleteGuestCancel}
      >
        <DialogTitle>אישור מחיקת אורח</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את האורח?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteGuestCancel}>ביטול</Button>
          <Button onClick={handleDeleteGuestConfirm} color="error" variant="contained">
            מחק
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteWaveDialogOpen}
        onClose={handleDeleteWaveCancel}
      >
        <DialogTitle>אישור מחיקת גל</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את הגל?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteWaveCancel}>ביטול</Button>
          <Button onClick={handleDeleteWaveConfirm} color="error" variant="contained">
            מחק
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editGuestDialogOpen} onClose={() => setEditGuestDialogOpen(false)}>
        <DialogTitle>עריכת אורח</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="שם"
            fullWidth
            value={guestToEdit?.name || ''}
            onChange={handleEditGuestChange}
          />
          <TextField
            margin="dense"
            name="phone"
            label="טלפון"
            fullWidth
            value={guestToEdit?.phone || ''}
            onChange={handleEditGuestChange}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="כמות"
            type="number"
            fullWidth
            value={guestToEdit?.quantity || 1}
            onChange={handleEditGuestChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>מספר שולחן</InputLabel>
            <Select
              name="table"
              value={guestToEdit?.table || ''}
              label="מספר שולחן"
              onChange={e => setGuestToEdit(prev => prev ? { ...prev, table: e.target.value } : null)}
            >
              <MenuItem value="">ללא</MenuItem>
              {Array.from({ length: 40 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>סטטוס</InputLabel>
            <Select
              name="status"
              value={guestToEdit?.status || 'טרם ענה'}
              label="סטטוס"
              onChange={handleEditGuestStatusChange}
            >
              <MenuItem value="טרם ענה">טרם ענה</MenuItem>
              <MenuItem value="מגיע">מגיע</MenuItem>
              <MenuItem value="לא מגיע">לא מגיע</MenuItem>
              <MenuItem value="אולי">אולי</MenuItem>
              <MenuItem value="מספר לא תקין">מספר לא תקין</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="wave"
            label="מספר גל"
            type="number"
            fullWidth
            value={guestToEdit?.wave || 0}
            onChange={handleEditGuestChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGuestDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleEditGuestSave} variant="contained">שמור</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetDialogOpen} onClose={handleCancelResetWave}>
        <DialogTitle>איפוס קאונטר של הגל</DialogTitle>
        <DialogContent>
          <Typography>האם אתה בטוח שברצונך לאפס את הקאונטר של הגל?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelResetWave}>ביטול</Button>
          <Button onClick={handleConfirmResetWave} color="primary" variant="contained">איפוס</Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};

export default Dashboard; 