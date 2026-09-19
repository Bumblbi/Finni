// src/components/FloatingBadge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Typography } from '../constants/theme';

interface FloatingBadgeProps {
  emoji: string;
  label: string;
  value?: string;
  style?: ViewStyle;
  color?: string;
}

/**
 * Парящий бейдж для Hero-секции дашборда.
 * Позиционируется абсолютно через style prop.
 */
export const FloatingBadge: React.FC<FloatingBadgeProps> = ({
  emoji,
  label,
  value,
  style,
  color = Colors.purple,
}) => {
  return (
    <View
      style={[styles.badge, style]}
      accessibilityLabel={`${label}: ${value ?? ''}`}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View>
        <Text style={[styles.label, { color: Colors.textSecondary }]}>{label}</Text>
        {value && (
          <Text style={[styles.value, { color }]}>{value}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.tag,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    ...Shadows.card,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: Typography.sizeXS,
    fontWeight: '500',
  },
  value: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
  },
});
