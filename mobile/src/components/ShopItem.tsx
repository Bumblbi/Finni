// src/components/ShopItem.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ShopProduct } from '../constants/shop';
import { Colors, Radius, Typography, Spacing, Shadows, TouchTarget } from '../constants/theme';

interface ShopItemProps {
  product: ShopProduct;
  canAfford: boolean;
  onBuy: (product: ShopProduct) => void;
}

export const ShopItem: React.FC<ShopItemProps> = ({
  product,
  canAfford,
  onBuy,
}) => {
  const accentColor = product.category === 'mandatory' ? Colors.mint : Colors.purple;
  const categoryLabel = product.category === 'mandatory'
    ? '🥗 Обязательное'
    : '🎮 Желаемое';

  return (
    <View
      style={styles.card}
      accessibilityLabel={`${product.name}, цена ${product.price} рублей, ${categoryLabel}`}
    >
      {/* Emoji */}
      <View style={[styles.emojiBox, { backgroundColor: `${accentColor}18` }]}>
        <Text style={styles.emoji}>{product.emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.desc}>{product.description}</Text>

        {/* Category tag */}
        <View style={[styles.tag, { backgroundColor: `${accentColor}18` }]}>
          <Text style={[styles.tagText, { color: accentColor }]}>
            {categoryLabel}
          </Text>
        </View>

        {/* Effects */}
        <View style={styles.effectsRow}>
          {product.satietyDelta > 0 && (
            <Text style={styles.effect}>🍽 +{product.satietyDelta}</Text>
          )}
          {product.moodDelta > 0 && (
            <Text style={styles.effect}>😊 +{product.moodDelta}</Text>
          )}
        </View>
      </View>

      {/* Buy button */}
      <TouchableOpacity
        style={[
          styles.buyBtn,
          canAfford
            ? { backgroundColor: accentColor }
            : styles.buyBtnDisabled,
        ]}
        onPress={() => onBuy(product)}
        accessibilityLabel={
          canAfford
            ? `Купить ${product.name} за ${product.price} рублей`
            : `Не хватает денег на ${product.name}`
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: !canAfford }}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.buyBtnText,
          !canAfford && styles.buyBtnTextDisabled,
        ]}>
          {canAfford ? `${product.price} ₽` : '😢'}
        </Text>
        <Text style={[
          styles.buyBtnLabel,
          !canAfford && styles.buyBtnTextDisabled,
        ]}>
          {canAfford ? 'Купить' : 'Мало денег'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  emojiBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  desc: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.tag,
    marginTop: 3,
  },
  tagText: {
    fontSize: Typography.sizeXS,
    fontWeight: '700',
  },
  effectsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  effect: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  buyBtn: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buyBtnDisabled: {
    backgroundColor: Colors.border,
  },
  buyBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizeSM,
    fontWeight: '800',
  },
  buyBtnLabel: {
    color: Colors.textWhite,
    fontSize: Typography.sizeXS,
    fontWeight: '500',
  },
  buyBtnTextDisabled: {
    color: Colors.textSecondary,
  },
});
