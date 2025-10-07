import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import JitsiWebView from './videoCall';

export default function VideoCallPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const roomName = (params.roomName as string) || `room-${Date.now()}`;
  const displayName = (params.displayName as string) || 'Guest';
  const jitsiDomain = (params.jitsiDomain as string) || 'sona.org.lk';
  const userRole = (params.userRole as 'moderator' | 'client' | 'guest') || 'client';

  const [ready, setReady] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [userConfirmedPermissions, setUserConfirmedPermissions] = useState(false);

  useEffect(() => {
    // DON'T automatically request permissions - let user do it manually
    console.log('🔍 Component loaded - waiting for manual permission grant');
    setPermissionStatus('waiting-for-user-action');
    
    // Optional: Check if permissions are already granted from previous session
    (async () => {
      try {
        const camStatus = await Camera.getCameraPermissionsAsync();
        const micStatus = await Audio.getPermissionsAsync();
        
        console.log('📷 Existing Camera permission:', camStatus.status);
        console.log('🎤 Existing Microphone permission:', micStatus.status);
        
        if (camStatus.status === 'granted' && micStatus.status === 'granted') {
          console.log('✅ Permissions already granted from previous session');
          setPermissionStatus('already-granted');
          // Still require user confirmation before loading WebView
          Alert.alert(
            'Permissions Detected',
            'Camera and microphone permissions are already granted. Proceed to video call?',
            [
              { text: 'Yes, Join Call', onPress: () => {
                setUserConfirmedPermissions(true);
                setReady(true);
              }},
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } else {
          setPermissionStatus(`missing-permissions - Camera: ${camStatus.status}, Mic: ${micStatus.status}`);
        }
      } catch (err) {
        console.error('❌ Permission check error', err);
        setPermissionStatus(`error: ${err}`);
      }
    })();
  }, []);

  const requestPermissionsManually = async () => {
    console.log('🔄 Manual permission request...');
    setPermissionStatus('manual-requesting');
    
    try {
      // First check current permissions
      const currentCamStatus = await Camera.getCameraPermissionsAsync();
      const currentMicStatus = await Audio.getPermissionsAsync();
      
      console.log('📷 Current Camera permission:', currentCamStatus.status);
      console.log('🎤 Current Microphone permission:', currentMicStatus.status);
      
      // Request permissions
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Audio.requestPermissionsAsync();
      
      console.log('📷 Requested Camera permission:', camStatus);
      console.log('🎤 Requested Microphone permission:', micStatus);
      
      if (camStatus === 'granted' && micStatus === 'granted') {
        console.log('✅ Manual permissions granted!');
        setPermissionStatus('granted');
        setUserConfirmedPermissions(true);
        setReady(true);
      } else {
        setPermissionStatus(`manual-denied - Camera: ${camStatus}, Mic: ${micStatus}`);
        Alert.alert(
          'Permissions Denied',
          `Camera: ${camStatus}\nMicrophone: ${micStatus}\n\n⚠️ To join the video call, please:\n\n1. Go to Device Settings\n2. Find this app\n3. Enable Camera and Microphone permissions\n4. Return and try again`,
          [
            { text: 'Go to Settings', onPress: () => {
              // On iOS/Android, this might open app settings
              console.log('User requested to go to settings');
            }},
            { text: 'Try Again', onPress: () => requestPermissionsManually() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (err) {
      console.error('❌ Manual permission error:', err);
      setPermissionStatus(`manual-error: ${err}`);
      Alert.alert('Error', `Permission check failed: ${err}`);
    }
  };

  // TRIPLE CHECK: Absolutely prevent WebView from loading
  if (!ready || !userConfirmedPermissions) {
    console.log('🚫 Blocking WebView - ready:', ready, 'userConfirmed:', userConfirmedPermissions);
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#f5f5f5' 
      }}>
        <Text style={{ 
          marginBottom: 20, 
          textAlign: 'center', 
          fontSize: 18,
          fontWeight: '700',
          color: '#333'
        }}>
          🎥 Video Call Permissions
        </Text>
        
        <Text style={{ 
          marginBottom: 15, 
          textAlign: 'center', 
          fontSize: 14,
          color: '#666',
          lineHeight: 20
        }}>
          Camera and microphone access is required to join the video meeting.
        </Text>
        
        <Text style={{ 
          marginBottom: 20, 
          textAlign: 'center', 
          fontSize: 12,
          color: '#999',
          fontStyle: 'italic'
        }}>
          Status: {permissionStatus}
        </Text>
        
        <TouchableOpacity 
          onPress={requestPermissionsManually}
          style={{ 
            backgroundColor: '#007AFF', 
            padding: 18, 
            borderRadius: 12,
            marginTop: 10,
            width: 220,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <Text style={{ 
            color: 'white', 
            textAlign: 'center', 
            fontWeight: '600',
            fontSize: 16
          }}>
            📷 Grant Permissions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ 
            backgroundColor: '#FF3B30', 
            padding: 18, 
            borderRadius: 12,
            marginTop: 15,
            width: 220,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <Text style={{ 
            color: 'white', 
            textAlign: 'center', 
            fontWeight: '600',
            fontSize: 16
          }}>
            ← Go Back
          </Text>
        </TouchableOpacity>
        
        <Text style={{ 
          marginTop: 30, 
          textAlign: 'center', 
          fontSize: 12,
          color: '#999',
          lineHeight: 18
        }}>
          If permission prompts don&apos;t appear,{'\n'}
          check your device settings manually.
        </Text>
      </View>
    );
  }

  // Only render WebView if permissions are explicitly granted
  console.log('🚀 Rendering Jitsi WebView with permissions granted');
  return (
    <View style={{ flex: 1 }}>
      <JitsiWebView
        roomName={roomName}
        displayName={displayName}
        jitsiDomain={jitsiDomain}
        userRole={userRole}
        onEvent={(e) => console.log('📞 Jitsi event:', e)}
      />
    </View>
  );
}