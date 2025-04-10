import { CurrentPlayerValidation } from '../shared/interface';

export function createServerValidation(): CurrentPlayerValidation {
  return {
    isUser: (_id: string, _name: string) => false,
    canMoveAsPlayer: (_player: number) => false,
    isServerOriginating: () => true,
  };
}
