import { Context } from 'yawr';
import { CurrentPlayerValidation } from '../../shared/interface';

type OverrideValidation = (ctx: Context, gameId: number) => CurrentPlayerValidation;

export let overridenComponentContainerValidation: OverrideValidation | undefined;

export function overrideComponentContainerValidation(validation: OverrideValidation, cb: () => void): void {
  overridenComponentContainerValidation = validation;
  cb();
  overridenComponentContainerValidation = undefined;
}
