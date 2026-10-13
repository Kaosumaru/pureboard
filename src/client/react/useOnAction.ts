import { useEffect } from 'react';
import { Signal } from 'typed-signals';

// creates a hook registering a handler for actions emitted by the signal
export function createUseOnAction<Action>(signal: Signal<(arg: Action) => void>): (handler: (action: Action) => void) => void {
  return (handler: (action: Action) => void) => {
    useEffect(() => {
      const connection = signal.connect(handler);
      return () => {
        connection.disconnect();
      };
    }, [handler]);
  };
}
