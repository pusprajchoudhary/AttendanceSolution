import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';
import { markAttendance, markCheckout, getTodayAttendance, updateAttendanceLocation } from '../../services/attendanceService';
import { getLatestNotification, markNotificationAsRead } from '../../services/notificationService';
import NotificationButton from '../../components/NotificationButton';
import { startLocationTracking } from '../../services/locationService';
import UserChat from '../../components/chat/UserChat';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser, loading } = useAuth();
  const webcamRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [showCheckoutWarning, setShowCheckoutWarning] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(0);
  const [locationTrackingStopper, setLocationTrackingStopper] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (!user || user.role !== 'user') {
          navigate('/login');
          return;
        }
      }
    };

    checkAuth();
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if attendance is already marked for today
  useEffect(() => {
    const checkTodayAttendance = async () => {
      try {
        console.log('Checking today\'s attendance...');
        const response = await getTodayAttendance();
        console.log('Today\'s attendance response:', response);
        
        // Reset states first
        setIsCheckedIn(false);
        setIsCheckedOut(false);
        setCheckInTime(null);
        setCheckOutTime(null);
        setHoursWorked(0);
        
        if (response && response.length > 0) {
          // Get the latest attendance record
          const todayRecord = response[0];
          console.log('Today\'s record:', todayRecord);
          
          if (todayRecord.status === 'checked-in') {
            console.log('User is currently checked in');
            setIsCheckedIn(true);
            setIsCheckedOut(false);
            if (todayRecord.timestamp) {
              setCheckInTime(new Date(todayRecord.timestamp));
            }
          } else if (todayRecord.status === 'checked-out') {
            console.log('User is checked out');
            setIsCheckedIn(false);
            setIsCheckedOut(true);
            if (todayRecord.timestamp) {
              setCheckInTime(new Date(todayRecord.timestamp));
            }
            if (todayRecord.checkOutTime) {
              setCheckOutTime(new Date(todayRecord.checkOutTime));
            }
          }
          
          setHoursWorked(todayRecord.hoursWorked || 0);
          
          console.log('Set attendance states:', {
            isCheckedIn: todayRecord.status === 'checked-in',
            isCheckedOut: todayRecord.status === 'checked-out',
            checkInTime: todayRecord.timestamp,
            checkOutTime: todayRecord.checkOutTime,
            hoursWorked: todayRecord.hoursWorked
          });
        } else {
          console.log('No attendance record found for today - new user or new day');
        }
      } catch (error) {
        console.error('Error checking today\'s attendance:', error);
        // Reset states on error
        setIsCheckedIn(false);
        setIsCheckedOut(false);
        setCheckInTime(null);
        setCheckOutTime(null);
        setHoursWorked(0);
      }
    };

    checkTodayAttendance();
  }, []);

  // Location tracking
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
            setIsLocationEnabled(true);
            setMessage("Location enabled successfully");
          },
          (error) => {
            console.error('Error getting location:', error);
            setMessage("Failed to access location: " + error.message);
            setIsLocationEnabled(false);
            setUserLocation(null);
          }
        );
      } else {
        setMessage("Geolocation is not supported by your browser");
        setIsLocationEnabled(false);
        setUserLocation(null);
      }
    };

    getLocation();
    const locationInterval = setInterval(getLocation, 30000);

    return () => clearInterval(locationInterval);
  }, [user, navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const formatTimeForDisplay = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleWebcamError = (error) => {
    console.error("Webcam error:", error);
    setMessage("Webcam error: " + error.message);
    setIsCameraEnabled(false);
    setIsWebcamReady(false);
    toast.error("Webcam error: " + error.message);
  };

  const handleWebcamLoad = () => {
    console.log("Webcam loaded successfully");
    setIsWebcamReady(true);
  };

  const enableCamera = async () => {
    try {
      // First check if we already have a stream
      if (webcamRef.current && webcamRef.current.video) {
        setIsCameraEnabled(true);
        setShowCamera(true);
        setMessage("Camera already enabled");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      if (stream) {
        setIsCameraEnabled(true);
        setShowCamera(true);
        setMessage("Camera enabled successfully");
        toast.success("Camera enabled successfully");
        
        // Cleanup function
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setMessage("Failed to access camera: " + err.message);
      setIsCameraEnabled(false);
      setShowCamera(false);
      toast.error("Failed to access camera: " + err.message);
    }
  };

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          setIsLocationEnabled(true);
          setMessage("Location enabled successfully");
        },
        (error) => {
          console.error('Error getting location:', error);
          setMessage("Failed to access location: " + error.message);
          setIsLocationEnabled(false);
          setUserLocation(null);
        }
      );
    } else {
      setMessage("Geolocation is not supported by your browser");
      setIsLocationEnabled(false);
      setUserLocation(null);
    }
  };

  const captureImage = () => {
    if (webcamRef.current && isWebcamReady) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setShowImagePreview(true);
        setMessage("Image captured successfully!");
        toast.success("Image captured successfully!");
      } else {
        setMessage("Failed to capture image");
        toast.error("Failed to capture image");
      }
    } else {
      setMessage("Camera not ready");
      toast.error("Camera not ready");
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      // First ensure camera is enabled
      if (!isCameraEnabled) {
        await enableCamera();
        if (!isCameraEnabled) {
          setMessage("Please enable camera first");
          return;
        }
      }

      // Check if we have a captured image
      if (!capturedImage) {
        setMessage("Please capture your image first");
        return;
      }

      if (!isLocationEnabled) {
        setMessage("Please enable location access");
        return;
      }

      // Get current location
      let currentLocation;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        currentLocation = {
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          address: `${position.coords.latitude}, ${position.coords.longitude}`,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error getting location:', error);
        setMessage("Failed to get location");
        return;
      }

      // Convert base64 to blob
      const base64Response = await fetch(capturedImage);
      const blob = await base64Response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], `attendance_${user._id}_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Create FormData and append all fields
      const formData = new FormData();
      formData.append('image', file);
      formData.append('location[coordinates][latitude]', currentLocation.coordinates.latitude);
      formData.append('location[coordinates][longitude]', currentLocation.coordinates.longitude);
      formData.append('location[address]', currentLocation.address);
      formData.append('location[lastUpdated]', currentLocation.lastUpdated);

      console.log('Submitting attendance with:', {
        hasImage: formData.has('image'),
        hasLocation: formData.has('location[coordinates][latitude]'),
        location: currentLocation
      });

      const response = await markAttendance(formData);
      console.log('Attendance response:', response);
      
      // Update states after successful check-in
      setIsCheckedIn(true);
      setIsCheckedOut(false);
      setCheckInTime(new Date());
      setShowSuccessPopup(true);
      setShowCamera(false);
      setMessage("Attendance marked successfully!");
      toast.success('Attendance marked successfully!');
      // Start periodic location tracking after successful check-in
      const tracker = await startLocationTracking(async (locationData) => {
        try {
          await updateAttendanceLocation(locationData);
          console.log('Location update sent to backend:', locationData);
        } catch (error) {
          console.error('Error sending location update:', error);
        }
      });
      tracker.start();
      setLocationTrackingStopper(() => tracker.stop);

    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      console.log('Starting checkout process...');
      setIsLoading(true);
      setMessage("");

      if (!userLocation) {
        console.log('No user location found');
        setMessage("Please enable location access");
        return;
      }

      // Get current location
      let currentLocation;
      try {
        console.log('Getting current location...');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        currentLocation = {
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          address: `${position.coords.latitude}, ${position.coords.longitude}`,
          lastUpdated: new Date().toISOString()
        };
        console.log('Location obtained:', currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        setMessage("Failed to get location");
        return;
      }

      // Calculate hours worked
      const now = new Date();
      const checkInDate = checkInTime ? new Date(checkInTime) : null;
      
      if (!checkInDate) {
        console.log('No check-in time found');
        setMessage("You need to check in first");
        return;
      }

      const hoursWorked = (now - checkInDate) / (1000 * 60 * 60);
      console.log('Hours worked:', hoursWorked);

      // If less than 9 hours, show warning
      if (hoursWorked < 9) {
        console.log('Less than 9 hours worked, showing warning');
        setShowWarning(true);
        return;
      }

      console.log('Calling markCheckout API with location:', currentLocation);
      const response = await markCheckout(currentLocation);
      console.log('Checkout API response:', response);
      
      // Update states for successful check-out
      setIsCheckedOut(true);
      setCheckOutTime(now);
      setShowSuccessPopup(true);
      setHoursWorked(response.attendance.hoursWorked);
      
      // Show success message
      toast.success('Checkout successful! Good work!');
      
      // Hide success popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage("Failed to mark checkout: " + errorMessage);
      toast.error(errorMessage || 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWarningConfirm = async () => {
    console.log('Handling warning confirmation...');
    setShowWarning(false);
    try {
      setIsLoading(true);
      
      // Get current location
      let currentLocation;
      try {
        console.log('Getting current location for early checkout...');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        currentLocation = {
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          address: `${position.coords.latitude}, ${position.coords.longitude}`,
          lastUpdated: new Date().toISOString()
        };
        console.log('Location obtained for early checkout:', currentLocation);
      } catch (error) {
        console.error('Error getting location for early checkout:', error);
        toast.error("Failed to get location");
        return;
      }

      // First check if we have a valid check-in
      const todayAttendance = await getTodayAttendance();
      console.log('Today\'s attendance before checkout:', todayAttendance);
      
      if (!todayAttendance || todayAttendance.length === 0) {
        toast.error('No check-in record found for today');
        return;
      }

      const todayRecord = todayAttendance[0];
      if (todayRecord.status !== 'checked-in') {
        toast.error('You are already checked out');
        return;
      }

      console.log('Calling markCheckout API for early checkout...');
      const response = await markCheckout(currentLocation);
      console.log('Early checkout API response:', response);
      
      setIsCheckedOut(true);
      setCheckOutTime(new Date());
      setHoursWorked(response.attendance.hoursWorked);
      setShowSuccessPopup(true);
      toast.warning('Early checkout recorded. Please try to complete your full shift next time.');
      
      // Hide success popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (error) {
      console.error('Early checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.details;
      console.error('Error details:', errorDetails);
      toast.error(errorMessage || 'Error checking out');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle manual location send
  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const locationData = {
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      };

      await updateAttendanceLocation(locationData);
      toast.success('Location sent successfully!');
    } catch (error) {
      console.error('Error sending location:', error);
      toast.error('Failed to send location: ' + error.message);
    }
  };

  // Utility to get initials from name
  function getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100" style={{ scrollBehavior: 'smooth' }}>
      {/* Header section */}
      <header className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 bg-white shadow-sm rounded-xl p-3 sm:p-4">
        {/* Left Side - Profile and Username */}
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
            {getInitials(user?.name)}
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-semibold text-gray-800">{user?.name || 'User'}</span>
            <span className="text-xs sm:text-sm text-gray-500">{user?.designation}</span>
          </div>
        </div>

        {/* Center - Company Name */}
        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 whitespace-nowrap text-center">Red Cat Hospitality Pvt Ltd</h1>
        </div>

        {/* Right Side - Status, Notification, and Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs sm:text-sm font-medium ${isCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
              {isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
          {/* Notification Bell */}
          <NotificationButton />
          <button
            onClick={handleSendLocation}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Send My Location
          </button>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Card with Live Time */}
        <div className="bg-red-600 text-white p-4 sm:p-6 rounded-xl shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Welcome back, {user?.name}!</h2>
          <div className="space-y-2">
            <p className="text-base sm:text-lg">{formatDateForDisplay(currentTime)}</p>
            <div className="text-3xl sm:text-4xl font-bold tracking-wider">
              {formatTimeForDisplay(currentTime)}
            </div>
            {isCheckedIn && checkInTime && (
              <p className="text-xs sm:text-sm text-red-200">
                Checked in at {formatTimeForDisplay(checkInTime)}
              </p>
            )}
            {isCheckedOut && checkOutTime && (
              <p className="text-xs sm:text-sm text-red-200">
                Checked out at {formatTimeForDisplay(checkOutTime)}
              </p>
            )}
          </div>
          <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => setShowCamera(true)}
              disabled={isCheckedIn && !isCheckedOut}
              className={`px-3 sm:px-4 py-2 rounded-lg ${
                isCheckedIn && !isCheckedOut
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-white text-red-600 hover:bg-gray-100'
              }`}
            >
              {isCheckedIn && !isCheckedOut ? 'Already Checked In' : 'Mark Attendance'}
            </button>
            <button
              onClick={handleCheckout}
              disabled={!isCheckedIn || isCheckedOut || isLoading}
              className={`px-3 sm:px-4 py-2 rounded-lg ${
                !isCheckedIn || isCheckedOut || isLoading
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-white text-red-600 hover:bg-gray-100'
              }`}
            >
              {isLoading ? 'Processing...' : isCheckedOut ? 'Checked Out' : 'Check Out'}
            </button>
          </div>
        </div>

        {/* Camera and Location Component */}
        {showCamera && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold">
                  {isCheckedOut ? 'Mark New Attendance' : 'Mark Your Attendance'}
                </h3>
                <button
                  onClick={() => {
                    setShowCamera(false);
                    setCapturedImage(null);
                    setShowImagePreview(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Camera</h4>
                  {isCameraEnabled ? (
                    <>
                      {!showImagePreview ? (
                        <>
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-48 sm:h-64 rounded-lg"
                            onUserMedia={handleWebcamLoad}
                            onUserMediaError={handleWebcamError}
                            videoConstraints={{
                              width: { ideal: 1280 },
                              height: { ideal: 720 },
                              facingMode: "user"
                            }}
                            forceScreenshotSourceSize={true}
                            minScreenshotWidth={1280}
                            minScreenshotHeight={720}
                          />
                          <button
                            onClick={captureImage}
                            disabled={!isWebcamReady}
                            className={`w-full mt-2 py-2 rounded-lg ${
                              !isWebcamReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            } text-white`}
                          >
                            {!isWebcamReady ? 'Initializing Camera...' : 'Capture Image'}
                          </button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <img 
                            src={capturedImage} 
                            alt="Captured" 
                            className="w-full h-48 sm:h-64 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setShowImagePreview(false);
                              setCapturedImage(null);
                            }}
                            className="w-full py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                          >
                            Retake Image
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                      Camera is disabled
                    </div>
                  )}
                  <button
                    onClick={enableCamera}
                    disabled={isCameraEnabled}
                    className={`w-full mt-2 py-2 rounded-lg ${
                      isCameraEnabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isCameraEnabled ? 'Camera Enabled' : 'Enable Camera'}
                  </button>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Location & Time</h4>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
                    {isLocationEnabled ? (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600">{userLocation}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDateForDisplay(currentTime)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatTimeForDisplay(currentTime)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600">Location is disabled</p>
                    )}
                  </div>
                  <button
                    onClick={enableLocation}
                    disabled={isLocationEnabled}
                    className={`w-full mt-2 py-2 rounded-lg ${
                      isLocationEnabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isLocationEnabled ? 'Location Enabled' : 'Enable Location'}
                  </button>
                  {/* Manual Send Location Button */}
                  <button
                    onClick={handleSendLocation}
                    className="w-full mt-2 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Send My Location
                  </button>
                </div>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={isLoading || !capturedImage || !isLocationEnabled}
                className={`w-full py-2 sm:py-3 rounded-lg text-white font-medium ${
                  isLoading || !capturedImage || !isLocationEnabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? 'Marking Attendance...' : 'Mark Attendance'}
              </button>

              {message && (
                <p className={`text-xs sm:text-sm ${
                  message.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Add Chat Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Chat with Admin</h2>
          <UserChat />
        </div>
      </div>

      {/* Checkout Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-8 shadow-xl z-10 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Warning: Early Checkout</h3>
              <p className="text-sm text-gray-500 mb-4">
                You haven't completed your 9-hour shift yet. Are you sure you want to check out early?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleWarningConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Yes, Check Out
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-8 shadow-xl z-10 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isCheckedOut ? 'Checkout Successful!' : 'Attendance Marked Successfully!'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {isCheckedOut 
                  ? `Checked out at ${checkOutTime ? formatTimeForDisplay(checkOutTime) : ''}`
                  : `Checked in at ${checkInTime ? formatTimeForDisplay(checkInTime) : ''}`
                }
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard; 