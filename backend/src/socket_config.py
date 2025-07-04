from flask_socketio import SocketIO

# Initialize without app
socketio = SocketIO()

def init_socketio(app):
    # Configure socketio with app
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Register socket event handlers
    register_handlers()
    
    return socketio

# add your socketio event handlers here
def register_handlers():
    # Socket.IO event handlers
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('message')
    def handle_message(data):
        print(f'Received message: {data}')
        # Broadcast to all clients
        socketio.emit('message', data)
    
    # Follow-related event handlers
    @socketio.on('follow_request')
    def handle_follow_request(data):
        print(f'Follow request: {data}')
        socketio.emit('follow_request_received', data)
    
    @socketio.on('follow_request_response')
    def handle_follow_response(data):
        print(f'Follow response: {data}')
        socketio.emit('follow_request_updated', data)
    
    @socketio.on('unfollow')
    def handle_unfollow(data):
        print(f'Unfollow: {data}')
        socketio.emit('follower_update', data)

def send_message(event_name, data, room=None):
    """
    Send a message to a specific room or broadcast
    
    Args:
        event_name: The event name the client will listen for
        data: The data to send
        room: The room to send to, or None to broadcast to all
    """
    if room:
        socketio.emit(event_name, data, room=room)
    else:
        socketio.emit(event_name, data)

def emit_follow_update(data):
    """
    Emit a follow update event to all connected clients
    
    Args:
        data: Dictionary containing follower and following counts
    """
    socketio.emit('follower_update', data)