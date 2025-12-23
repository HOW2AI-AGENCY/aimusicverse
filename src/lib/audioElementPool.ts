/**
 * Audio Element Pool для оптимизации использования audio элементов
 * 
 * Проблема:
 * - Mobile Safari ограничивает количество одновременных <audio> элементов до 6-8
 * - Stem Studio может создавать 10+ audio элементов одновременно
 * - При превышении лимита: отказ воспроизведения, ошибки, потенциальные крэши
 * 
 * Решение:
 * - Пул с ограниченным количеством audio элементов
 * - Динамическое выделение и освобождение ресурсов
 * - Приоритизация: активные стемы важнее неактивных
 * - Graceful degradation при достижении лимита
 * 
 * @module audioElementPool
 */

import { logger } from './logger';

/**
 * Приоритеты для audio элементов
 * Используются при нехватке ресурсов для определения кого "освободить"
 */
export enum AudioPriority {
  LOW = 1,       // Background stems, ambient sounds
  MEDIUM = 2,    // Bass, drums, rhythm elements
  HIGH = 3,      // Vocals, lead instruments, main track
}

/**
 * Метаданные активного audio элемента
 */
interface ActiveAudioElement {
  element: HTMLAudioElement;
  id: string;
  priority: AudioPriority;
  acquiredAt: number;
  lastUsedAt: number;
}

/**
 * Статистика использования пула
 */
interface PoolStats {
  /** Количество доступных элементов в пуле */
  available: number;
  /** Количество активных (используемых) элементов */
  active: number;
  /** Общая емкость пула */
  capacity: number;
  /** Количество запросов на выделение */
  totalAcquired: number;
  /** Количество отказов (лимит достигнут) */
  totalRejected: number;
  /** Время работы пула (мс) */
  uptime: number;
}

/**
 * Класс AudioElementPool
 * Singleton для управления ограниченным количеством audio элементов
 */
class AudioElementPool {
  /** Пул свободных audio элементов */
  private pool: HTMLAudioElement[] = [];
  
  /** Активные (используемые) audio элементы */
  private active: Map<string, ActiveAudioElement> = new Map();
  
  /** Максимальное количество audio элементов (iOS Safari limit) */
  private readonly maxSize: number = 6;
  
  /** Время создания пула */
  private readonly createdAt: number = Date.now();
  
  /** Счетчики для статистики */
  private totalAcquired: number = 0;
  private totalRejected: number = 0;
  
  /** Singleton instance */
  private static instance: AudioElementPool | null = null;

  /**
   * Private constructor для Singleton pattern
   * @param maxSize - Максимальный размер пула (по умолчанию 6 для iOS)
   */
  private constructor(maxSize?: number) {
    if (maxSize !== undefined && maxSize > 0) {
      this.maxSize = maxSize;
    }
    logger.info(`AudioElementPool initialized with max size: ${this.maxSize}`);
  }

  /**
   * Получить singleton instance пула
   * @param maxSize - Опциональный размер пула (только при первом вызове)
   */
  public static getInstance(maxSize?: number): AudioElementPool {
    if (!AudioElementPool.instance) {
      AudioElementPool.instance = new AudioElementPool(maxSize);
    }
    return AudioElementPool.instance;
  }

  /**
   * Получить audio элемент из пула
   * 
   * @param id - Уникальный идентификатор (stem ID, track ID, etc.)
   * @param priority - Приоритет элемента (для приоритизации при нехватке ресурсов)
   * @returns HTMLAudioElement или null если лимит достигнут
   * 
   * @example
   * ```typescript
   * const audio = audioElementPool.acquire('stem-vocals', AudioPriority.HIGH);
   * if (!audio) {
   *   console.warn('Audio pool limit reached');
   *   return;
   * }
   * audio.src = stemUrl;
   * audio.play();
   * ```
   */
  public acquire(id: string, priority: AudioPriority = AudioPriority.MEDIUM): HTMLAudioElement | null {
    // Если уже есть активный элемент для этого ID - вернуть его
    const existing = this.active.get(id);
    if (existing) {
      existing.lastUsedAt = Date.now();
      logger.debug(`AudioElementPool: Reusing existing element for ${id}`);
      return existing.element;
    }

    // Попытка получить элемент из пула
    let element = this.pool.pop();

    // Если пул пустой и не достигнут лимит - создать новый
    if (!element && this.active.size < this.maxSize) {
      element = this.createAudioElement();
      logger.debug(`AudioElementPool: Created new element (${this.active.size + 1}/${this.maxSize})`);
    }

    // Если лимит достигнут - попытка освободить элемент с низким приоритетом
    if (!element) {
      element = this.evictLowPriorityElement(priority) ?? undefined;
      if (element) {
        logger.warn(`AudioElementPool: Evicted low priority element for ${id}`);
      }
    }

    // Если все еще нет элемента - отказ
    if (!element) {
      this.totalRejected++;
      logger.error(`AudioElementPool: Limit reached (${this.maxSize}). Cannot acquire for ${id}`);
      return null;
    }

    // Регистрация активного элемента
    this.active.set(id, {
      element,
      id,
      priority,
      acquiredAt: Date.now(),
      lastUsedAt: Date.now(),
    });

    this.totalAcquired++;
    return element;
  }

