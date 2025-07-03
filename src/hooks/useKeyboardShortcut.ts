import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  ctrlOrCmd?: boolean;
  alt?: boolean;
  shift?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  options: UseKeyboardShortcutOptions,
  callback: () => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlOrCmd = false, alt = false, shift = false, preventDefault = true } = options;
      
      // Check if the key matches
      if (event.key !== key && event.code !== key) return;
      
      // Check modifier keys
      const ctrlPressed = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
      
      if (ctrlOrCmd && !ctrlPressed) return;
      if (!ctrlOrCmd && ctrlPressed) return;
      if (alt && !event.altKey) return;
      if (!alt && event.altKey) return;
      if (shift && !event.shiftKey) return;
      if (!shift && event.shiftKey) return;
      
      // Prevent default if specified
      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Don't trigger if we're in an input field (unless specifically intended)
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true' ||
                          target.closest('[role="textbox"]') ||
                          target.closest('.monaco-editor');
      
      // For command palette (Ctrl/Cmd+K), allow triggering from input fields
      if (key === 'k' && ctrlOrCmd && !isInputField) {
        callback();
      } else if (key === 'k' && ctrlOrCmd && isInputField) {
        // Allow Ctrl+K even in input fields for command palette
        callback();
      } else if (!isInputField) {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [...dependencies, options.key, options.ctrlOrCmd, options.alt, options.shift]);
}

// Specific hook for command palette
export function useCommandPalette(callback: () => void) {
  useKeyboardShortcut(
    { key: 'k', ctrlOrCmd: true, preventDefault: true },
    callback
  );
}

// Additional useful shortcuts
export function useEscapeKey(callback: () => void) {
  useKeyboardShortcut(
    { key: 'Escape', preventDefault: false },
    callback
  );
}

export function useSaveShortcut(callback: () => void) {
  useKeyboardShortcut(
    { key: 's', ctrlOrCmd: true, preventDefault: true },
    callback
  );
}