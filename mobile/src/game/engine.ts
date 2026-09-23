import { SHOP_PRODUCTS } from '../constants/shop';
import { QUESTS } from '../constants/quests';
import { PET_COMBOS, PetAppearance, PetState } from '../types/pet';

export const INCOME = 100;
export const GOALS = [
  { id: 'house', title: 'Домик для Финни', target: 150, emoji: '🏡' },
  { id: 'trip', title: 'Путешествие', target: 300, emoji: '🧳' },
  { id: 'garden', title: 'Сад Финни', target: 500, emoji: '🌳' },
];
export type Plan = { mandatory: number; desired: number; savings: number };
export type Period = {
  number: number; startedAt: number; incomeClaimed: boolean; plan: Plan | null;
  mandatory: number; desired: number; saved: number; withdrawn: number; closed: boolean;
};
export type PeriodResult = {
  period: Period; successful: boolean; reasons: string[];
  moodDelta: number; satietyDelta: number; disciplineDelta: number;
  stageBefore: number; stageAfter: number;
};
export type Entry = { id: number; period: number; at: number; label: string; wallet: number; savings: number };
export type Attempt = { answer: string; correct: boolean; feedback: string; reward: number };
export type Game = {
  version: 1; name: string; demo: boolean; wallet: number; savings: number;
  goalId: string | null; pet: PetState; period: Period; history: PeriodResult[];
  transactions: Entry[]; attempts: Record<string, Attempt>; feedback: string;
};
export type Command =
  | { type: 'income' }
  | { type: 'budget'; plan: Plan }
  | { type: 'purchase'; productId: string }
  | { type: 'deposit'; amount: number }
  | { type: 'withdraw'; amount: number; confirmed: boolean }
  | { type: 'goal'; goalId: string }
  | { type: 'quest'; questId: string; answer: string }
  | { type: 'advance' };

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const check = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const amountValid = (value: number) => Number.isSafeInteger(value) && value > 0 && value <= 1000000;
const freshPeriod = (number: number, now: number): Period => ({
  number, startedAt: now, incomeClaimed: false, plan: null,
  mandatory: 0, desired: 0, saved: 0, withdrawn: 0, closed: false,
});

export function createGame(name: string, appearance: PetAppearance, demo: boolean, now = Date.now()): Game {
  check(name.trim().length > 0 && name.trim().length <= 16, 'Имя должно содержать от 1 до 16 символов.');
  check(PET_COMBOS.some(p => JSON.stringify(p) === JSON.stringify(appearance)), 'Выбери внешность питомца.');
  const game: Game = {
    version: 1, name: name.trim(), demo, wallet: 0, savings: 0, goalId: null,
    pet: { name: name.trim(), appearance, growthStage: 1, mood: 70, satiety: 70, energy: 80, discipline: 50, growthPoints: 0 },
    period: freshPeriod(1, now), history: [], transactions: [], attempts: {}, feedback: '',
  };
  return applyCommand(game, { type: 'income' }, now);
}

// Three tasks use a number, a composed basket, and a budget instead of answer choices.
export const ACTIVITIES: Record<string, { title: string; instruction: string; kind: 'saving' | 'basket' | 'budget' }> = {
  q1: { title: 'План накоплений', instruction: 'Конструктор стоит 300 монет. До покупки 3 недели. Введи, сколько нужно откладывать каждую неделю.', kind: 'saving' },
  q3: { title: 'Собери корзину', instruction: 'Есть 35 монет. Добавь еду (20) и воду (10), не превысив бюджет. Игрушка (30) может подождать.', kind: 'basket' },
  q5: { title: 'Распредели 100 монет', instruction: 'На необходимое нужно хотя бы 40 монет, на накопления — хотя бы 20. Распредели ровно 100 монет между тремя категориями.', kind: 'budget' },
};

