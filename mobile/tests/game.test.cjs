const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

// Compile the actual app modules in memory; no generated test copy of the rules.
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  module._compile(result.outputText, filename);
};
const { applyCommand: act, createGame, goalProgress } = require('../src/game/engine.ts');
const { PET_COMBOS } = require('../src/types/pet.ts');
const { decodeSave, encodeSave, SAVE_KEY } = require('../src/game/storage.ts');
const { QUESTS } = require('../src/constants/quests.ts');
const start = (demo = true) => createGame('Финни', PET_COMBOS[0], demo, 1000);
const planned = () => act(start(), { type: 'budget', plan: { mandatory: 40, desired: 30, savings: 30 } });
const completePeriod = game => {
  if (!game.period.incomeClaimed) game = act(game, { type: 'income' });
  game = act(game, { type: 'budget', plan: { mandatory: 40, desired: 30, savings: 30 } });
  game = act(game, { type: 'purchase', productId: 'food_soup' });
  game = act(game, { type: 'purchase', productId: 'fun_stickers' });
  game = act(game, { type: 'deposit', amount: 30 });
  return act(game, { type: 'advance' }, 1001);
};

test('five-period demo reaches the goal and stage 3, preserving money and restart state', () => {
  let game = act(start(), { type: 'goal', goalId: 'house' });
  for (let i = 1; i <= 5; i++) {
    game = decodeSave(encodeSave(completePeriod(game)));
    assert.equal(game.history.length, i);
    assert.equal(game.wallet, 0);
    assert.equal(game.savings, i * 30);
    assert.equal(game.pet.growthStage, i >= 4 ? 3 : i >= 2 ? 2 : 1);
  }
  assert.equal(game.period.number, 5);
  assert.equal(game.period.closed, true);
  assert.equal(goalProgress(game).remaining, 0);
  assert.equal(goalProgress(game).estimate, 0);
  assert.throws(() => act(game, { type: 'income' }));
  assert.throws(() => act(game, { type: 'advance' }));
  assert.throws(() => act(game, { type: 'deposit', amount: 1 }));
});
test('income and plan cannot be claimed twice and plan does not move money', () => {
  const game = start();
  assert.equal(game.wallet, 100);
  assert.throws(() => act(game, { type: 'income' }));
  const next = planned();
  assert.equal(next.wallet, 100);
  assert.equal(next.savings, 0);
  assert.throws(() => act(next, { type: 'budget', plan: { mandatory: 0, desired: 0, savings: 0 } }));
});
test('overspending and invalid amounts never mutate input state', () => {
  const game = planned();
  const original = encodeSave(game);
  for (const amount of [-10, 0, 0.5, NaN, Infinity, 101]) {
    assert.throws(() => act(game, { type: 'deposit', amount }));
    assert.equal(encodeSave(game), original);
  }
  assert.throws(() => act(game, { type: 'purchase', productId: 'fun_game' }));
  assert.throws(() => act(start(), { type: 'budget', plan: { mandatory: 80, desired: 30, savings: 20 } }));
  assert.throws(() => act(start(), { type: 'budget', plan: { mandatory: NaN, desired: 0, savings: 0 } }));
});
test('withdrawal requires confirmation and conserves funds; goal switch preserves savings', () => {
  const saved = act(planned(), { type: 'deposit', amount: 40 });
  assert.throws(() => act(saved, { type: 'withdraw', amount: 10, confirmed: false }));
  assert.throws(() => act(saved, { type: 'withdraw', amount: 41, confirmed: true }));
  const next = act(saved, { type: 'withdraw', amount: 10, confirmed: true });
  assert.equal(next.savings, 30); assert.equal(next.wallet, 70);
  assert.equal(next.period.saved - next.period.withdrawn, 30);
  assert.equal(act(next, { type: 'goal', goalId: 'trip' }).savings, 30);
});
test('returning the deposit does not qualify as successful saving', () => {
  let game = act(planned(), { type: 'purchase', productId: 'food_apple' });
  game = act(game, { type: 'deposit', amount: 30 });
  game = act(game, { type: 'withdraw', amount: 30, confirmed: true });
  game = act(game, { type: 'advance' });
  assert.equal(game.history[0].successful, false);
  assert.match(game.history[0].reasons.join(' '), /накопления/);
});
test('over-plan purchases are recorded and make a period unsuccessful', () => {
  let game = act(planned(), { type: 'purchase', productId: 'food_meal' });
  assert.match(game.feedback, /превысили/);
  game = act(game, { type: 'deposit', amount: 30 });
  game = act(game, { type: 'advance' });
  assert.equal(game.history[0].successful, false);
  assert.equal(game.period.incomeClaimed, false);
});
test('wallet leftovers survive advance and the next income adds exactly 100', () => {
  let game = act(planned(), { type: 'advance' });
  assert.equal(game.wallet, 100);
  game = act(game, { type: 'income' });
  assert.equal(game.wallet, 200);
});
test('normal mode respects 24 hours while demo needs no wait', () => {
  let game = act(start(false), { type: 'budget', plan: { mandatory: 50, desired: 30, savings: 20 } });
  assert.throws(() => act(game, { type: 'advance' }, 1000 + 86400000 - 1));
  assert.equal(act(game, { type: 'advance' }, 1000 + 86400000).period.number, 2);
  assert.equal(act(planned(), { type: 'advance' }, 1001).period.number, 2);
});
test('interactive tasks validate numbers, basket, and allocation; reward is idempotent', () => {
  for (const [questId, answer] of [['q1', '100'], ['q3', 'water,food'], ['q5', '50,30,20']]) {
    const game = act(start(), { type: 'quest', questId, answer });
    assert.equal(game.attempts[questId].correct, true);
    assert.equal(game.wallet, 100 + game.attempts[questId].reward);
    assert.throws(() => act(game, { type: 'quest', questId, answer }));
  }
  const wrong = act(start(), { type: 'quest', questId: 'q3', answer: 'food,water,toy' });
  assert.equal(wrong.wallet, 100);
  assert.equal(wrong.attempts.q3.reward, 0);
  assert.throws(() => act(start(), { type: 'quest', questId: 'q5', answer: ',,' }));
});
test('incorrect quiz gives feedback without deducting imaginary story money', () => {
  const quest = QUESTS.find(q => q.id === 'q2');
  const choice = quest.choices.find(c => c.result === 'bad');
  const game = act(start(), { type: 'quest', questId: quest.id, answer: choice.id });
  assert.equal(game.wallet, 100);
  assert.equal(game.attempts.q2.reward, 0);
});
test('corrupt or unsupported snapshots are rejected instead of resetting silently', () => {
  assert.throws(() => decodeSave('{'));
  assert.throws(() => decodeSave('{"version":2,"game":null}'));
  const game = start(); game.wallet = -1;
  assert.throws(() => decodeSave(encodeSave(game)));
  assert.equal(decodeSave(encodeSave(null)), null);
});

