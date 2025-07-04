import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
  TextField,
  Grid,
  Avatar,
  Typography,
  Box,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

import {
  postReply,
  getReplies,
  confirmMatch
} from '../../api/serviceBoard';

const formatTime = (isoString) => {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
};

const categoryToDisplayNameMap = {
  pet_spa: "Pet spa",
  pet_walking: "Pet walking",
  pet_daycare: "Daycares",
  pet_house_sitting: "Door-to-door sitting",
};

const ServiceCardDialog = ({ open, onClose, service, imageUrl, currentUser }) => {
  const [reply, setReply] = useState('');
  const [replies, setReplies] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyContentMap, setReplyContentMap] = useState({});

  const [matchDlgOpen, setMatchDlgOpen]   = useState(false);
  const [matchTarget, setMatchTarget]     = useState('');

  useEffect(() => {
    if (open && service?._id) {
      const fetchReplies = async () => {
        try {
          const res = await getReplies(service._id);
          setReplies(res);
        } catch (err) {
          console.error("Failed to fetch replies:", err);
        }
      };
      fetchReplies();
    }
  }, [open, service]);

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    const currentTime = new Date().toISOString();

    const replyData = new FormData();
    replyData.append("serviceId", service._id);
    replyData.append("replyContent", reply);
    replyData.append("timestamp", currentTime);

    try {
      const res = await postReply(replyData);
      if (res.status === 201) {
        setReply('');
        const updatedReplies = await getReplies(service._id);
        setReplies(updatedReplies);
      } else {
        alert("Failed to post reply.");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("An error occurred while posting the reply.");
    }
  };

  // Utility to check if the reply button should show
  const canReplyToThread = (threadOwner) => {
    const isOriginalPoster = currentUser === service.user_name;
    const isOwnThread = threadOwner === currentUser;
    const isThreadByPoster = threadOwner === service.user_name;
    if (isOriginalPoster) return threadOwner !== currentUser || isOwnThread;
    return isOwnThread || isThreadByPoster;
  };

  // Send reply to specific thread
  const handleThreadReplySend = async (threadOwner) => {
    const replyText = replyContentMap[threadOwner];
    if (!replyText?.trim()) return;

    const replyData = new FormData();
    replyData.append("serviceId", service._id);
    replyData.append("replyContent", replyText.trim());
    replyData.append("timestamp", new Date().toISOString());
    replyData.append("threadOwner", threadOwner);

    try {
      const res = await postReply(replyData);
      if (res.status === 201) {
        alert("Reply posted!");
        setReplyContentMap((prev) => ({ ...prev, [threadOwner]: '' }));
        setReplyInputs((prev) => ({ ...prev, [threadOwner]: false }));
        const updatedReplies = await getReplies(service._id);
        setReplies(updatedReplies);
      }
    } catch (err) {
      console.error("Reply failed:", err);
    }
  };

  // Confirm match logics
  const isOwner = currentUser === service?.user_name;
  const replyUsernames  = Object.keys(replies || {}).filter(name => name !== service?.user_name);
  const openMatchDialog  = () => setMatchDlgOpen(true);
  const closeMatchDialog = () => { setMatchDlgOpen(false); setMatchTarget(''); };
  const handleMatchConfirm = async () => {
    try {
      await confirmMatch(service._id, matchTarget);
      alert(`Matched with ${matchTarget}!`);
      closeMatchDialog();
      // optional: onClose();   // close the whole dialog if you like
    } catch (err) {
      console.error('Match update failed:', err);
      alert('Failed to confirm match.');
    }
  };

  const sortedThreadEntries = (replies && typeof replies === 'object') ? (
      Object.entries(replies)
        .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
        .sort((a, b) => {
          const aTime = new Date(a[1][0][Object.keys(a[1][0])[0]][1]);
          const bTime = new Date(b[1][0][Object.keys(b[1][0])[0]][1]);
          return aTime - bTime;
        })
      )
    : ([]);
  
  

  if (!service) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={imageUrl} variant="rounded" sx={{ width: 60, height: 60 }} />
            <Typography variant="h6">
              { 
                (service.service_type === 0) ? (
                  <>
                    <Box component="span" sx={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                      {service.user_name}
                    </Box>
                    {"'s request for "}
                    <Box component="span" sx={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                      {service.pet_name}
                    </Box>
                  </>
                ) : (
                  <>
                    <Box component="span" sx={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                      {service.user_name}
                    </Box>
                    {"'s offer"}
                  </>
                ) }
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Type:</strong> {service.service_type === 1 ? 'Offer' : 'Request'}</Typography>
              <Typography variant="body2"><strong>Category:</strong> {categoryToDisplayNameMap[service.service_category]}</Typography>
              <Typography variant="body2"><strong>Pet Type:</strong> {service.pet_type}</Typography>
              <Typography variant="body2"><strong>Breed:</strong> {service.breed}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Availability:</strong></Typography>
              <Typography variant="body2">{`${service.availability?.start || 'N/A'} - ${service.availability?.end || 'N/A'}`}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2"><strong>Location:</strong></Typography>
              <Typography variant="body2">
                {
                  ((service.location && service.location.place_name) ? 
                    service.location.place_name :
                    'No location provided.')
                }
              </Typography>
            </Grid>
            <Grid item size={12}>
              <Typography variant="body2" gutterBottom><strong>{service.user_name}'s notes:</strong></Typography>
              <Typography variant="body2">{service.notes || 'No additional notes provided.'}</Typography>
            </Grid>
            <Grid item size={12}>
              <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Replies</strong></Typography>
                  {sortedThreadEntries.length > 0 ? (
                    sortedThreadEntries.map(([threadOwner, messages], idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        {messages.map((msgObj, j) => {
                          const name = Object.keys(msgObj)[0];
                          const [text, time] = msgObj[name];
                          return (
                            <Box key={j} sx={{ display: 'flex', flexDirection: 'column', pl: j > 0 ? 4 : 0, my: 0.5 }}>
                              <Typography variant="body2">
                                <strong>{name}</strong>: {text}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  ({formatTime(time)})
                                </Typography>
                              </Typography>
                              {/* Show reply button only after the last message in the thread */}
                              {j === messages.length - 1 && canReplyToThread(threadOwner) && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() =>
                                      setReplyInputs((prev) => ({ ...prev, [threadOwner]: !prev[threadOwner] }))
                                    }
                                  >
                                    {replyInputs[threadOwner] ? 'Cancel' : 'Reply'}
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                        {/* If reply input is active for this thread */}
                        {replyInputs[threadOwner] && (
                          <Box sx={{ pl: 4, mt: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder={`Reply in ${threadOwner}'s thread`}
                              value={replyContentMap[threadOwner] || ''}
                              onChange={(e) =>
                                setReplyContentMap((prev) => ({ ...prev, [threadOwner]: e.target.value }))
                              }
                              sx={{ mb: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleThreadReplySend(threadOwner)}
                            >
                              Send
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No replies yet.</Typography>
                )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', flexDirection: 'column', px: 3, pb: 2, gap: 2 }}>
          <Box sx={{ display: 'flex' }}>
            <TextField
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              fullWidth
              placeholder="Write a reply..."
              size="small"
            />
            <Button variant="contained" onClick={handleSendReply}>Send</Button>
          </Box>
          {isOwner && replyUsernames.length > 0 && (
            <Button
              fullWidth            // spans the entire row
              color="success"
              variant="outlined"
              onClick={openMatchDialog}
            >
              Confirm Match
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* --------------- Match confirmation dialog --------------- */}
      <Dialog open={matchDlgOpen} onClose={closeMatchDialog}>
        <DialogTitle>Confirm a Match</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 300 }}>
          <FormControl fullWidth>
            <InputLabel id="match-select-label">Select User</InputLabel>
            <Select
              labelId="match-select-label"
              value={matchTarget}
              label="Select User"
              onChange={e => setMatchTarget(e.target.value)}
            >
              {replyUsernames.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMatchDialog}>Cancel</Button>
          <Button
            onClick={handleMatchConfirm}
            disabled={!matchTarget}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>  
  );
};

export default ServiceCardDialog;
