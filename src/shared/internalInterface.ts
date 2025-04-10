export interface IHiddenObjectWrapper<Type> {
  object: Type;
  visibleOnlyTo?: number;
}

export type IHiddenObjectWrapperMap<Type> = {
  [id: number]: IHiddenObjectWrapper<Type> | null;
};

export interface StateResponseInterface<Data, HiddenType> {
  state: Data;
  hidden?: IHiddenObjectWrapperMap<HiddenType>;
}

export interface ActionHiddenObjectInfo<HiddenType> {
  delta: IHiddenObjectWrapperMap<HiddenType>;
  responses: [number, HiddenType][];
}

/**
 * Interface representing id -> object mapping.
 */
export type ObjectsMap<Type> = {
  [id: number]: Type;
};
