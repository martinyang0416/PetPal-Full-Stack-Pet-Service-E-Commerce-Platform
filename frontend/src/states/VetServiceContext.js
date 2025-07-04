import { 
  VetServiceState, 
  PendingState, 
  ConfirmedState, 
  InProgressState, 
  CompletedState, 
  CancelledState 
} from './VetServiceState';
import axios from 'axios';

export class VetServiceContext {
  constructor(serviceData = {}) {
    this.serviceData = serviceData;
    
    // Initialize state based on status field from the data
    this.initializeState();
    
    // Keep track of state history for auditing/tracking
    this.stateHistory = [{
      state: this.state.constructor.name,
      timestamp: new Date(),
      data: { ...serviceData }
    }];
  }
  
  // Initialize state based on the service data
  initializeState() {
    const status = this.serviceData.status || 'pending';
    
    switch(status.toLowerCase()) {
      case 'confirmed':
        this.state = new ConfirmedState(this);
        break;
      case 'in_progress':
      case 'inprogress':
      case 'in progress':
        this.state = new InProgressState(this);
        break;
      case 'completed':
        this.state = new CompletedState(this);
        break;
      case 'cancelled':
      case 'canceled':
        this.state = new CancelledState(this);
        break;
      case 'pending':
      default:
        this.state = new PendingState(this);
        break;
    }
  }
  
  // Method to transition to a new state
  transitionTo(newState) {
    console.log(`Transitioning from ${this.state.constructor.name} to ${newState.constructor.name}`);
    this.state = newState;
    
    // Add to state history
    this.stateHistory.push({
      state: this.state.constructor.name,
      timestamp: new Date(),
      data: { ...this.serviceData }
    });
    
    // Update status in service data
    this.serviceData.status = this.getStatusFromState();
    
    // Optionally update in backend
    this.syncWithBackend();
  }
  
  // Convert state class to status string for the API
  getStatusFromState() {
    if (this.state instanceof PendingState) return 'pending';
    if (this.state instanceof ConfirmedState) return 'confirmed';
    if (this.state instanceof InProgressState) return 'in_progress';
    if (this.state instanceof CompletedState) return 'completed';
    if (this.state instanceof CancelledState) return 'cancelled';
    return 'unknown';
  }
  
  // Helper to get the actual ID value from a MongoDB ObjectID or string
  getServiceId() {
    if (!this.serviceData) return null;
    
    // Handle MongoDB ObjectID format: { $oid: "id_string" }
    if (this.serviceData._id && typeof this.serviceData._id === 'object' && this.serviceData._id.$oid) {
      return this.serviceData._id.$oid;
    }
    
    // Handle string ID directly
    if (this.serviceData._id && typeof this.serviceData._id === 'string') {
      return this.serviceData._id;
    }
    
    return null;
  }
  
  // Helper to update the backend when state changes
  async syncWithBackend() {
    // Get the proper ID value
    const serviceId = this.getServiceId();
    
    // Ensure we have a valid ID
    if (!serviceId) {
      console.error('Invalid service ID:', this.serviceData?._id);
      return { success: false, error: 'Invalid service ID' };
    }
    
    try {
      // Update status on backend
      const response = await axios.put(`/api/vet-services/${serviceId}`, {
        status: this.serviceData.status
      });
      
      // Update local data with response
      if (response.data) {
        this.serviceData = { ...this.serviceData, ...response.data };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error syncing service state with backend:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }
  
  // Method to get current state info (for UI rendering)
  getStateInfo() {
    return this.state.getStateInfo();
  }
  
  // Delegate state-specific operations to the current state
  confirm() {
    try {
      return this.state.confirm() || { success: false, error: 'Operation not implemented' };
    } catch (err) {
      console.error('Error in confirm operation:', err);
      return { success: false, error: err.message || 'Failed to confirm service' };
    }
  }
  
  startService() {
    try {
      return this.state.startService() || { success: false, error: 'Operation not implemented' };
    } catch (err) {
      console.error('Error in startService operation:', err);
      return { success: false, error: err.message || 'Failed to start service' };
    }
  }
  
  completeService() {
    try {
      return this.state.completeService() || { success: false, error: 'Operation not implemented' };
    } catch (err) {
      console.error('Error in completeService operation:', err);
      return { success: false, error: err.message || 'Failed to complete service' };
    }
  }
  
  cancelService() {
    try {
      return this.state.cancelService() || { success: false, error: 'Operation not implemented' };
    } catch (err) {
      console.error('Error in cancelService operation:', err);
      return { success: false, error: err.message || 'Failed to cancel service' };
    }
  }
  
  // Add a note to the service
  async addNote(note) {
    // Get the proper ID value
    const serviceId = this.getServiceId();
    
    // Ensure we have a valid ID
    if (!serviceId) {
      console.error('Invalid service ID for adding note:', this.serviceData?._id);
      return { success: false, error: 'Invalid service ID' };
    }
    
    try {
      // Format new note
      const newNote = {
        text: note, 
        timestamp: new Date().toISOString(),
        state: this.state?.constructor?.name || 'Unknown'
      };
      
      // Update backend - send to both vetNotes and medicalNotes fields for consistency
      const response = await axios.put(`/api/vet-services/${serviceId}`, {
        vetNotes: note, // For vet view
        medicalNotes: note // For pet owner view
      });
      
      // Update local data
      this.serviceData.vetNotes = note;
      this.serviceData.medicalNotes = note;
      
      return { success: true, notes: note };
    } catch (error) {
      console.error('Error adding note:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }
  
  // Get service data
  getServiceData() {
    return { ...this.serviceData };
  }
  
  // Get state history
  getStateHistory() {
    return [...this.stateHistory];
  }
  
  // Static factory method to create from API response
  static fromApiResponse(bookingData) {
    return new VetServiceContext(bookingData);
  }
} 