const memory = new Map();
let failWrites = false;
let deferWrite = null;
const storage = {
  getItem: async key => memory.get(key) ?? null,
  setItem: async (key, value) => {
    if (failWrites) throw new Error('disk full');
    if (deferWrite) await deferWrite;
    memory.set(key, value);
  },
};
const originalLoad = Module._load;
Module._load = function(request, ...rest) {
  return request === '@react-native-async-storage/async-storage' ? storage : originalLoad.call(this, request, ...rest);
};
const { useGameStore: store } = require('../src/store/gameStore.ts');
Module._load = originalLoad;
function clean() {
  memory.clear(); failWrites = false; deferWrite = null;
  store.setState({ game: null, ready: false, busy: false, error: null, notice: null });
}
test('store restores a saved game and resets all current game fields durably', async () => {
  clean(); await store.getState().load();
  await store.getState().start('Финни', PET_COMBOS[0], true);
  await store.getState().dispatch({ type: 'goal', goalId: 'garden' });
  const snapshot = store.getState().game;
  store.setState({ game: null, ready: false });
  await store.getState().load();
  assert.deepEqual(store.getState().game, snapshot);
  assert.equal(await store.getState().reset(), true);
  await store.getState().load();
  assert.equal(store.getState().game, null);
});
test('failed persistence leaves both saved and displayed money untouched, retry works', async () => {
  clean(); await store.getState().load(); await store.getState().start('Финни', PET_COMBOS[0], true);
  const before = memory.get(SAVE_KEY);
  failWrites = true;
  assert.equal(await store.getState().dispatch({ type: 'deposit', amount: 20 }), false);
  assert.equal(store.getState().game.wallet, 100);
  assert.equal(memory.get(SAVE_KEY), before);
  failWrites = false;
  assert.equal(await store.getState().dispatch({ type: 'deposit', amount: 20 }), true);
  assert.equal(store.getState().game.wallet, 80);
});
test('double taps cannot execute a second command during persistence', async () => {
  clean(); await store.getState().load(); await store.getState().start('Финни', PET_COMBOS[0], true);
  let release;
  deferWrite = new Promise(resolve => { release = resolve; });
  const first = store.getState().dispatch({ type: 'deposit', amount: 20 });
  assert.equal(await store.getState().dispatch({ type: 'deposit', amount: 20 }), false);
  release(); await first; deferWrite = null;
  assert.equal(store.getState().game.savings, 20);
});
test('legacy data is retained and recovery backs up corrupt snapshots', async () => {
  clean(); memory.set('finni-profile', '{"old":"data"}');
  await store.getState().load();
  assert.ok(store.getState().notice);
  assert.equal(memory.get('finni-profile'), '{"old":"data"}');
  memory.set(SAVE_KEY, 'corrupt');
  await store.getState().load();
  assert.equal(store.getState().ready, false);
  assert.equal(await store.getState().start('Финни', PET_COMBOS[0], true), false);
  assert.equal(await store.getState().recover(), true);
  assert.ok([...memory].some(([key, value]) => key.startsWith(SAVE_KEY + '-backup-') && value === 'corrupt'));
});
