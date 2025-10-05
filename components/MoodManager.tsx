import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { hasSubmittedTodaysMood } from '../api/mood';
import MoodPopup from '../components/MoodPopup';

export default function MoodManager() {
  const [showMoodPopup, setShowMoodPopup] = useState(false);

  useEffect(() => {
    const checkMoodStatus = async () => {
      try {
        // Check if user has already submitted today's mood
        const hasSubmitted = await hasSubmittedTodaysMood();

        if (!hasSubmitted) {
          // Show mood popup after a short delay to avoid showing immediately on app launch
          setTimeout(() => {
            setShowMoodPopup(true);
          }, 2000); // 2 second delay
        }
      } catch (error) {
        console.error('Error checking mood status:', error);
        // On error, don't show popup to avoid annoying users
      }
    };

    // Check mood status every time the app opens
    checkMoodStatus();
  }, []);

  const handleMoodSubmitted = () => {
    // Mood was submitted, hide popup and refresh home page
    setShowMoodPopup(false);
    // Navigate to home to trigger refresh
    router.replace('/');
  };

  const handleClosePopup = () => {
    // User skipped, hide popup
    setShowMoodPopup(false);
  };

  return (
    <MoodPopup
      visible={showMoodPopup}
      onClose={handleClosePopup}
      onMoodSubmitted={handleMoodSubmitted}
    />
  );
}