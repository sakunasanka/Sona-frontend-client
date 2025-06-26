import { Tabs } from 'expo-router';
import { Home, User, Newspaper, PersonStanding } from 'lucide-react-native';


export default function TabsLayout() {
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
        name="view_profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}