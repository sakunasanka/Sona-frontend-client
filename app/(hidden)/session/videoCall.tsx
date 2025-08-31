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
  const [useFallbackUrl, setUseFallbackUrl] = useState<string | null>(null);

  // sanitize domain: remove protocol and trailing slash
  const domainHost = useMemo(
    () => (jitsiDomain || 'sona.org.lk').replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim(),
    [jitsiDomain]
  );

  const safeRoom = (roomName || `room-${Date.now()}`).replace(/'/g, "\\'");
  const safeName = (displayName || 'Guest').replace(/'/g, "\\'");
  const jwtSnippet = jwtToken ? `options.jwt='${jwtToken}';` : '';

  const html = useMemo(() => {
    // Determine the role for Jitsi API
    const jitsiRole = userRole === 'moderator' ? 'moderator' : 'guest';
    
    return `
    <!doctype html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <style>html,body,#jitsi{height:100%;margin:0;background:#000}</style>
    </head>
    <body>
      <div id="jitsi" style="width:100%;height:100%"></div>
      <script>
        // helper to post messages back to React Native
        function post(obj){ 
          try{ 
            window.ReactNativeWebView.postMessage(JSON.stringify(obj)); 
          } catch(e) {
            console.error('Failed to post message:', e);
          } 
        }

        // Request media permissions first before loading Jitsi
        async function ensureMediaPermissions() {
          try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              post({ event: 'mediaUnsupported', data: 'navigator.mediaDevices not available' });
              return false;
            }
            
            // Request both audio and video permissions
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: true, 
              video: true 
            });
            
            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop());
            
            post({ event: 'mediaGranted', data: 'Camera and microphone permissions granted' });
            return true;
          } catch (err) {
            post({ 
              event: 'mediaError', 
              data: {
                name: err.name,
                message: err.message,
                constraint: err.constraint
              }
            });
            return false;
          }
        }

        // Initialize Jitsi after ensuring media permissions
        async function initializeJitsi() {
          // First ensure we have media permissions
          const hasPermissions = await ensureMediaPermissions();
          if (!hasPermissions) {
            post({ event: 'initError', data: 'Media permissions not granted' });
            return;
          }

          // Load external_api.js
          var script = document.createElement('script');
          script.src = 'https://${domainHost}/external_api.js';
          script.async = true;
          
          script.onload = function(){
            try {
              var options = {
                roomName: '${safeRoom}',
                parentNode: document.getElementById('jitsi'),
                userInfo: { 
                  displayName: '${safeName}',
                  role: '${jitsiRole}'  // Dynamic role based on userRole prop
                },
                configOverwrite: {
                  startWithAudioMuted: false,
                  startWithVideoMuted: false,
                  prejoinPageEnabled: false,
                  // Conditional moderator features
                  disableModeratorIndicator: ${userRole !== 'moderator'},
                  enableClosePage: ${userRole === 'moderator'}
                },
                interfaceConfigOverwrite: {
                  MOBILE_APP_PROMO: false,
                  SHOW_JITSI_WATERMARK: false,
                  // Show different toolbar based on role
                  TOOLBAR_BUTTONS: ${userRole === 'moderator' ? `[
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'recording',
                    'settings', 'videoquality', 'filmstrip', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'mute-video-everyone', 'security'
                  ]` : `[
                    'microphone', 'camera', 'closedcaptions', 'fullscreen',
                    'fodeviceselection', 'hangup', 'settings', 'videoquality', 
                    'filmstrip', 'tileview', 'videobackgroundblur'
                  ]`}
                }
              };
              ${jwtSnippet}
              
              var api = new JitsiMeetExternalAPI('${domainHost}', options);
              
              function forward(n,d){ post({ event:n, data:d||null }); }
              
              // Event listeners
              api.addEventListener('videoConferenceJoined', function(){ forward('joined'); });
              api.addEventListener('videoConferenceLeft', function(){ forward('left'); });
              api.addEventListener('participantJoined', function(p){ forward('participantJoined', p); });
              api.addEventListener('participantLeft', function(p){ forward('participantLeft', p); });
              api.addEventListener('readyToClose', function(){ forward('readyToClose'); });
              
              post({ event: 'jitsiInitialized', data: 'Jitsi API initialized successfully' });
            } catch(err) {
              post({ event: 'initError', data: (err && err.message) ? err.message : String(err) });
            }
          };
          
          script.onerror = function(e){
            post({ event: 'scriptError', data: 'failed to load external_api.js from ${domainHost}' });
          };
          
          document.head.appendChild(script);
        }

        // Handle console errors
        window.addEventListener('error', function(e){ 
          post({ event:'consoleError', data: e && e.message }); 
        });

        // Start initialization when page loads
        window.addEventListener('DOMContentLoaded', initializeJitsi);
        
        // Fallback if DOMContentLoaded already fired
        if (document.readyState === 'loading') {
          // DOMContentLoaded hasn't fired yet
        } else {
          // DOMContentLoaded has already fired
          initializeJitsi();
        }
      </script>
    </body>
    </html>
    `;
  }, [domainHost, safeRoom, safeName, jwtSnippet, userRole]);

  // Construct fallback URL with role parameter
  const fallbackUrl = useMemo(() => {
    const roleParam = userRole === 'moderator' ? 'moderator' : 'guest';
    return `https://${domainHost}/${safeRoom}?role=${roleParam}`;
  }, [domainHost, safeRoom, userRole]);

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
        source={useFallbackUrl ? { uri: useFallbackUrl } : { html }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        allowsFullscreenVideo={true}
        allowsProtectedMedia={false}
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