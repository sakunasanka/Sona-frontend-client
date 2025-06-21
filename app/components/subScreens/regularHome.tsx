import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TopBar from '../TopBar';

export default function RegularHome() {
  return (
    <>
    <TopBar title='home' />
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome back, friend 🧘</Text>
      {/* Add mood slider, daily tasks, etc. */}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '500' },
});