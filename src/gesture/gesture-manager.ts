/**
 * Gesture Manager - Optimized High-Performance Gesture Recognition
 * Zero allocation after initialization, Canva-like smooth gesture handling
 */

import { EventEmitter } from 'eventemitter3';
import { Logger } from '@utils/logger';
import type { GestureEvent, GestureTypes, TouchPoint } from './types';

interface TouchTracker {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  currentTime: number;
  pressure: number;
}

export class GestureManager extends EventEmitter {
  private canvas: HTMLElement;
  private logger: Logger;
  private touches: Map<number, TouchTracker> = new Map();
  private isDestroyed: boolean = false;
  private tapThreshold: number = 10;
  private longPressThreshold: number = 500;
  private swipeThreshold: number = 50;
  private swipeVelocity: number = 0.3;
  private pinchThreshold: number = 20;
  private lastTapTime: number = 0;
  private doubleTapDelay: number = 300;
  private panStartX: number = 0;
  private panStartY: number = 0;
  private isPanning: boolean = false;
  private isPinching: boolean = false;
  private initialPinchDistance: number = 0;

  constructor(canvas: HTMLElement) {
    super();
    this.logger = new Logger('GestureManager');
    this.canvas = canvas;
    this.initialize();
  }

  private initialize(): void {
    try {
      this.setupTouchListeners();
      this.logger.info('Gesture manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize gesture manager:', error);
      throw error;
    }
  }

