import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'

const start = () => {
  return (
    <View className='flex-1 justify-center items-center bg-white'>
      <Text className='text-2xl font-algreya'>PHQ-9 Test</Text>
      <Text className='text-lg mt-4 font-algreya'>This is a questionnaire to assess your mental health.</Text>
      <View className='mt-6'/>
      <Text className='text-2xl font-alegreya'>Take quiz</Text>
      <TouchableOpacity className='bg-blue-500 p-4 rounded-lg mt-4'>
        <Image></Image> 
      </TouchableOpacity>
    </View>
  )
}

export default start