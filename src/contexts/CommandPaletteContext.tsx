import { createContext, useContext, useState, ReactNode } from 'react';

interface CommandPaletteContextType {
  isOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  registerAction: (id: string, action: () => void) => void;
  triggerAction: (id: string) => void;
  actions: Map<string, () => void>;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [actions] = useState(new Map<string, () => void>());

  const openCommandPalette = () => setIsOpen(true);
  const closeCommandPalette = () => setIsOpen(false);

  const registerAction = (id: string, action: () => void) => {
    actions.set(id, action);
  };

  const triggerAction = (id: string) => {
    const action = actions.get(id);
    if (action) {
      action();
    }
  };

  return (
    <CommandPaletteContext.Provider value={{
      isOpen,
      openCommandPalette,
      closeCommandPalette,
      registerAction,
      triggerAction,
      actions
    }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error('useCommandPaletteContext must be used within a CommandPaletteProvider');
  }
  return context;
}