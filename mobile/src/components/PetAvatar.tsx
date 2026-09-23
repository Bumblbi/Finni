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

      {/* Изображение питомца */}
      <Image
        source={getPetImageSource(pet.growthStage, pet.mood)}
        style={{ width: containerSize * 0.8, height: containerSize * 0.8, resizeMode: 'contain' }}
      />

      {/* Плашка стадии */}
      {size === 'large' && (
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{stageLabel}</Text>
        </View>
      )}
    </Animated.View>
  );
};

import { petImages } from '../constants/petImages';

function getPetImageSource(stage: PetGrowthStage, mood: number) {
  // Защита от старых данных: если stage undefined или 0, ставим 1
  const safeStage = stage || 1;
  let key = '';

  if (safeStage === 1) {
    key = mood > 50 ? 'stage1_happy' : 'stage1_sad';
  } else if (safeStage === 2) {
    key = mood > 50 ? 'stage2_happy' : 'stage2_sad';
  } else {
    key = mood > 50 ? 'stage3_happy' : 'stage3_sad';
  }

  // Возвращаем URI вместо require
  return { uri: petImages[key] };
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
