import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const ChatModal = ({ open, onClose, itemId, itemName }) => {
  // Message List, load Status, Input Fileds
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Current User
  const currentUser = localStorage.getItem("userId") || "guest-user";
  const currentUserName = localStorage.getItem("username") || "Guest";

  /* ---------- Pull Messages ---------- */
  const loadMessages = () => {
    if (!itemId) return;
    setLoading(true);
    fetch(`http://localhost:5000/chats/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to pull the message:", err);
        setLoading(false);
      });
  };

  /* When the dialog is opened/switched to itemId, pull the history record */
  useEffect(() => {
    if (open) loadMessages();
  }, [open, itemId]);

  /* Enable 5-second polling auto refresh */
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [open, itemId]);

  /* ---------- Send Message ---------- */
  const handleSendMessage = () => {
    const content = newMessage.trim();
    if (!content) return;

    const optimisticMsg = {
      _id: Date.now().toString(),
      item_id: itemId,
      sender_id: currentUser,
      sender_name: currentUserName,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");

    fetch("http://localhost:5000/chats/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        message: {
          senderId: currentUser,
          senderName: currentUserName,
          content,
        },
      }),
    })
      .then((res) => res.json())
      .then(() => loadMessages()) 
      .catch((err) => console.error("Send Message Failed:", err));
  };

  /* ---------- JSX ---------- */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>About “{itemName}”</DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box textAlign="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: "60vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 1,
            }}
          >
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUser;
              return (
                <Box
                  key={msg._id}
                  sx={{
                    display: "flex",
                    flexDirection: isMe ? "row-reverse" : "row",
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      bgcolor: isMe ? "#9F7AEA" : "#4A5568",
                      width: 32,
                      height: 32,
                      m: 0.5,
                    }}
                  >
                    {msg.sender_name.charAt(0)}
                  </Avatar>
                  {/* Bubble */}
                  <Box
                    sx={{
                      bgcolor: isMe ? "#E9D8FD" : "#EDF2F7",
                      borderRadius: 2,
                      p: 1,
                      maxWidth: "70%",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      {isMe ? "I" : msg.sender_name}
                    </Typography>
                    <Typography variant="body1">{msg.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Enter Message..."
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          variant="contained"
          sx={{ ml: 1, bgcolor: "#9F7AEA" }}
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <SendIcon />
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatModal;