export function assessQuest(questId: string, answer: string): Attempt {
  const quest = QUESTS.find(q => q.id === questId);
  check(quest, 'Задание не найдено.');
  let correct = false;
  let feedback = '';
  if (questId === 'q1') {
    check(/^\d+$/.test(answer), 'Введи целое число монет.');
    correct = Number(answer) === 100;
    feedback = '300 ÷ 3 = 100 монет в неделю. Срок и стоимость помогают составить план накоплений.';
  } else if (questId === 'q3') {
    check(/^(food|water|toy)(,(food|water|toy))*$/.test(answer), 'Добавь покупки в корзину.');
    correct = answer.split(',').sort().join(',') === 'food,water';
    feedback = 'Еда и вода стоят 30 монет. Остаётся 5 монет. Сначала обеспечиваем необходимое.';
  } else if (questId === 'q5') {
    check(/^\d+,\d+,\d+$/.test(answer), 'Заполни три суммы целыми числами.');
    const [mandatory, desired, savings] = answer.split(',').map(Number);
    correct = mandatory >= 40 && savings >= 20 && mandatory + desired + savings === 100;
    feedback = 'Например: 50 на необходимое, 30 на желаемое, 20 в копилку. Сумма плана — 100 монет.';
  } else {
    const choice = quest!.choices.find(c => c.id === answer);
    check(choice, 'Выбери ответ.');
    correct = choice!.result === 'good';
    feedback = choice!.explanation;
  }
  return { answer, correct, feedback, reward: correct ? quest!.reward.money : 0 };
}

