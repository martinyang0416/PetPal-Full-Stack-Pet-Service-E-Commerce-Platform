import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  // Chat states
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  // Get current user info from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = storedUser._id || storedUser.id || "guest-user";
  const currentUserName = storedUser.user_name || storedUser.username || "Guest";

  useEffect(() => {
    fetch(`http://localhost:5000/pets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPet(data);
        setFormData({
          name: data.name,
          type: data.type,
          condition: data.condition,
          price: data.price,
        });
      });
  }, [id]);

  // Load message history
  const loadMessages = () => {
    setLoadingMessages(true);
    fetch(`http://localhost:5000/chats/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoadingMessages(false);
      })
      .catch(() => setLoadingMessages(false));
  };
  useEffect(() => { loadMessages(); }, [id]);

  // Send a new message
  const handleSendMessage = () => {
    const content = newMessage.trim();
    if (!content) return;
    const optimisticMsg = {
      _id: Date.now().toString(),
      item_id: id,
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
        itemId: id,
        message: {
          senderId: currentUser,
          senderName: currentUserName,
          content,
        },
      }),
    })
      .then(() => loadMessages())
      .catch((err) => console.error("Send failed:", err));
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this pet?");
    if (!confirmed) return;

    await fetch(`http://localhost:5000/pets/${id}`, { method: "DELETE" });
    alert("Pet deleted.");
    navigate("/market_place");
  };

  const handleUpdate = async () => {
    await fetch(`http://localhost:5000/pets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    alert("Pet updated.");
    setEditing(false);
    window.location.reload();
  };

  if (!pet) return <Typography>Loading...</Typography>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        {pet.name}
      </Typography>
      <img
        src={`http://localhost:5000/pets/image/${pet.image}`}
        alt={pet.name}
        style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }}
      />
      <Typography mt={2}>Type: {pet.type}</Typography>
      <Typography>Condition: {pet.condition}</Typography>
      <Typography>Price: ${pet.price}</Typography>

      <Box mt={3}>
        <Button variant="contained" color="error" onClick={handleDelete} sx={{ mr: 2 }}>
          Delete
        </Button>
        <Button variant="outlined" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </Box>

      {/* Inline Chat Section */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Message board</Typography>
        {loadingMessages ? (
          <Box textAlign="center" p={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{
            maxHeight: "50vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 1,
            border: "1px solid #eee",
            borderRadius: 1,
          }}>
            {messages.map((msg) => (
              <Box key={msg._id} sx={{ borderBottom: "1px solid #ddd", pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: "#9F7AEA" }}>
                    {msg.sender_name.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {msg.sender_name}
                  </Typography>
                  <Typography variant="caption" sx={{ ml: "auto", color: "text.secondary" }}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ ml: 4 }}>
                  {msg.content}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <TextField
            placeholder="Enter Message..."
            fullWidth
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
        </Box>
      </Box>

      <Dialog open={editing} onClose={() => setEditing(false)}>
        <DialogTitle>Edit Pet</DialogTitle>
        <DialogContent>
          {Object.entries(formData).map(([key, value]) => (
            <TextField
              key={key}
              margin="dense"
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              name={key}
              type={typeof value === "number" ? "number" : "text"}
              fullWidth
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PetDetail;
