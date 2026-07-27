import { Context } from 'yawr';
import { UserPermissions } from '../../shared/interface';

type OverrideValidation = (ctx: Context, gameId: number) => UserPermissions;

export let overridenComponentContainerValidation: OverrideValidation | undefined;

export function overrideComponentContainerValidation(validation: OverrideValidation, cb: () => void): void {
  overridenComponentContainerValidation = validation;
  cb();
  overridenComponentContainerValidation = undefined;
}
