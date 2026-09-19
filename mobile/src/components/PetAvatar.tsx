// src/components/PetAvatar.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { PetState, PetGrowthStage, GROWTH_STAGE_LABELS } from '../types/pet';
import { Colors, Radius, Shadows } from '../constants/theme';

interface PetAvatarProps {
  pet: PetState;
  size?: 'small' | 'large';
  animated?: boolean;
}

/**
 * Отображает питомца-утконоса Финни.
 * В зависимости от стадии роста — разный размер.
 * Если animated=true — лёгкое покачивание (bob-анимация).
 */
export const PetAvatar: React.FC<PetAvatarProps> = ({
  pet,
  size = 'large',
  animated = true,
}) => {
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);

  const containerSize = size === 'large' ? 220 : 80;
  const stageLabel = GROWTH_STAGE_LABELS[pet.growthStage];

  // Эмодзи-заглушка до появления реальных ассетов
  const petEmoji = getPetEmoji(pet.growthStage, pet.mood);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: containerSize, height: containerSize },
        animated && { transform: [{ translateY: bobAnim }] },
      ]}
      accessibilityLabel={`Питомец Финни, стадия: ${stageLabel}, настроение: ${pet.mood}%`}
      accessibilityRole="image"
    >
      {/* Тень под питомцем */}
      <View style={[styles.shadow, { width: containerSize * 0.7 }]} />

      {/* Эмодзи питомца (заглушка) */}
      <Text style={[styles.petEmoji, { fontSize: containerSize * 0.65 }]}>
        {petEmoji}
      </Text>

      {/* Плашка стадии */}
      {size === 'large' && (
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{stageLabel}</Text>
        </View>
      )}
    </Animated.View>
  );
};

function getPetEmoji(stage: PetGrowthStage, mood: number): string {
  if (stage === 1) return mood > 50 ? '🐣' : '😟';
  if (stage === 2) return mood > 50 ? '🦆' : '😔';
  return mood > 50 ? '🦄' : '😤';
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    height: 16,
    borderRadius: 100,
    backgroundColor: 'rgba(138, 149, 165, 0.18)',
  },
  petEmoji: {
    textAlign: 'center',
    lineHeight: undefined,
  },
  stageBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: Colors.mint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.tag,
    ...Shadows.card,
  },
  stageText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
