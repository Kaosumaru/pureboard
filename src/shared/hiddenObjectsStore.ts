import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { IHiddenObjectWrapperMap, Store } from './interface';

export type ObjectsMap<Type> = {
  [id: number]: Type;
};

export interface HiddenObjectsData<Type> {
  objects: ObjectsMap<Type>;
}

export interface HiddenObjectsState<Type> extends HiddenObjectsData<Type> {
  setState: (data: IHiddenObjectWrapperMap<Type>) => void;
  setStateDelta: (delta: IHiddenObjectWrapperMap<Type>) => void;
}

export function createHiddenObjectsStore<Type>(): Store<HiddenObjectsState<Type>> {
  const useHiddenObjectsStore = create<HiddenObjectsState<Type>>()(
    devtools(set => ({
      objects: {},
      setState: (data: IHiddenObjectWrapperMap<Type>) => set(_ => ({ objects: applyState(data) })),
      setStateDelta: (delta: IHiddenObjectWrapperMap<Type>) => set(store => ({ objects: applyDelta(store.objects, delta) })),
    }))
  );

  return useHiddenObjectsStore;
}

function applyState<Type>(state: IHiddenObjectWrapperMap<Type>): ObjectsMap<Type> {
  const objects: ObjectsMap<Type> = {};
  for (const key in state) {
    if (state[key] !== null) {
      objects[key] = state[key].object;
    }
  }
  return objects;
}

function applyDelta<Type>(data: ObjectsMap<Type>, delta: IHiddenObjectWrapperMap<Type>): ObjectsMap<Type> {
  const newData = { ...data };
  for (const key in delta) {
    if (delta[key] === null) {
      delete newData[key];
    } else {
      newData[key] = delta[key].object;
    }
  }
  return newData;
}
