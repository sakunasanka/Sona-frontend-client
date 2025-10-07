import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

type Props = {
  roomName: string;
  displayName?: string;
  jitsiDomain?: string;
  jwtToken?: string;
  userRole?: 'moderator' | 'guest' | 'client'; // Add role prop
  onEvent?: (event: any) => void;
};

export default function JitsiWebView({
  roomName,
  displayName = 'Guest',
  jitsiDomain = 'sona.org.lk',
  jwtToken,
  userRole = 'client', // Default to client/guest role
  onEvent
}: Props) {
  // For now, let's use direct URL instead of HTML to bypass prejoin
  const [useFallbackUrl, setUseFallbackUrl] = useState<string | null>('DIRECT_URL');

  // sanitize domain: remove protocol and trailing slash
  const domainHost = useMemo(
    () => (jitsiDomain || 'sona.org.lk').replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim(),
    [jitsiDomain]
  );

  const safeRoom = (roomName || `room-${Date.now()}`).replace(/'/g, "\\'");
  const safeName = (displayName || 'Guest').replace(/'/g, "\\'");

  // Construct fallback URL with browser join parameter - USE THIS AS PRIMARY URL
  const fallbackUrl = useMemo(() => {
    const roleParam = userRole === 'moderator' ? 'moderator' : 'guest';
    const params = new URLSearchParams({
      // Force browser join and bypass prejoin
      'config.prejoinPageEnabled': 'false',
      'config.welcomePage.disabled': 'true',
      'config.startWithAudioMuted': 'false',
      'config.startWithVideoMuted': 'false',
      'config.requireDisplayName': 'false',
      'interfaceConfig.MOBILE_APP_PROMO': 'false',
      'interfaceConfig.SHOW_JITSI_WATERMARK': 'false'
    });
    
    if (jwtToken) {
      params.append('jwt', jwtToken);
    }
    
    return `https://${domainHost}/${safeRoom}?${params.toString()}#userInfo.displayName="${encodeURIComponent(displayName)}"&userInfo.role="${roleParam}"`;
  }, [domainHost, safeRoom, userRole, jwtToken, displayName]);

  const handleMessage = useCallback(
    (e: any) => {
      try {
        const payload = JSON.parse(e.nativeEvent.data);
        console.log('Jitsi WebView message:', payload);
        if (payload?.event === 'scriptError' || payload?.event === 'initError') {
          // switch to direct Jitsi URL so user sees the meeting UI
          setUseFallbackUrl(fallbackUrl);
        }
        onEvent?.(payload);
      } catch (err) {
        console.warn('Failed to parse webview message', err);
        onEvent?.({ event: 'parseError', data: err });
      }
    },
    [fallbackUrl, onEvent]
  );

  const handleError = useCallback((evt: any) => {
    console.error('WebView onError', evt.nativeEvent);
    // attempt fallback on serious errors
    setUseFallbackUrl(fallbackUrl);
    onEvent?.({ event: 'webviewError', data: evt.nativeEvent });
  }, [fallbackUrl, onEvent]);

  const handleHttpError = useCallback((evt: any) => {
    console.error('WebView httpError', evt.nativeEvent);
    // attempt fallback on HTTP errors
    setUseFallbackUrl(fallbackUrl);
    onEvent?.({ event: 'webviewHttpError', data: evt.nativeEvent });
  }, [fallbackUrl, onEvent]);

  const handleNavState = useCallback((nav: WebViewNavigation) => {
    console.log('WebView nav:', { url: nav.url, loading: nav.loading });
    onEvent?.({ event: 'nav', data: nav });
  }, [onEvent]);

  const handleShouldStartLoad = useCallback((request: any) => {
  const url: string = request?.url || '';
  console.log('ShouldStartLoadWithRequest:', url);

  if (!url) return false;

  const lower = url.toLowerCase();

  // Allow the initial about:blank (needed when using source: { html })
  if (lower.startsWith('about:')) {
    return true;
  }

  // Allow http(s) to be loaded inside the WebView
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return true;
  }

  // For any other scheme (tel:, mailto:, intent:, jitsi-meet:, etc.)
  // try to open externally using Linking and prevent the WebView from loading them
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
}, []);

  // debug logs
  console.log('Jitsi domainHost:', domainHost);
  console.log('Using fallback?', useFallbackUrl, 'fallbackUrl:', fallbackUrl);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: fallbackUrl }} // Use direct URL instead of HTML
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlaybook={true}
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