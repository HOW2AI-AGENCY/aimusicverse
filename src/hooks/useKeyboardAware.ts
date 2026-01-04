import { useEffect, useState, useCallback, RefObject } from 'react';

/**
 * Hook для отслеживания состояния клавиатуры и адаптации UI
 * 
 * Проблема:
 * - На iOS клавиатура скрывает нижнюю часть экрана
 * - Активные input поля могут оказаться под клавиатурой
 * - Формы не адаптируются к изменению высоты viewport
 * 
 * Решение:
 * - Отслеживаем высоту клавиатуры через visualViewport API
 * - Возвращаем высоту клавиатуры для применения padding
 * - Предоставляем функцию для auto-scroll к активному полю
 * 
 * @example
 * ```tsx
 * function MyForm() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { keyboardHeight, isKeyboardOpen, scrollToElement } = useKeyboardAware();
 *   
 *   return (
 *     <div 
 *       ref={containerRef}
 *       style={{ paddingBottom: `${keyboardHeight}px` }}
 *     >
 *       <input onFocus={(e) => scrollToElement(e.target)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardAware() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Проверяем поддержку visualViewport API
    if (!window.visualViewport) {
      return;
    }

    /**
     * Обработчик изменения viewport
     * Вычисляет высоту клавиатуры как разницу между innerHeight и visualViewport.height
     */
    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // Вычисляем высоту клавиатуры
      const currentKeyboardHeight = Math.max(
        0,
        window.innerHeight - viewport.height
      );

      setKeyboardHeight(currentKeyboardHeight);
      setIsKeyboardOpen(currentKeyboardHeight > 100); // Считаем что клавиатура открыта если > 100px

      // Также обновляем CSS переменную для использования в стилях
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${currentKeyboardHeight}px`
      );
    };

    // Инициализация
    handleViewportChange();

    // Подписываемся на события
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  /**
   * Прокручивает элемент в видимую область с учётом клавиатуры
   * 
   * @param element - DOM элемент для прокрутки (обычно input/textarea)
   * @param options - Опции прокрутки
   */
  const scrollToElement = useCallback(
    (
      element: HTMLElement,
      options: {
        behavior?: ScrollBehavior;
        block?: ScrollLogicalPosition;
        delay?: number;
      } = {}
    ) => {
      const {
        behavior = 'smooth',
        block = 'center',
        delay = 300, // Задержка для завершения анимации клавиатуры
      } = options;

      // Откладываем прокрутку чтобы клавиатура успела появиться
      setTimeout(() => {
        element.scrollIntoView({
          behavior,
          block,
          inline: 'nearest',
        });
      }, delay);
    },
    []
  );

  /**
   * Создаёт обработчик фокуса с auto-scroll
   * Удобная функция для применения к input элементам
   * 
   * @example
   * ```tsx
   * <input
   *   onFocus={createFocusHandler()}
   *   placeholder="Email"
   * />
   * ```
   */
  const createFocusHandler = useCallback(
    (options?: Parameters<typeof scrollToElement>[1]) => {
      return (event: React.FocusEvent<HTMLElement>) => {
        scrollToElement(event.currentTarget, options);
      };
    },
    [scrollToElement]
  );

  /**
   * Возвращает inline стиль для контейнера с padding-bottom
   * Удобно для применения padding без дополнительного кода
   * 
   * @example
   * ```tsx
   * <div style={getContainerStyle()}>
   *   <Form />
   * </div>
   * ```
   */
  const getContainerStyle = useCallback(
    (additionalPadding: number = 0) => ({
      paddingBottom: `${Math.max(keyboardHeight, additionalPadding)}px`,
      transition: 'padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
    [keyboardHeight]
  );

  /**
   * Возвращает className для контейнера (альтернатива inline style)
   * Требует соответствующие CSS классы в проекте
   */
  const getContainerClassName = useCallback(() => {
    return isKeyboardOpen ? 'keyboard-open' : 'keyboard-closed';
  }, [isKeyboardOpen]);

  return {
    /** Высота клавиатуры в пикселях */
    keyboardHeight,
    
    /** Флаг: клавиатура открыта (высота > 100px) */
    isKeyboardOpen,
    
    /** Функция для прокрутки элемента в видимую область */
    scrollToElement,
    
    /** Создать обработчик фокуса с auto-scroll */
    createFocusHandler,
    
    /** Получить inline style с padding-bottom */
    getContainerStyle,
    
    /** Получить className для контейнера */
    getContainerClassName,
  };
}

/**
 * Упрощённая версия хука для применения только padding
 * Использовать когда не нужен auto-scroll
 * 
 * @example
 * ```tsx
 * function SimpleForm() {
 *   const paddingBottom = useKeyboardPadding();
 *   
 *   return (
 *     <div style={{ paddingBottom }}>
 *       <input />
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardPadding(minPadding: number = 16): string {
  const { keyboardHeight } = useKeyboardAware();
  return `${Math.max(keyboardHeight, minPadding)}px`;
}

/**
 * Hook для автоматического применения keyboard-aware поведения к ref элементу
 * Удобен когда нужно применить к существующему компоненту
 * 
 * @example
 * ```tsx
 * function Form() {
 *   const formRef = useRef<HTMLFormElement>(null);
 *   useKeyboardAwareContainer(formRef);
 *   
 *   return <form ref={formRef}>...</form>;
 * }
 * ```
 */
export function useKeyboardAwareContainer(
  ref: RefObject<HTMLElement>,
  options: {
    minPadding?: number;
    autoScrollInputs?: boolean;
  } = {}
) {
  const { minPadding = 16, autoScrollInputs = true } = options;
  const { keyboardHeight, createFocusHandler } = useKeyboardAware();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Применяем padding
    element.style.paddingBottom = `${Math.max(keyboardHeight, minPadding)}px`;
    element.style.transition = 'padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    // Если включен auto-scroll, добавляем обработчики ко всем input
    if (autoScrollInputs) {
      const inputs = element.querySelectorAll<HTMLElement>(
        'input, textarea, select, [contenteditable="true"]'
      );
      
      const focusHandler = createFocusHandler();
      
      inputs.forEach((input) => {
        input.addEventListener('focus', focusHandler as unknown as EventListener);
      });

      return () => {
        inputs.forEach((input) => {
          input.removeEventListener('focus', focusHandler as unknown as EventListener);
        });
      };
    }
  }, [ref, keyboardHeight, minPadding, autoScrollInputs, createFocusHandler]);
}
