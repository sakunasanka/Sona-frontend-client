import { View, Text } from 'react-native'
import React from 'react'
import BreathingAnimation from './meditationAnimation'

const meditation = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <BreathingAnimation/>
    </View>
  )
}

export default meditation