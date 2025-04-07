import { Context } from 'yawr';

export interface IServer {
  RegisterFunction(name: string, method: (context: Context, ...args: any[]) => any): void;
  onGroupRemoved(group: string, method: (() => void) | undefined): void;
  groupMemberCount(group: string): number;
}
