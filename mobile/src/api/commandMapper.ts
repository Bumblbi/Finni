// src/api/commandMapper.ts
/**
 * Maps local game engine commands to backend API commands.
 *
 * Local engine uses:   { type: 'purchase', productId: 'food_apple' }
 * Backend API expects: { action: 'purchase', product_id: 'food_apple', quantity: 1,
 *                        operation_id: '<uuid>', expected_revision: N, epoch: M }
 */

import { Command } from '../game/engine';
import { ApiCommand } from './types';
import { syncService } from './syncService';

function uuid(): string {
  // Simple UUID v4 generator (no crypto dependency needed for game IDs)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Convert a local engine Command into a backend ApiCommand.
 * Adds operation_id, expected_revision, and epoch fields.
 */
export function mapCommand(command: Command): ApiCommand {
  const base = {
    operation_id: uuid(),
    expected_revision: syncService.revision,
    epoch: syncService.epoch,
  };

  switch (command.type) {
    case 'income':
      return { ...base, action: 'income' };

    case 'budget':
      return {
        ...base,
        action: 'budget',
        required: command.plan.mandatory,
        wanted: command.plan.desired,
        savings: command.plan.savings,
      };

    case 'purchase':
      return {
        ...base,
        action: 'purchase',
        product_id: command.productId,
        quantity: 1,
      };

    case 'deposit':
      return {
        ...base,
        action: 'deposit',
        amount: command.amount,
      };

    case 'withdraw':
      return {
        ...base,
        action: 'withdraw',
        amount: command.amount,
        confirmed: true,
      };

    case 'goal':
      // Map local goal IDs to backend catalog IDs
      const goalMap: Record<string, string> = {
        house: 'goal_house',
        trip: 'goal_trip',
        garden: 'goal_garden',
      };
      return {
        ...base,
        action: 'goal',
        goal_id: goalMap[command.goalId] ?? command.goalId,
      };

    case 'quest':
      return {
        ...base,
        action: 'quest',
        quest_id: command.questId,
        choice_id: command.answer,
      };

    case 'advance':
      return { ...base, action: 'advance' };
  }
}