  /**
   * Вернуть audio элемент в пул
   * 
   * @param id - Идентификатор элемента
   * 
   * @example
   * ```typescript
   * // При остановке или unmount компонента
   * audioElementPool.release('stem-vocals');
   * ```
   */
  public release(id: string): void {
    const activeElement = this.active.get(id);
    if (!activeElement) {
      logger.warn(`AudioElementPool: Attempt to release non-existent element ${id}`);
      return;
    }

    const { element } = activeElement;

    // Очистка элемента
    this.cleanupElement(element);

    // Удаление из активных
    this.active.delete(id);

    // Возврат в пул
    this.pool.push(element);

    logger.debug(`AudioElementPool: Released element ${id} (${this.active.size}/${this.maxSize} active)`);
  }

  /**
   * Обновить приоритет активного элемента
   * Полезно когда пользователь фокусируется на определенном стеме
   * 
   * @param id - Идентификатор элемента
   * @param priority - Новый приоритет
   */
  public updatePriority(id: string, priority: AudioPriority): void {
    const activeElement = this.active.get(id);
    if (activeElement) {
      activeElement.priority = priority;
      activeElement.lastUsedAt = Date.now();
      logger.debug(`AudioElementPool: Updated priority for ${id} to ${priority}`);
    }
  }

  /**
   * Получить статистику использования пула
   * Полезно для мониторинга и отладки
   * 
   * @returns PoolStats - статистика пула
   */
  public getStats(): PoolStats {
    return {
      available: this.pool.length,
      active: this.active.size,
      capacity: this.maxSize,
      totalAcquired: this.totalAcquired,
      totalRejected: this.totalRejected,
      uptime: Date.now() - this.createdAt,
    };
  }

  /**
   * Получить список активных элементов с метаданными
   * Полезно для debug UI
   */
  public getActiveElements(): Array<{ id: string; priority: AudioPriority; age: number }> {
    const now = Date.now();
    return Array.from(this.active.values()).map(({ id, priority, acquiredAt }) => ({
      id,
      priority,
      age: now - acquiredAt,
    }));
  }

  /**
   * Освободить все активные элементы
   * Используется при cleanup компонента или unmount приложения
   */
  public releaseAll(): void {
    logger.info(`AudioElementPool: Releasing all ${this.active.size} active elements`);
    
    this.active.forEach((activeElement) => {
      this.cleanupElement(activeElement.element);
    });
    
    this.active.clear();
    this.pool = [];
    
    logger.debug('AudioElementPool: All elements released');
  }

  /**
   * Создать новый audio элемент с оптимальными настройками
   * @private
   */
  private createAudioElement(): HTMLAudioElement {
    const audio = new Audio();
    
    // Оптимизация для мобильных устройств
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous'; // Для Web Audio API
    
    return audio;
  }

  /**
   * Очистить audio элемент перед возвратом в пул
   * @private
   */
  private cleanupElement(element: HTMLAudioElement): void {
    // Остановить воспроизведение
    element.pause();
    element.currentTime = 0;
    
    // Очистить source
    element.src = '';
    
    // Удалить event listeners (если были добавлены)
    element.onended = null;
    element.onerror = null;
    element.onloadeddata = null;
    element.oncanplay = null;
    element.ontimeupdate = null;
  }

