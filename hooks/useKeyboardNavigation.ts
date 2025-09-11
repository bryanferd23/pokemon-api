/**
 * Custom hook for keyboard navigation in grids and lists
 */

import { useCallback, useEffect, useRef } from 'react';

interface UseKeyboardNavigationProps {
  itemCount: number;
  columnsCount: number;
  onSelect?: (index: number) => void;
  enabled?: boolean;
  containerSelector?: string;
}

export function useKeyboardNavigation({
  itemCount,
  columnsCount,
  onSelect,
  enabled = true,
  containerSelector = '[role="grid"]',
}: UseKeyboardNavigationProps) {
  const currentIndexRef = useRef<number>(-1);
  const containerRef = useRef<HTMLElement | null>(null);

  const focusItem = useCallback((index: number) => {
    if (!containerRef.current || index < 0 || index >= itemCount) return;

    const items = containerRef.current.querySelectorAll('[role="gridcell"], .pokemon-card');
    const item = items[index] as HTMLElement;
    
    if (item) {
      // Remove previous focus
      items.forEach(el => el.classList.remove('keyboard-focused'));
      
      // Add focus to current item
      item.classList.add('keyboard-focused');
      item.focus();
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      currentIndexRef.current = index;
    }
  }, [itemCount]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || itemCount === 0) return;

    const { key } = event;
    const currentIndex = currentIndexRef.current;
    let newIndex = currentIndex;

    switch (key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, itemCount - 1);
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + columnsCount, itemCount - 1);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - columnsCount, 0);
        break;
        
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
        
      case 'End':
        event.preventDefault();
        newIndex = itemCount - 1;
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && onSelect) {
          onSelect(currentIndex);
        }
        return;
        
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      focusItem(newIndex);
    }
  }, [enabled, itemCount, columnsCount, onSelect, focusItem]);

  useEffect(() => {
    if (!enabled) return;

    const container = document.querySelector(containerSelector) as HTMLElement;
    containerRef.current = container;

    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      
      // Set up initial focusable state
      const items = container.querySelectorAll('[role="gridcell"], .pokemon-card');
      items.forEach((item, index) => {
        const element = item as HTMLElement;
        element.tabIndex = index === 0 ? 0 : -1;
        
        // Add click handler to update current index
        element.addEventListener('click', () => {
          currentIndexRef.current = index;
        });
      });

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
        items.forEach(item => {
          const element = item as HTMLElement;
          element.removeEventListener('click', () => {});
        });
      };
    }
  }, [enabled, containerSelector, handleKeyDown, itemCount]);

  const setInitialFocus = useCallback(() => {
    if (itemCount > 0) {
      focusItem(0);
    }
  }, [itemCount, focusItem]);

  const resetFocus = useCallback(() => {
    currentIndexRef.current = -1;
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('.keyboard-focused');
      items.forEach(item => item.classList.remove('keyboard-focused'));
    }
  }, []);

  return {
    setInitialFocus,
    resetFocus,
    currentIndex: currentIndexRef.current,
  };
}