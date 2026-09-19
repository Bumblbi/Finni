// src/components/CustomTabBar.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Radius, Shadows, Typography, Spacing } from '../constants/theme';

const TAB_CONFIG: Record<string, { emoji: string; label: string }> = {
  Dashboard: { emoji: '🏠', label: 'Финни' },
  Budget:    { emoji: '💰', label: 'Бюджет' },
  Shop:      { emoji: '🛒', label: 'Магазин' },
  Quests:    { emoji: '📚', label: 'Задания' },
  Parent:    { emoji: '👤', label: 'Родитель' },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = route.name === 'Dashboard';
          const config = TAB_CONFIG[route.name] ?? { emoji: '•', label: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
              onPress={onPress}
              style={[styles.tab, isCenter && styles.centerTab]}
              activeOpacity={0.7}
            >
              {/* Center tab gets special circle background */}
              {isCenter ? (
                <View style={styles.centerCircle}>
                  <Text style={styles.centerEmoji}>{config.emoji}</Text>
                </View>
              ) : (
                <Text style={[styles.emoji, isFocused && styles.emojiFocused]}>
                  {config.emoji}
                </Text>
              )}

              <Text
                style={[
                  styles.label,
                  isFocused && (isCenter ? styles.labelCenterFocused : styles.labelFocused),
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>

              {/* Active dot indicator */}
              {isFocused && !isCenter && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.card + 4,
    borderTopRightRadius: Radius.card + 4,
    height: 90,
    paddingBottom: Platform.OS === 'android' ? Spacing.lg : Spacing.xxl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'flex-start',
    ...Shadows.tabBar,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    gap: 2,
  },
  centerTab: {
    marginTop: -15, // Выступает вверх
  },
  centerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  centerEmoji: {
    fontSize: 24,
  },
  emoji: {
    fontSize: 22,
    opacity: 0.45,
  },
  emojiFocused: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelFocused: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  labelCenterFocused: {
    color: Colors.mint,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.mint,
    marginTop: 1,
  },
});
