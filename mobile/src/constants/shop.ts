// src/constants/shop.ts
import { BudgetCategory } from '../types/budget';

export interface ShopProduct {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  category: 'mandatory' | 'optional';
  /** Изменение сытости при покупке */
  satietyDelta: number;
  /** Изменение настроения при покупке */
  moodDelta: number;
  /** Объяснение для детей */
  tip: string;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  // ─── Обязательные (влияют на сытость) ───────────────────────────────────
  {
    id: 'food_apple',
    name: 'Яблоко',
    emoji: '🍎',
    description: 'Вкусное и полезное',
    price: 10,
    category: 'mandatory',
    satietyDelta: 15,
    moodDelta: 5,
    tip: 'Фрукты — это необходимая еда. Финни нужно кушать каждый день!',
  },
  {
    id: 'food_sandwich',
    name: 'Бутерброд',
    emoji: '🥪',
    description: 'Сытный перекус',
    price: 25,
    category: 'mandatory',
    satietyDelta: 30,
    moodDelta: 8,
    tip: 'Хороший обед — это обязательная трата. Без еды не будет сил!',
  },
  {
    id: 'food_soup',
    name: 'Суп',
    emoji: '🍲',
    description: 'Горячий и питательный',
    price: 40,
    category: 'mandatory',
    satietyDelta: 45,
    moodDelta: 10,
    tip: 'Горячая еда — самое важное. Это обязательная покупка!',
  },
  {
    id: 'food_meal',
    name: 'Полный обед',
    emoji: '🍱',
    description: 'Суп + второе + сок',
    price: 70,
    category: 'mandatory',
    satietyDelta: 60,
    moodDelta: 15,
    tip: 'Полноценный обед — это вложение в здоровье. Очень важная трата!',
  },

  // ─── Необязательные (влияют на настроение) ───────────────────────────────
  {
    id: 'fun_book',
    name: 'Книга',
    emoji: '📚',
    description: 'Интересная история',
    price: 50,
    category: 'optional',
    satietyDelta: 0,
    moodDelta: 20,
    tip: 'Книги — это здорово! Но сначала убедись, что поел. Это желаемая покупка.',
  },
  {
    id: 'fun_toy',
    name: 'Игрушка',
    emoji: '🧸',
    description: 'Весёлая игрушка',
    price: 80,
    category: 'optional',
    satietyDelta: 0,
    moodDelta: 25,
    tip: 'Игрушки радуют! Покупай их из денег "на желаемое", не трать всё сразу.',
  },
  {
    id: 'fun_stickers',
    name: 'Наклейки',
    emoji: '✨',
    description: 'Яркий стикерпак',
    price: 30,
    category: 'optional',
    satietyDelta: 0,
    moodDelta: 15,
    tip: 'Маленькая радость! Недорогое развлечение — хороший выбор.',
  },
  {
    id: 'fun_game',
    name: 'Настолка',
    emoji: '🎲',
    description: 'Игра для всей семьи',
    price: 120,
    category: 'optional',
    satietyDelta: 0,
    moodDelta: 35,
    tip: 'Настольные игры — это весело и полезно! Но это дорогая покупка — стоит накопить.',
  },
];

export const MANDATORY_PRODUCTS = SHOP_PRODUCTS.filter(p => p.category === 'mandatory');
export const OPTIONAL_PRODUCTS = SHOP_PRODUCTS.filter(p => p.category === 'optional');