  /**
   * Попытка освободить элемент с низким приоритетом
   * Используется когда достигнут лимит и нужен новый элемент с высоким приоритетом
   * 
   * @param requestedPriority - Приоритет запрашиваемого элемента
   * @returns HTMLAudioElement или null
   * @private
   */
  private evictLowPriorityElement(requestedPriority: AudioPriority): HTMLAudioElement | null {
    // Ищем активный элемент с приоритетом ниже запрашиваемого
    let lowestPriorityId: string | null = null;
    let lowestPriority: AudioPriority = AudioPriority.HIGH;
    let oldestLastUsed: number = Date.now();

    this.active.forEach((activeElement, id) => {
      // Кандидат если:
      // 1. Приоритет ниже запрашиваемого
      // 2. Среди кандидатов выбираем с самым низким приоритетом
      // 3. При равном приоритете - самый давно использованный
      if (activeElement.priority < requestedPriority) {
        if (
          activeElement.priority < lowestPriority ||
          (activeElement.priority === lowestPriority && activeElement.lastUsedAt < oldestLastUsed)
        ) {
          lowestPriorityId = id;
          lowestPriority = activeElement.priority;
          oldestLastUsed = activeElement.lastUsedAt;
        }
      }
    });

    // Если нашли кандидата - освободить его
    if (lowestPriorityId) {
      const evicted = this.active.get(lowestPriorityId);
      if (evicted) {
        this.cleanupElement(evicted.element);
        this.active.delete(lowestPriorityId);
        return evicted.element;
      }
    }

    return null;
  }
  
  /**
   * Get priority recommendations based on stem type
   * Helper method for determining appropriate priority
   * 
   * @param stemType - Type of audio stem
   * @returns Recommended priority level
   */
  public static getPriorityForStemType(stemType: string): AudioPriority {
    const type = stemType.toLowerCase();
    
    // High priority: vocals, lead instruments
    if (type.includes('vocal') || 
        type.includes('lead') || 
        type.includes('main') ||
        type.includes('melody')) {
      return AudioPriority.HIGH;
    }
    
    // Medium priority: rhythm section
    if (type.includes('bass') || 
        type.includes('drum') ||
        type.includes('rhythm') ||
        type.includes('guitar')) {
      return AudioPriority.MEDIUM;
    }
    
    // Low priority: ambient, fx, other
    return AudioPriority.LOW;
  }
}

/**
 * Singleton instance для использования в приложении
 * 
 * @example
 * ```typescript
 * import { audioElementPool, AudioPriority } from '@/lib/audioElementPool';
 * 
 * // Получить элемент
 * const audio = audioElementPool.acquire('stem-vocals', AudioPriority.HIGH);
 * if (audio) {
 *   audio.src = url;
 *   audio.play();
 * }
 * 
 * // Освободить элемент
 * audioElementPool.release('stem-vocals');
 * 
 * // Получить статистику
 * const stats = audioElementPool.getStats();
 * console.log(`Active: ${stats.active}/${stats.capacity}`);
 * ```
 */
export const audioElementPool = AudioElementPool.getInstance();

// Export class for testing and static methods
export { AudioElementPool };

/**
 * Hook для React компонентов
 * Автоматически освобождает элемент при unmount
 * 
 * @param id - Уникальный идентификатор
 * @param priority - Приоритет элемента
 * @returns HTMLAudioElement или null
 * 
 * @example
 * ```typescript
 * function StemPlayer({ stemId, stemUrl }: Props) {
 *   const audioElement = useAudioElement(stemId, AudioPriority.HIGH);
 *   
 *   useEffect(() => {
 *     if (audioElement) {
 *       audioElement.src = stemUrl;
 *     }
 *   }, [audioElement, stemUrl]);
 *   
 *   const play = () => audioElement?.play();
 *   
 *   return <button onClick={play}>Play</button>;
 * }
 * ```
 */
export function useAudioElement(
  id: string,
  priority: AudioPriority = AudioPriority.MEDIUM
): HTMLAudioElement | null {
  const [element, setElement] = React.useState<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const audio = audioElementPool.acquire(id, priority);
    setElement(audio);

    return () => {
      audioElementPool.release(id);
    };
  }, [id, priority]);

  return element;
}

// Import React for hook
import React from 'react';
