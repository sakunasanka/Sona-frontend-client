import React from 'react';
import { View, Text, FlatList } from 'react-native';
import TopBar from '../TopBar';
import IconButton from '@/components/Iconbutton';
import { icons }  from '@/constants/icons';
import Homecard from '@/components/HomescreenCard';

const moodData = [
  { icon: icons.happy, text: 'Happy', color: 'bg-buttonPink-500 w-32 h-32' },
  { icon: icons.calm2, text: 'Calm', color: 'bg-buttonBlue-500 w-32 h-32' },
  { icon: icons.focus, text: 'Focused', color: 'bg-buttonGreen-500 w-32 h-32' },
  { icon: icons.relax, text: 'Relaxed', color: 'bg-buttonOrange-500 w-32 h-32' },
]

const HomescreenCard = [
  {
    title: "Counseling Session",
    description: "Let’s open up to the  thing that matters amoung the people",
    backgroundColor: 'bg-pink-100',
    textColor: 'text-pink-500',
    icon: icons.meetup,
    focusIcon: icons.play,
    focusText: "Start Session"
  },
  {
    title: "Daily Tips",
    description: "Aura is the most important thing that matters to you.join us on ",
    backgroundColor: 'bg-orange-100',
    textColor: 'text-orange-500',
    icon: icons.meditation1,
    focusIcon: icons.clock,
    focusText: "View Tips"
  }
]

export default function RegularHome() {
  return (
    <View>
      <TopBar title='Home'/>

      <View className='px-4 pt-4 mt-5'>
        <Text className='text-gray-700 text-4xl font-alegreya'>
          Welcome Back,
          <Text className='font-bold font-alegreya'> Friend</Text>
        </Text>
        <View className='mt-2' />
        <Text className='text-gray-500 text-lg mt-1'>How are you feeling today?</Text>
      </View>
      <View className='px-4 pt-4'>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            data={moodData}
            keyExtractor={(item, index) => `${item.text}-${index}`}
            renderItem={({ item }) => (
              <View className="mr-4">
                <IconButton
                  icon={item.icon}
                  text={item.text}
                  color={item.color}
                />
              </View>
            )}
          />
      </View>
      <Text className='text-gray-700 text-2xl font-alegreya px-4 pt-4 mt-5'>
        Today&apos;s Recommendations
      </Text>
      <View className='px-4 pt-4 h-full'>
        <FlatList
          data={HomescreenCard}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          renderItem={({ item }) => (
            <Homecard
              title={item.title}
              description={item.description}
              backgroundColor={item.backgroundColor}
              textColor={item.textColor}
              icon={item.icon}
              focusText={item.focusText}
              focusIcon={item.focusIcon}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}