import { Context } from 'yawr';
import { UserPermissions } from '../../shared/interface';

type OverridePermissions = (ctx: Context, gameId: number) => UserPermissions;

export let overridenComponentContainerPermissions: OverridePermissions | undefined;

export function overrideComponentContainerPermissions(permissions: OverridePermissions, cb: () => void): void {
  overridenComponentContainerPermissions = permissions;
  cb();
  overridenComponentContainerPermissions = undefined;
}
