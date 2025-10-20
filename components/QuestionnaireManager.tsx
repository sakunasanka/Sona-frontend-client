import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { hasCompletedPHQ9ThisPeriod } from '../api/questionnaire';
import QuestionnairePopup from './QuestionnairePopup';

export default function QuestionnaireManager() {
  const [showQuestionnairePopup, setShowQuestionnairePopup] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);

  useEffect(() => {
    const checkQuestionnaireStatus = async () => {
      try {
        // Check if user has already completed questionnaire in the current 2-week period
        const hasCompleted = await hasCompletedPHQ9ThisPeriod();

        if (!hasCompleted && !manualTrigger) {
          // Show questionnaire popup after a short delay to avoid showing immediately on app launch
          setTimeout(() => {
            setShowQuestionnairePopup(true);
          }, 3000); // 3 second delay (after mood popup)
        }
      } catch (error) {
        console.log('Error checking questionnaire status:', error);
        // On error, don't show popup to avoid annoying users
      }
    };

    // Check questionnaire status when the app starts (only if not manually triggered)
    if (!manualTrigger) {
      checkQuestionnaireStatus();
    }
  }, [manualTrigger]);

  // Function to manually trigger the popup
  const triggerPopup = () => {
    setManualTrigger(true);
    setShowQuestionnairePopup(true);
  };

  // Expose the trigger function globally (this is a simple way to allow external triggering)
  useEffect(() => {
    (global as any).triggerQuestionnairePopup = triggerPopup;
  }, []);

  const handleQuestionnaireSubmitted = () => {
    // Questionnaire was submitted, hide popup and refresh home page
    setShowQuestionnairePopup(false);
    setManualTrigger(false);
    // Navigate to home to trigger refresh
    router.replace('/');
  };

  const handleClosePopup = () => {
    // User skipped, hide popup
    setShowQuestionnairePopup(false);
    setManualTrigger(false);
  };

  return (
    <QuestionnairePopup
      visible={showQuestionnairePopup}
      onClose={handleClosePopup}
      onQuestionnaireSubmitted={handleQuestionnaireSubmitted}
    />
  );
}