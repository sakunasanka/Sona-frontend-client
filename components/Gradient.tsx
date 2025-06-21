import React, { useState } from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps {
  text: string;
  colors: [string, string, ...string[]];
  style?: TextStyle;
  width?: number;
}

const GradientText: React.FC<GradientTextProps> = ({ text, colors, style, width }) => {
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const finalWidth = width ?? measuredWidth;
  return (
    <View
      style={{ flexDirection: 'row' }}
      onLayout={(e) => {
        if (!width && !measuredWidth) {
          setMeasuredWidth(e.nativeEvent.layout.width);
        }
      }}
    >
      {finalWidth ? (
        <MaskedView
          maskElement={<Text style={[style, styles.text]}>{text}</Text>}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: finalWidth,
              height: style?.fontSize || 30,
            }}
          />
        </MaskedView>
      ) : (
        <Text
          style={[style, { opacity: 0, position: 'absolute' }]}
          onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    backgroundColor: 'transparent',
  },
});

export default GradientText;