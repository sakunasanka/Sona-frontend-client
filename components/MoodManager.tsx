import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { hasSubmittedTodaysMood } from '../api/mood';

export default function MoodManager() {
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const lastCheckedDate = useRef<string>('');

  const checkMoodStatus = async () => {
    try {
      const currentDate = new Date().toDateString(); // Get current date string

      // Only check if we haven't checked today yet
      if (lastCheckedDate.current !== currentDate) {
        console.log('Checking mood status for new day:', currentDate);
        lastCheckedDate.current = currentDate;

        // Check if user has already submitted today's mood
        const hasSubmitted = await hasSubmittedTodaysMood();

        if (!hasSubmitted) {
          // Show mood popup after a short delay to avoid showing immediately on app launch
          setTimeout(() => {
            setShowMoodPopup(true);
          }, 2000); // 2 second delay
        } else {
          console.log('Mood already submitted today');
        }
      }
    } catch (error) {
      console.error('Error checking mood status:', error);
      // On error, don't show popup to avoid annoying users
    }
  };

  useEffect(() => {
    // Check mood status immediately when component mounts
    checkMoodStatus();

    // Set up an interval to check every 5 minutes
    const interval = setInterval(() => {
      checkMoodStatus();
    }, 5 * 60 * 1000); // 5 minutes

    // Listen for app state changes (when app comes to foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkMoodStatus();
      }
    });

    return () => {
      clearInterval(interval);
      subscription?.remove?.();
    };
  }, []);

  // const handleMoodSubmitted = () => {
  //   // Mood was submitted, hide popup and refresh home page
  //   setShowMoodPopup(false);
  //   // Navigate to home to trigger refresh
  //   router.replace('/');
  // };

  // const handleClosePopup = () => {
  //   // User skipped, hide popup
  //   setShowMoodPopup(false);
  // };

  // return (
  //   <MoodPopup
  //     visible={showMoodPopup}
  //     onClose={handleClosePopup}
  //     onMoodSubmitted={handleMoodSubmitted}
  //   />
  // );
}