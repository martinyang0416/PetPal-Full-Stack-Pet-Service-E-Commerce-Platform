// Base State class
export class VetServiceState {
  constructor(context) {
    this.context = context;
  }

  // State transition methods
  confirm() {
    console.warn("Confirm operation not supported in current state");
    return { success: false, error: "Confirm operation not supported in current state" };
  }

  startService() {
    console.warn("Start service operation not supported in current state");
    return { success: false, error: "Start service operation not supported in current state" };
  }

  completeService() {
    console.warn("Complete service operation not supported in current state");
    return { success: false, error: "Complete service operation not supported in current state" };
  }

  cancelService() {
    console.warn("Cancel operation not supported in current state");
    return { success: false, error: "Cancel operation not supported in current state" };
  }

  // Helper methods
  getStateInfo() {
    return {
      name: "Unknown",
      color: "default",
      nextActions: []
    };
  }
}

// Concrete States
export class PendingState extends VetServiceState {
  confirm() {
    this.context.transitionTo(new ConfirmedState(this.context));
    return { success: true, message: "Booking confirmed successfully" };
  }

  cancelService() {
    this.context.transitionTo(new CancelledState(this.context));
    return { success: true, message: "Booking cancelled" };
  }

  getStateInfo() {
    return {
      name: "Pending",
      color: "warning",
      nextActions: [
        { name: "Confirm", method: "confirm", color: "primary" },
        { name: "Cancel", method: "cancelService", color: "error" }
      ]
    };
  }
}

export class ConfirmedState extends VetServiceState {
  startService() {
    this.context.transitionTo(new InProgressState(this.context));
    return { success: true, message: "Service started" };
  }

  cancelService() {
    this.context.transitionTo(new CancelledState(this.context));
    return { success: true, message: "Booking cancelled" };
  }

  getStateInfo() {
    return {
      name: "Confirmed",
      color: "info",
      nextActions: [
        { name: "Start Service", method: "startService", color: "primary" },
        { name: "Cancel", method: "cancelService", color: "error" }
      ]
    };
  }
}

export class InProgressState extends VetServiceState {
  completeService() {
    this.context.transitionTo(new CompletedState(this.context));
    return { success: true, message: "Service completed" };
  }

  getStateInfo() {
    return {
      name: "In Progress",
      color: "primary",
      nextActions: [
        { name: "Complete", method: "completeService", color: "success" }
      ]
    };
  }
}

export class CompletedState extends VetServiceState {
  getStateInfo() {
    return {
      name: "Completed",
      color: "success",
      nextActions: []
    };
  }
}

export class CancelledState extends VetServiceState {
  getStateInfo() {
    return {
      name: "Cancelled",
      color: "error",
      nextActions: []
    };
  }
} 