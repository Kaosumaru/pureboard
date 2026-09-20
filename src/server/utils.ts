import { UserPermissions } from '../shared/interface';

export function createServerPermissions(): UserPermissions {
  return {
    isUser: (_id: string, _name: string) => false,
    canMoveAsPlayer: (_player: number) => false,
    isServerOriginating: () => true,
  };
}
