import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { Store } from './interface';

export interface ConnectionData {
  disconnected: boolean;
  autoreconnecting: boolean;
  triesToConnect: number;
}

export interface ConnectionState extends ConnectionData {
  setDisconnected: (disconnected: boolean) => void;
  setAutoreconnecting: (autoreconnecting: boolean) => void;
  setTriesToConnect: (triesToConnect: number) => void;
  reset: () => void;
}

export function createConnectionStore(): Store<ConnectionState> {
  const useConnectionStore = create<ConnectionState>()(
    devtools(set => ({
      disconnected: false,
      autoreconnecting: false,
      triesToConnect: 0,
      setDisconnected: (disconnected: boolean) => set(_ => ({ disconnected })),
      setAutoreconnecting: (autoreconnecting: boolean) => set(_ => ({ autoreconnecting })),
      setTriesToConnect: (triesToConnect: number) => set(_ => ({ triesToConnect })),
      reset: () => set(_ => ({ disconnected: false, autoreconnecting: false, triesToConnect: 0 })),
    }))
  );
  return useConnectionStore;
}
