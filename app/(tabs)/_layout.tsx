import { Tabs } from 'expo-router';
import { Home, MessageCircle, Newspaper, PersonStanding, Stethoscope } from 'lucide-react-native';
import MoodManager from '../../components/MoodManager';
import QuestionnaireManager from '../../components/QuestionnaireManager';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

export default function TabsLayout() {
  // Initialize session timeout tracking
  useSessionTimeout();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#EF5DA8',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'home',
            tabBarIcon: ({ color }) => <Home color={color} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color }) => <Newspaper color={color} />,
          }}
        />
        <Tabs.Screen
          name="counsellor"
          options={{
            title: 'Counsellor',
            tabBarIcon: ({ color }) => <PersonStanding color={color} />,
          }}
        />
        <Tabs.Screen
          name="psychiatrist"
          options={{
            title: 'Psychiatrist',
            tabBarIcon: ({ color }) => <Stethoscope color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <MessageCircle color={color} />,
          }}
        />
      </Tabs>
      <MoodManager />
      <QuestionnaireManager />
    </>
  );
}
