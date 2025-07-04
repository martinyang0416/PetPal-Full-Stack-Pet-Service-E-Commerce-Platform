import { useState, useEffect, useCallback, useRef } from 'react';
import { VetServiceContext } from '../states/VetServiceContext';
import axios from 'axios';

// Hook for managing vet service state
export const useVetService = (serviceId = null, initialData = null) => {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(!!serviceId);
  const [error, setError] = useState(null);
  
  // Use ref to prevent infinite loops with reload operations
  const isLoadingRef = useRef(false);
  const updatingRef = useRef(false);
  
  // Add a timeout to automatically release locks to prevent deadlocks
  const resetLock = useCallback(() => {
    if (updatingRef.current) {
      console.log('Automatically releasing update lock after timeout');
      updatingRef.current = false;
    }
  }, []);

  // Load service data from API
  const loadService = useCallback(async () => {
    if (!serviceId || isLoadingRef.current) return;
    
    try {
      console.log('Loading service data for ID:', serviceId);
      setLoading(true);
      isLoadingRef.current = true;
      setError(null);
      
      const response = await axios.get(`/api/vet-services/${serviceId}`);
      console.log('API response:', response.data);
      
      // Check if data exists
      if (!response.data || !response.data._id) {
        console.error('Invalid service data returned from API');
        setError('Service not found or has been deleted');
        return;
      }
      
      const serviceContext = VetServiceContext.fromApiResponse(response.data);
      setService(serviceContext);
    } catch (err) {
      console.error("Error loading service:", err);
      setError("Failed to load service details. Please try again.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [serviceId]);

  // Initialize service on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initService = async () => {
      if (initialData && isMounted) {
        setService(VetServiceContext.fromApiResponse(initialData));
      } else if (serviceId && !updatingRef.current && isMounted) {
        await loadService();
      }
    };
    
    initService();
    
    // Safety mechanism to prevent permanent locks
    const lockTimer = setTimeout(resetLock, 5000);
    
    return () => {
      isMounted = false;
      clearTimeout(lockTimer);
    };
  }, [serviceId, initialData, loadService, resetLock]);

  // Handle service state transitions
  const handleTransition = useCallback(async (actionMethod) => {
    if (!service) {
      console.error('Cannot perform action, service is null');
      return { success: false, error: "No service loaded" };
    }
    
    // Check if there's an update in progress, but allow if it's been too long
    if (updatingRef.current) {
      console.log('Another update is in progress, checking lock...');
      // Force reset if necessary to prevent deadlock
      resetLock();
      
      // If still locked, return error
      if (updatingRef.current) {
        return { success: false, error: "Another update in progress" };
      }
    }
    
    updatingRef.current = true;
    try {
      console.log(`Performing action: ${actionMethod}`);
      const result = await service[actionMethod]();
      console.log(`Action result:`, result);
      
      // Force update to re-render component
      setService(prevService => {
        if (!prevService) return null;
        return { ...prevService };
      });
      
      return result;
    } catch (err) {
      console.error(`Error in ${actionMethod}:`, err);
      return { 
        success: false, 
        error: err.message || `Failed to execute ${actionMethod}` 
      };
    } finally {
      // Release the lock
      updatingRef.current = false;
    }
  }, [service, resetLock]);

  // Define action handlers
  const confirmService = useCallback(() => handleTransition('confirm'), [handleTransition]);
  const startService = useCallback(() => handleTransition('startService'), [handleTransition]);
  const completeService = useCallback(async () => {
    // First check if locked and try to release if needed
    if (updatingRef.current) {
      resetLock();
      if (updatingRef.current) {
        return { success: false, error: "Another update in progress" };
      }
    }
    
    try {
      updatingRef.current = true;
      
      // First start the service if needed
      if (service && service.getStateInfo().name === 'Confirmed') {
        console.log('Service is in Confirmed state, starting service first');
        await service.startService();
      }
      
      const result = await handleTransition('completeService');
      
      // After completing, reload the service to ensure state is up-to-date
      if (result && result.success) {
        await loadService();
      }
      return result || { success: false, error: "Failed to complete service" };
    } catch (err) {
      console.error("Error completing service:", err);
      return { success: false, error: err.message || "Failed to complete service" };
    } finally {
      updatingRef.current = false;
    }
  }, [handleTransition, loadService, resetLock, service]);
  
  const cancelService = useCallback(() => handleTransition('cancelService'), [handleTransition]);
  
  // Add note to service
  const addNote = useCallback(async (note) => {
    if (!service) return { success: false, error: "No service loaded" };
    
    // Check for lock and try to reset if needed
    if (updatingRef.current) {
      resetLock();
      if (updatingRef.current) {
        return { success: false, error: "Another update in progress" };
      }
    }
    
    try {
      updatingRef.current = true;
      const result = await service.addNote(note);
      
      // Force update to re-render
      if (result && result.success) {
        setService(prevService => {
          if (!prevService) return null;
          return { ...prevService };
        });
      }
      
      return result;
    } catch (err) {
      console.error("Error adding note:", err);
      return { success: false, error: err.message || "Failed to add note" };
    } finally {
      updatingRef.current = false;
    }
  }, [service, resetLock]);

  // Get current state info for UI rendering - make it safe from null service
  const stateInfo = service && typeof service.getStateInfo === 'function' 
    ? service.getStateInfo() 
    : {
        name: "Unknown",
        color: "default",
        nextActions: []
      };

  return {
    service,
    serviceData: service && typeof service.getServiceData === 'function' ? service.getServiceData() : {},
    loading,
    error,
    stateInfo,
    confirmService,
    startService,
    completeService,
    cancelService,
    addNote,
    reload: loadService,
    stateHistory: service && typeof service.getStateHistory === 'function' ? service.getStateHistory() : []
  };
}; 