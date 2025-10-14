import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

type Props = {
  displayName?: string;
  url: string | '';
  jwtToken: string;
  userRole?: 'moderator' | 'guest' | 'client';
  onEvent?: (event: any) => void;
};

export default function JitsiWebView({
  displayName = 'Guest',
  url,
  jwtToken,
  userRole = 'client',
  onEvent
}: Props) {
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetched session link:', url);
        setMeetingUrl(url);
      } catch (error) {
        console.error('Error fetching session link:', error);
        setError('Failed to load meeting. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, []);

  const handleMessage = useCallback(
    (e: any) => {
      try {
        const payload = JSON.parse(e.nativeEvent.data);
        console.log('Jitsi WebView message:', payload);
        onEvent?.(payload);
      } catch (err) {
        console.warn('Failed to parse webview message', err);
        onEvent?.({ event: 'parseError', data: err });
      }
    },
    [onEvent]
  );

  const handleError = useCallback((evt: any) => {
    console.error('WebView onError', evt.nativeEvent);
    setError('Failed to load meeting. Please check your connection.');
    onEvent?.({ event: 'webviewError', data: evt.nativeEvent });
  }, [onEvent]);

  const handleHttpError = useCallback((evt: any) => {
    console.error('WebView httpError', evt.nativeEvent);
    setError('Network error. Please try again.');
    onEvent?.({ event: 'webviewHttpError', data: evt.nativeEvent });
  }, [onEvent]);

  const handleNavState = useCallback((nav: WebViewNavigation) => {
    console.log('WebView nav:', { url: nav.url, loading: nav.loading });
    onEvent?.({ event: 'nav', data: nav });
  }, [onEvent]);

  const handleShouldStartLoad = useCallback((request: any) => {
    const url: string = request?.url || '';
    console.log('ShouldStartLoadWithRequest:', url);

    if (!url) return false;

    const lower = url.toLowerCase();

    // Allow about:blank
    if (lower.startsWith('about:')) {
      return true;
    }

    // Allow http(s)
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return true;
    }

    // Block Jitsi native app schemes
    if (lower.startsWith('org.jitsi.meet:') || lower.startsWith('jitsi-meet:') || lower.startsWith('intent:')) {
      console.log('Blocked native app scheme from WebView:', url);
      onEvent?.({ event: 'blockedScheme', data: url });
      return false;
    }

    // Try to open other schemes externally
    (async () => {
      try {
        const can = await Linking.canOpenURL(url);
        if (can) {
          await Linking.openURL(url);
        } else {
          console.warn('Cannot open external URL from WebView (no app):', url);
        }
      } catch (e) {
        console.warn('Failed to open external URL from WebView:', e, url);
      }
    })();

    return false;
  }, [onEvent]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    const fetchUrl = async () => {
      try {
        console.log('Fetched session link:', url);
        setMeetingUrl(url);
      } catch (error) {
        console.error('Error fetching session link:', error);
        setError('Failed to load meeting. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUrl();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading meeting...</Text>
      </View>
    );
  }

  // Show error state with retry
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity 
          onPress={handleRetry}
          style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show WebView only when we have a valid URL
  if (!url) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No meeting URL available</Text>
      </View>
    );
  }

  console.log('Loading meeting URL:', url);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: url }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        allowsFullscreenVideo={true}
        allowsProtectedMedia={true}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleHttpError}
        onNavigationStateChange={handleNavState}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" style={{ flex: 1 }} />}
        style={{ flex: 1 }}
      />
    </View>
  );
}