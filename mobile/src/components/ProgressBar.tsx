// src/components/ProgressBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Radius, Typography } from '../constants/theme';

interface ProgressBarProps {
  label: string;
  value: number;         // 0–100
  color?: string;
  icon?: string;
  showValue?: boolean;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  color = Colors.mint,
  icon,
  showValue = true,
  height = 10,
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(100, Math.max(0, value));

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} accessibilityLabel={`${label}: ${clamped}%`}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {icon ? `${icon} ${label}` : label}
        </Text>
        {showValue && (
          <Text style={[styles.value, { color }]}>{clamped}%</Text>
        )}
      </View>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { width: widthInterpolated, backgroundColor: color, height },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
  },
  track: {
    backgroundColor: Colors.border,
    borderRadius: Radius.circle,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.circle,
  },
});
