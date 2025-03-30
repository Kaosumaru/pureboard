import { ActionHiddenObjectInfo, IHiddenObjects } from '../shared/interface';

export function getClientHiddenObjects<Type>(hiddenInfo?: ActionHiddenObjectInfo<Type>): IHiddenObjects<Type> | undefined {
  if (!hiddenInfo) {
    return undefined;
  }
  return {
    getVisibleObject: (id: number) => {
      if (hiddenInfo.responses.length === 0) {
        throw new Error('No more responses');
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [rid, obj] = hiddenInfo.responses.shift()!;
      if (id !== rid) {
        throw new Error('Desync!');
      }
      return obj;
    },
    setObjectVisibleOnlyFor: (_id: number, _player: number) => {
      // dummy
    },
    setObjectVisibleForAll: (_id: number) => {
      // dummy
    },
    shuffleAndHide: (_ids: number[]) => {
      // dummy
    },
    addObject: (_id: number, _object: Type) => {
      // dummy
    },
    clearObjects() {
      // dummy
    },
  };
}
