import { CurrentPlayerValidation, IHiddenObjects } from '../shared/interface';
import { IHiddenObjectWrapper, IHiddenObjectWrapperMap } from '../shared/internalInterface';

export class HiddenObjectContainer<Type> implements IHiddenObjects<Type> {
  private hiddenObjects = new Map<number, IHiddenObjectWrapper<Type>>();
  private queuedHiddenObjects = new Map<number, IHiddenObjectWrapper<Type>>();
  private visibleObjectsResponses: [number, Type][] = [];

  constructor(initial: IHiddenObjectWrapperMap<Type> = {}) {
    for (const [k, v] of Object.entries(initial)) {
      if (!v) {
        continue;
      }
      this.hiddenObjects.set(Number(k), v);
    }
  }

  clearObjects(): void {
    this.hiddenObjects = new Map<number, IHiddenObjectWrapper<Type>>();
    this.queuedHiddenObjects = new Map<number, IHiddenObjectWrapper<Type>>();
    this.visibleObjectsResponses = [];
  }

  addObject(id: number, object: Type): void {
    this.hiddenObjects.set(id, {
      object,
      visibleOnlyTo: undefined,
    });
  }

  shuffleAndHide(ids: number[], visibleTo: number): void {
    const objects = shuffleArrayInPlace(ids.map(id => this.findObject(id).object));
    for (const id of ids) {
      const obj = this.findObject(id);
      obj.object = objects.pop() as Type;
      obj.visibleOnlyTo = visibleTo;
      this.queuedHiddenObjects.set(id, obj);
    }
  }

  getVisibleObject(id: number): Type {
    const obj = this.findObject(id);

    this.queuedHiddenObjects.set(id, {
      object: obj.object,
      visibleOnlyTo: undefined,
    });

    this.visibleObjectsResponses.push([id, obj.object]);

    return obj.object;
  }

  setObjectVisibleOnlyFor(id: number, player: number): void {
    const obj = this.findObject(id);
    obj.visibleOnlyTo = player;
    this.queuedHiddenObjects.set(id, {
      object: obj.object,
      visibleOnlyTo: player,
    });
  }

  setObjectVisibleForAll(id: number): void {
    const obj = this.findObject(id);
    this.queuedHiddenObjects.set(id, {
      object: obj.object,
      visibleOnlyTo: undefined,
    });
  }

  getState(validation: CurrentPlayerValidation): IHiddenObjectWrapperMap<Type> {
    return Object.fromEntries([...this.hiddenObjects.entries()].filter(([_, object]) => isVisible(object, validation)));
  }

  getStateDelta(validation: CurrentPlayerValidation): IHiddenObjectWrapperMap<Type> {
    return Object.fromEntries([...this.queuedHiddenObjects.entries()].map(([id, object]) => (isVisible(object, validation) ? [id, object] : [id, null])));
  }

  flushDelta(): void {
    for (const [k, v] of this.queuedHiddenObjects) {
      this.hiddenObjects.set(k, v);
    }

    this.visibleObjectsResponses = [];
  }

  revertDelta(): void {
    this.queuedHiddenObjects = new Map<number, IHiddenObjectWrapper<Type>>();
    this.visibleObjectsResponses = [];
  }

  responses(): [number, Type][] {
    return this.visibleObjectsResponses;
  }

  private findObject(id: number): IHiddenObjectWrapper<Type> {
    const obj = this.queuedHiddenObjects.get(id) ?? this.hiddenObjects.get(id);
    if (!obj) {
      throw new Error('Object not found');
    }
    return obj;
  }
}

function isVisible<Type>(obj: IHiddenObjectWrapper<Type>, validation: CurrentPlayerValidation): boolean {
  return obj.visibleOnlyTo === undefined || validation.canMoveAsPlayer(obj.visibleOnlyTo);
}

function shuffleArrayInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