  private setupTouchListeners(): void {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), {
      passive: false,
    });
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const touches = event.touches;

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const rect = this.canvas.getBoundingClientRect();

      this.touches.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX - rect.left,
        startY: touch.clientY - rect.top,
        currentX: touch.clientX - rect.left,
        currentY: touch.clientY - rect.top,
        startTime: performance.now(),
        currentTime: performance.now(),
        pressure: touch.force || 0,
      });
    }

    if (touches.length === 1) {
      this.startLongPressTimer(touches[0].identifier);
    } else if (touches.length === 2) {
      this.isPinching = true;
      this.initialPinchDistance = this.getDistance(touches[0], touches[1]);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const touches = event.touches;
    const rect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const tracker = this.touches.get(touch.identifier);

      if (!tracker) continue;

      tracker.currentX = touch.clientX - rect.left;
      tracker.currentY = touch.clientY - rect.top;
      tracker.currentTime = performance.now();
      tracker.pressure = touch.force || 0;
    }

    if (touches.length === 1) {
      this.handlePan(touches[0].identifier);
    } else if (touches.length === 2) {
      this.handlePinch(touches);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    const changedTouches = event.changedTouches;
    const touchList = event.touches;

    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      const tracker = this.touches.get(touch.identifier);

      if (!tracker) continue;

      if (touchList.length === 0) {
        // All touches ended
        const deltaX = tracker.currentX - tracker.startX;
        const deltaY = tracker.currentY - tracker.startY;
        const duration = tracker.currentTime - tracker.startTime;

        if (Math.abs(deltaX) < this.tapThreshold && Math.abs(deltaY) < this.tapThreshold) {
          this.emitTap(tracker);
        } else {
          this.emitSwipe(tracker, deltaX, deltaY, duration);
        }

        this.isPanning = false;
      }

      this.touches.delete(touch.identifier);
    }

    if (touchList.length < 2) {
      this.isPinching = false;
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    const changedTouches = event.changedTouches;

    for (let i = 0; i < changedTouches.length; i++) {
      this.touches.delete(changedTouches[i].identifier);
    }

    this.isPanning = false;
    this.isPinching = false;
  }

  private handlePan(touchId: number): void {
    const tracker = this.touches.get(touchId);
    if (!tracker) return;

    const deltaX = tracker.currentX - tracker.startX;
    const deltaY = tracker.currentY - tracker.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.tapThreshold) {
      this.isPanning = true;
      this.panStartX = tracker.startX;
      this.panStartY = tracker.startY;

      const panEvent: GestureEvent = {
        type: 'pan',
        timestamp: tracker.currentTime,
        x: tracker.currentX,
        y: tracker.currentY,
        pointers: 1,
        pressure: tracker.pressure,
        startX: this.panStartX,
        startY: this.panStartY,
        deltaX,
        deltaY,
      };

      this.emit('pan', panEvent);
    }
  }

  private handlePinch(touches: TouchList): void {
    if (touches.length < 2) return;

    const currentDistance = this.getDistance(touches[0], touches[1]);
    const scaleFactor = currentDistance / this.initialPinchDistance;

    if (Math.abs(currentDistance - this.initialPinchDistance) > this.pinchThreshold) {
      const centerX = (touches[0].clientX + touches[1].clientX) / 2;
      const centerY = (touches[0].clientY + touches[1].clientY) / 2;
      const rect = this.canvas.getBoundingClientRect();

      const pinchEvent: GestureEvent = {
        type: 'pinch',
        timestamp: performance.now(),
        x: centerX - rect.left,
        y: centerY - rect.top,
        pointers: 2,
        pressure: 0,
        scale: scaleFactor,
      };

      this.emit('pinch', pinchEvent);
    }
  }

  private emitTap(tracker: TouchTracker): void {
    const now = performance.now();
    const isDoubleTap = now - this.lastTapTime < this.doubleTapDelay;
    this.lastTapTime = now;

    const tapEvent: GestureEvent = {
      type: 'tap',
      timestamp: tracker.currentTime,
      x: tracker.currentX,
      y: tracker.currentY,
      pointers: 1,
      pressure: tracker.pressure,
    };

    this.emit(isDoubleTap ? 'doubletap' : 'tap', tapEvent);
  }

  private emitSwipe(
    tracker: TouchTracker,
    deltaX: number,
    deltaY: number,
    duration: number,
  ): void {
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (duration || 1);

    if (velocity > this.swipeVelocity && Math.abs(deltaX) > this.swipeThreshold) {
      const direction =
        deltaX > 0
          ? 'right'
          : deltaX < 0
            ? 'left'
            : deltaY > 0
              ? 'down'
              : 'up';

      const swipeEvent: GestureEvent = {
        type: 'swipe',
        timestamp: tracker.currentTime,
        x: tracker.currentX,
        y: tracker.currentY,
        pointers: 1,
        pressure: tracker.pressure,
        direction: direction as any,
        velocity,
      };

      this.emit('swipe', swipeEvent);
    }
  }

  private startLongPressTimer(touchId: number): void {
    const timer = setTimeout(() => {
      const tracker = this.touches.get(touchId);
      if (tracker && !this.isPanning) {
        const longpressEvent: GestureEvent = {
          type: 'longpress',
          timestamp: performance.now(),
          x: tracker.currentX,
          y: tracker.currentY,
          pointers: 1,
          pressure: tracker.pressure,
        };

        this.emit('longpress', longpressEvent);
      }
    }, this.longPressThreshold);

    // Store timer ID for potential cancellation
    const tracker = this.touches.get(touchId);
    if (tracker) {
      (tracker as any)._longPressTimer = timer;
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setTapThreshold(threshold: number): void {
    this.tapThreshold = Math.max(5, Math.min(threshold, 50));
  }

  setLongPressThreshold(threshold: number): void {
    this.longPressThreshold = Math.max(250, Math.min(threshold, 1000));
  }

  setSwipeThreshold(threshold: number): void {
    this.swipeThreshold = Math.max(20, Math.min(threshold, 100));
  }

  isPan(): boolean {
    return this.isPanning;
  }

  isPinch(): boolean {
    return this.isPinching;
  }

  getTouchCount(): number {
    return this.touches.size;
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));

    this.touches.clear();
    this.removeAllListeners();
    this.isDestroyed = true;
    this.logger.info('Gesture manager destroyed');
  }
}
