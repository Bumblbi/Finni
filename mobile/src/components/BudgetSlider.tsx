// src/components/BudgetSlider.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Radius, Typography, Spacing, Shadows } from '../constants/theme';

interface BudgetSliderProps {
  label: string;
  emoji: string;
  color: string;
  value: number;
  maxValue: number;
  onChange: (val: number) => void;
  description?: string;
  errorMessage?: string;
}

/**
 * Компонент для ввода суммы по категории бюджета.
 * Включает: заголовок, нумерические кнопки ±, поле ввода и бар прогресса.
 */
export const BudgetSlider: React.FC<BudgetSliderProps> = ({
  label,
  emoji,
  color,
  value,
  maxValue,
  onChange,
  description,
  errorMessage,
}) => {
  const STEP = 10;
  const percentage = maxValue > 0 ? Math.min(1, value / maxValue) : 0;

  const increment = () => onChange(Math.min(maxValue, value + STEP));
  const decrement = () => onChange(Math.max(0, value - STEP));

  const handleText = (text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) {
      onChange(0);
    } else {
      onChange(Math.min(maxValue, Math.max(0, num)));
    }
  };

  return (
    <View
      style={[styles.card, errorMessage ? styles.cardError : null]}
      accessibilityLabel={`${label}: ${value} рублей из ${maxValue}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: `${color}22` }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.labelWrap}>
          <Text style={styles.label}>{label}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Minus button */}
        <TouchableOpacity
          style={[styles.stepBtn, styles.stepBtnMinus]}
          onPress={decrement}
          accessibilityLabel={`Уменьшить ${label}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value.toString()}
            onChangeText={handleText}
            keyboardType="number-pad"
            maxLength={5}
            accessibilityLabel={`Введите сумму для ${label}`}
            selectTextOnFocus
          />
          <Text style={styles.currency}>₽</Text>
        </View>

        {/* Plus button */}
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: color }]}
          onPress={increment}
          accessibilityLabel={`Увеличить ${label}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.stepBtnText, { color: Colors.textWhite }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Progress track */}
      <View style={styles.track}>
        <View
          style={[
            styles.trackFill,
            { width: `${percentage * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.percentText, { color }]}>
        {Math.round(percentage * 100)}% от дохода
      </Text>

      {/* Error message */}
      {errorMessage && (
        <View style={styles.errorRow} accessibilityRole="alert">
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardError: {
    borderWidth: 1.5,
    borderColor: Colors.red,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border,
  },
  stepBtnMinus: {
    backgroundColor: Colors.bgCardAlt,
  },
  stepBtnText: {
    fontSize: Typography.sizeLG,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizeLG,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  currency: {
    fontSize: Typography.sizeMD,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.circle,
    overflow: 'hidden',
    marginBottom: 4,
  },
  trackFill: {
    height: '100%',
    borderRadius: Radius.circle,
  },
  percentText: {
    fontSize: Typography.sizeXS,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    fontSize: Typography.sizeSM,
    color: Colors.red,
    fontWeight: '500',
    flex: 1,
  },
});
