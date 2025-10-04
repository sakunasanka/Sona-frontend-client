import TopBar from '@/components/TopBar'
import { icons } from '@/constants/icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'

const Start = () => {
  const router = useRouter();

  return (
    <View className='flex-1 bg-white'>
      <TopBar title="Well-being Check" />
      
      <ScrollView className='flex-1 px-5 pt-6' showsVerticalScrollIndicator={false}>
        {/* Header with better spacing and hierarchy */}
        <View className='items-center mb-8'>
          <View className='bg-primary/10 rounded-full p-5 mb-5 border border-primary/20'>
            <Image source={icons.quiz} className='w-16 h-16' resizeMode='contain' />
          </View>
          <Text className='text-3xl font-alegreya font-bold text-gray-800 text-center'>Well-being Check</Text>
          <Text className='text-lg mt-2 text-primary font-alegreya font-bold'>PHQ-9 Assessment</Text>
        </View>

        {/* Info card with better visual hierarchy */}
        <View className='bg-white rounded-2xl p-6 border border-gray-100 mb-6 shadow-sm'>
          <Text className='text-lg font-alegreya font-bold text-gray-800 mb-4'>
            📋 What to expect
          </Text>
          <Text className='text-base text-gray-700 font-alegreya leading-6 mb-5'>
            This brief, research-validated questionnaire helps screen for symptoms of depression over the last 2 weeks.
          </Text>
          
          <View className='flex-row items-center mb-3'>
            <View className='w-2 h-2 bg-primary rounded-full mr-3' />
            <Text className='text-sm text-gray-600 font-alegreya font-medium flex-1'>9 quick questions + 1 impact question</Text>
          </View>
          <View className='flex-row items-center mb-3'>
            <View className='w-2 h-2 bg-primary rounded-full mr-3' />
            <Text className='text-sm text-gray-600 font-alegreya font-medium flex-1'>Takes approximately 2 minutes</Text>
          </View>
          <View className='flex-row items-center'>
            <View className='w-2 h-2 bg-primary rounded-full mr-3' />
            <Text className='text-sm text-gray-600 font-alegreya font-medium flex-1'>Completely confidential</Text>
          </View>
        </View>

        {/* Privacy and disclaimer */}
        <View className='bg-amber-50 rounded-2xl p-5 border-l-4 border-amber-400 mb-8'>
          <Text className='text-sm font-alegreya font-bold text-amber-800 mb-2'>⚠️ Important Notice</Text>
          <Text className='text-sm text-amber-700 font-alegreya leading-6'>
            This is a screening tool, not a diagnosis. If you are in crisis or considering self-harm, please seek immediate help from a mental health professional or crisis hotline.
          </Text>
        </View>

        {/* Start button with better design */}
        <TouchableOpacity
          className='bg-primary py-5 rounded-2xl mb-6 shadow-lg border-2 border-primary'
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/(hidden)/question/take' as any })}
        >
          <Text className='text-white text-center text-lg font-alegreya font-bold'>Begin Assessment</Text>
          <Text className='text-white/80 text-center text-sm font-alegreya mt-1 font-medium'>~ 2 minutes</Text>
        </TouchableOpacity>

        {/* Source attribution */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <Text className='text-xs text-gray-500 text-center font-alegreya font-medium leading-5'>
            Based on: Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Start