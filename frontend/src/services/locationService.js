import { toast } from 'react-toastify';

// Reverse geocoding API key (you'll need to get one from a service like OpenCage or Google Maps)
const GEOCODING_API_KEY = import.meta.env.VITE_GEOCODING_API_KEY;

export const getLocationPermission = async () => {
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state === 'denied') {
      toast.error('Location access denied. Please enable location access in your browser settings.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch (error) {
    console.error('Error getting location:', error);
    toast.error('Failed to get location. Please check your location settings.');
    return null;
  }
};

export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${GEOCODING_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted;
    }
    return 'Address not found';
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Error getting address';
  }
};

export const startLocationTracking = async (onLocationUpdate) => {
  const hasPermission = await getLocationPermission();
  if (!hasPermission) {
    toast.error('Location permission is required for attendance tracking');
    return { start: () => {}, stop: () => {} };
  }

  let trackingInterval;
  let isTracking = false;

  const updateLocation = async () => {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();

      // Only track between 6 AM and 10 PM
      if (currentHour < 6 || currentHour >= 22) {
        console.log('Outside tracking hours (6 AM - 10 PM), pausing location updates');
        return;
      }

      const location = await getCurrentLocation();
      if (location) {
        console.log('Location updated at:', new Date().toLocaleTimeString(), {
          latitude: location.latitude,
          longitude: location.longitude
        });

        const address = await getAddressFromCoordinates(location.latitude, location.longitude);
        await onLocationUpdate({
          coordinates: location,
          address,
          lastUpdated: new Date()
        });

        // Log next update time
        const nextUpdate = new Date(Date.now() + 30 * 60 * 1000);
        console.log('Next location update scheduled for:', nextUpdate.toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location. Next retry in 30 minutes.');
    }
  };

  const start = () => {
    if (!isTracking) {
      console.log('Starting location tracking with 30-minute intervals...');
      isTracking = true;
      // Update location every 30 minutes
      trackingInterval = setInterval(updateLocation, 30 * 60 * 1000);
      // Initial update
      updateLocation();
      toast.success('Location tracking started (updates every 30 minutes)');
    }
  };

  const stop = () => {
    if (isTracking) {
      console.log('Stopping location tracking...');
      isTracking = false;
      clearInterval(trackingInterval);
      toast.info('Location tracking stopped');
    }
  };

  return { start, stop };
};

export const stopLocationTracking = () => {
  // This will be called when the component unmounts or when tracking should stop
  clearInterval(trackingInterval);
}; 