export function applyCommand(previous: Game, command: Command, now = Date.now()): Game {
  check(!previous.period.closed, 'Пять периодов завершены. Посмотри прогресс или начни новую игру в разделе родителя.');
  const game: Game = JSON.parse(JSON.stringify(previous));
  const period = game.period;
  const movement = (label: string, wallet: number, savings = 0) => {
    check(game.wallet + wallet >= 0, 'Не хватает монет в кошельке. Выбери покупку дешевле или выполни задание.');
    check(game.savings + savings >= 0, 'В копилке нет такой суммы.');
    game.wallet += wallet; game.savings += savings;
    game.transactions.push({ id: game.transactions.length + 1, period: period.number, at: now, label, wallet, savings });
  };
  switch (command.type) {
    case 'income':
      check(!period.incomeClaimed, 'Доход этого периода уже получен.');
      movement('Доход периода', INCOME); period.incomeClaimed = true;
      game.feedback = 'Получено 100 монет. Выбери цель и составь бюджет.';
      break;
    case 'budget': {
      check(period.incomeClaimed, 'Сначала получи доход периода.');
      check(!period.plan, 'План уже сохранён. Новый план можно составить в следующем периоде.');
      const { mandatory, desired, savings } = command.plan;
      check([mandatory, desired, savings].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000), 'План должен содержать целые неотрицательные суммы.');
      check(mandatory + desired + savings <= game.wallet, 'Нельзя распределить больше монет, чем есть в кошельке.');
      period.plan = { ...command.plan };
      game.feedback = 'План сохранён. Переведи накопления в копилку отдельным действием.';
      break;
    }
    case 'purchase': {
      check(period.plan, 'Сначала составь бюджет периода.');
      const product = SHOP_PRODUCTS.find(p => p.id === command.productId);
      check(product, 'Товар не найден.');
      movement(product!.name, -product!.price);
      const category = product!.category === 'mandatory' ? 'mandatory' : 'desired';
      period[category] += product!.price;
      game.pet.mood = clamp(game.pet.mood + product!.moodDelta);
      game.pet.satiety = clamp(game.pet.satiety + product!.satietyDelta);
      game.feedback = product!.tip + (period[category] > period.plan![category] ? ' Расходы по категории превысили план.' : ' Покупка укладывается в план.');
      break;
    }
    case 'deposit':
    case 'withdraw': {
      check(amountValid(command.amount), 'Введи целое число монет от 1 до 1 000 000.');
      const deposit = command.type === 'deposit';
      if (!deposit) check(command.confirmed, 'Подтверди снятие: достижение цели может отложиться.');
      movement(deposit ? 'Пополнение копилки' : 'Снятие из копилки', deposit ? -command.amount : command.amount, deposit ? command.amount : -command.amount);
      if (deposit) period.saved += command.amount; else period.withdrawn += command.amount;
      game.feedback = deposit ? 'Копилка пополнена. Ты ближе к цели!' : 'Монеты возвращены в кошелёк. До цели осталось больше.';
      break;
    }
    case 'goal':
      check(GOALS.some(g => g.id === command.goalId), 'Цель не найдена.');
      game.goalId = command.goalId;
      game.feedback = 'Цель выбрана. Накопления сохранены.';
      break;
    case 'quest': {
      check(!game.attempts[command.questId], 'Это задание уже выполнено. Награда выдаётся один раз.');
      const attempt = assessQuest(command.questId, command.answer);
      game.attempts[command.questId] = attempt;
      movement('Награда за задание', attempt.reward);
      if (attempt.correct) game.pet.mood = clamp(game.pet.mood + 5);
      game.feedback = attempt.feedback + ` Награда: ${attempt.reward} монет.`;
      break;
    }
    case 'advance': {
      check(period.incomeClaimed && period.plan, 'Перед завершением получи доход и составь план.');
      check(game.demo || now >= period.startedAt + 86400000, 'В обычном режиме период длится 24 часа с момента его начала.');
      const net = period.saved - period.withdrawn;
      const reasons: string[] = [];
      if (period.mandatory === 0) reasons.push('Не было обязательной покупки.');
      if (period.mandatory > period.plan!.mandatory) reasons.push('Обязательные расходы превысили план.');
      if (period.desired > period.plan!.desired) reasons.push('Желаемые расходы превысили план.');
      if (net <= 0 || net < period.plan!.savings) reasons.push('Чистые накопления должны быть положительными и не ниже плана.');
      const successful = reasons.length === 0;
      const before = { ...game.pet };
      const successes = game.history.filter(h => h.successful).length + Number(successful);
      game.pet.growthStage = successes >= 4 ? 3 : successes >= 2 ? 2 : 1;
      game.pet.growthPoints = successes;
      game.pet.mood = clamp(game.pet.mood + (successful ? 5 : -5));
      game.pet.satiety = clamp(game.pet.satiety - 15);
      game.pet.discipline = clamp(game.pet.discipline + (successful ? 10 : -5));
      period.closed = true;
      game.history.push({ period: { ...period }, successful,
        reasons: successful ? ['Есть обязательная покупка, расходы в пределах плана, накопления пополнены по плану.'] : reasons,
        moodDelta: game.pet.mood - before.mood, satietyDelta: game.pet.satiety - before.satiety,
        disciplineDelta: game.pet.discipline - before.discipline,
        stageBefore: before.growthStage, stageAfter: game.pet.growthStage });
      game.feedback = successful ? 'Период успешен! Соблюдение плана и накопления помогают Финни расти.' : 'Период завершён. Посмотри подсказки и попробуй новый план.';
      if (!game.demo || period.number < 5) game.period = freshPeriod(period.number + 1, now);
      break;
    }
  }
  return game;
}

export function goalProgress(game: Game) {
  const goal = GOALS.find(g => g.id === game.goalId);
  if (!goal) return null;
  const remaining = Math.max(0, goal.target - game.savings);
  const periods = [...game.history.map(h => h.period), ...(game.period.closed ? [] : [game.period])];
  const average = periods.reduce((sum, p) => sum + Math.max(0, p.saved - p.withdrawn), 0) / periods.length;
  return { ...goal, remaining, percent: Math.min(100, Math.floor(game.savings / goal.target * 100)),
    estimate: remaining === 0 ? 0 : average > 0 ? Math.ceil(remaining / average) : null };
}
