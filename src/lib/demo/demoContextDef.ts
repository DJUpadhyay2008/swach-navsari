import { createContext, useContext } from 'react';

export interface DemoContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
}

export const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  setDemoMode: () => {},
});

export function useDemoMode() {
  return useContext(DemoContext);
}
