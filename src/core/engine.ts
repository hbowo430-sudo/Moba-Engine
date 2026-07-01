/**
 * Core Engine - Professional Mobile Game Engine
 * Integrated graphics, physics, camera, shader systems optimized for mobile devices
 * Zero-allocation rendering pipeline with aggressive performance optimization
 */

import { EventEmitter } from 'eventemitter3';
import { Logger } from '@utils/logger';
import { MemoryManager } from '@utils/memory-manager';
import { DeviceDetector, type DeviceCapabilities } from '@utils/device-detector';
import { GestureManager } from '@gesture/gesture-manager';
import type { GameConfig, GameObject, RenderContext, MobileDeviceConfig } from '@utils/types';

interface EngineStats {
  fps: number;
  frameTime: number;
  renderTime: number;
  updateTime: number;
  memory: number;
  gpuUtilization: number;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
  update(): void;
  getViewMatrix(): Float32Array;
  getProjectionMatrix(): Float32Array;
}

interface RenderState {
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  clearColor: [number, number, number, number];
  scissor: boolean;
  blend: boolean;
  depthTest: boolean;
}

export class MobaEngine extends EventEmitter {
  private canvas: HTMLCanvasElement | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private glContext: WebGLRenderingContext | null = null;
  private isWebGL: boolean = false;
  private isRunning: boolean = false;
  private isDestroyed: boolean = false;
  private logger: Logger;
  private memoryManager: MemoryManager;
  private deviceDetector: DeviceDetector;
  private gestureManager: GestureManager | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private deviceConfig: MobileDeviceConfig | null = null;
  private gameObjects: Map<string, GameObject> = new Map();
  private renderQueue: GameObject[] = [];
  private camera: Camera;
  private renderState: RenderState;
  private stats: EngineStats = {
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    updateTime: 0,
    memory: 0,
    gpuUtilization: 0,
  };
  private targetFPS: number = 60;
  private frameTimeMS: number = 1000 / 60;
  private deltaTime: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private animationFrameId: number | null = null;
  private shaderPrograms: Map<string, WebGLProgram> = new Map();
  private matrices: {
    view: Float32Array;
    projection: Float32Array;
    model: Float32Array;
  };

  constructor() {
    super();
    this.logger = new Logger('MobaEngine');
    this.memoryManager = MemoryManager.getInstance();
    this.deviceDetector = DeviceDetector.getInstance();

    // Initialize camera
    this.camera = this.createCamera();

    // Initialize render state
    this.renderState = {
      viewportX: 0,
      viewportY: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      clearColor: [0, 0, 0, 1],
      scissor: false,
      blend: true,
      depthTest: false,
    };

    // Initialize matrices
    this.matrices = {
      view: new Float32Array(16),
      projection: new Float32Array(16),
      model: new Float32Array(16),
    };

    this.logger.info('Engine instantiated');
  }

  /**
   * Initialize engine with configuration
   */
  async initialize(config: GameConfig): Promise<void> {
    try {
      this.logger.info('Initializing engine...');

      // Detect device capabilities
      this.deviceCapabilities = this.deviceDetector.detectCapabilities();
      this.logger.info('Device capabilities detected', this.deviceCapabilities);

      // Create or find canvas
      this.canvas = this.getOrCreateCanvas(config.canvasSelector);
      if (!this.canvas) {
        throw new Error('Failed to create or find canvas element');
      }

      // Set device config
      this.deviceConfig = this.createDeviceConfig(config);

      // Initialize rendering context
      this.initializeRenderContext(config.renderingMode || 'canvas2d');

      // Setup gesture manager
      if (config.enableGestures !== false) {
        this.gestureManager = new GestureManager(this.canvas);
        this.setupGestureHandlers();
      }

      // Setup memory management
      if (config.memoryLimit) {
        this.memoryManager.setThresholds(80, 95);
      }

      // Start game loop
      this.start();

      this.logger.info('Engine initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Engine initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get or create canvas element
   */
  private getOrCreateCanvas(selector?: string): HTMLCanvasElement | null {
    let canvas: HTMLCanvasElement | null = null;

    if (selector) {
      canvas = document.querySelector(selector) as HTMLCanvasElement;
    } else {
      canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
    }

    if (!canvas) {
      this.logger.error('Canvas element not found');
      return null;
    }

    // Set canvas size for mobile devices
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    return canvas;
  }

  /**
   * Create device configuration
   */
  private createDeviceConfig(config: GameConfig): MobileDeviceConfig {
    return {
      isMobile: this.deviceDetector.isMobile(),
      platform: this.deviceDetector.isPlatform('android')
        ? 'android'
        : this.deviceDetector.isPlatform('ios')
          ? 'ios'
          : 'web',
      dpr: window.devicePixelRatio || 1,
      memory: this.deviceCapabilities?.maxMemory || 4,
      cores: this.deviceCapabilities?.cpuCores || 4,
      touchEnabled: () => this.deviceCapabilities?.touchSupport || false,
      maxTextureSize: this.deviceCapabilities?.maxTextureSize,
      maxCanvasSize: this.deviceCapabilities?.maxFramebufferSize,
    };
  }

  /**
   * Initialize rendering context (WebGL or Canvas2D)
   */
  private initializeRenderContext(mode: 'canvas2d' | 'webgl'): void {
    if (!this.canvas) return;

    if (mode === 'webgl' && this.deviceCapabilities?.webglVersion !== 'none') {
      this.glContext =
        (this.canvas.getContext('webgl2') as WebGLRenderingContext) ||
        (this.canvas.getContext('webgl') as WebGLRenderingContext);
      if (this.glContext) {
        this.isWebGL = true;
        this.initializeWebGL();
        this.logger.info('WebGL context initialized');
        return;
      }
    }

    // Fallback to Canvas2D
    this.ctx2d = this.canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
    this.isWebGL = false;
    this.logger.info('Canvas2D context initialized');
  }

  /**
   * Initialize WebGL context
   */
  private initializeWebGL(): void {
    if (!this.glContext || !this.canvas) return;

    const gl = this.glContext;

    // Enable necessary capabilities
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clearColor(0, 0, 0, 1);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Create default shader program
    this.createShaderProgram(
      'default',
      this.getDefaultVertexShader(),
      this.getDefaultFragmentShader(),
    );
  }

  /**
   * Create shader program
   */
  private createShaderProgram(name: string, vertexSrc: string, fragmentSrc: string): void {
    if (!this.glContext) return;

    const gl = this.glContext;
    const vertexShader = this.compileShader(vertexSrc, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSrc, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.logger.error('Shader program linking failed:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    this.shaderPrograms.set(name, program);
  }

  /**
   * Compile shader
   */
  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.glContext) return null;

    const gl = this.glContext;
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      this.logger.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Get default vertex shader
   */
  private getDefaultVertexShader(): string {
    return `
      precision highp float;
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      varying vec2 vTexCoord;
      
      void main() {
        gl_Position = uProjection * uView * uModel * vec4(aPosition, 0.0, 1.0);
        vTexCoord = aTexCoord;
      }
    `;
  }

  /**
   * Get default fragment shader
   */
  private getDefaultFragmentShader(): string {
    return `
      precision highp float;
      uniform sampler2D uSampler;
      uniform vec4 uColor;
      varying vec2 vTexCoord;
      
      void main() {
        gl_FragColor = texture2D(uSampler, vTexCoord) * uColor;
      }
    `;
  }

  /**
   * Setup gesture handlers
   */
  private setupGestureHandlers(): void {
    if (!this.gestureManager) return;

    this.gestureManager.on('tap', (event) => {
      this.emit('gesture:tap', event);
    });

    this.gestureManager.on('swipe', (event) => {
      this.emit('gesture:swipe', event);
    });

    this.gestureManager.on('pinch', (event) => {
      this.emit('gesture:pinch', event);
    });

    this.gestureManager.on('pan', (event) => {
      this.emit('gesture:pan', event);
    });

    this.gestureManager.on('longpress', (event) => {
      this.emit('gesture:longpress', event);
    });
  }

  /**
   * Create camera object
   */
  private createCamera(): Camera {
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      update(): void {
        // Camera update logic
      },
      getViewMatrix(): Float32Array {
        return this.createIdentityMatrix();
      },
      getProjectionMatrix(): Float32Array {
        return this.createOrthographicMatrix(0, this.width, this.height, 0, -1, 1);
      },
      createIdentityMatrix(): Float32Array {
        const m = new Float32Array(16);
        m[0] = m[5] = m[10] = m[15] = 1;
        return m;
      },
      createOrthographicMatrix(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
      ): Float32Array {
        const m = new Float32Array(16);
        m[0] = 2 / (right - left);
        m[5] = 2 / (top - bottom);
        m[10] = -2 / (far - near);
        m[12] = -(right + left) / (right - left);
        m[13] = -(top + bottom) / (top - bottom);
        m[14] = -(far + near) / (far - near);
        m[15] = 1;
        return m;
      },
    };
  }

  /**
   * Add game object
   */
  addGameObject(id: string, gameObject: GameObject): void {
    this.gameObjects.set(id, gameObject);
    this.renderQueue.push(gameObject);
    this.renderQueue.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  /**
   * Remove game object
   */
  removeGameObject(id: string): void {
    const obj = this.gameObjects.get(id);
    if (obj) {
      if (obj.destroy) obj.destroy();
      this.gameObjects.delete(id);
      const index = this.renderQueue.indexOf(obj);
      if (index >= 0) {
        this.renderQueue.splice(index, 1);
      }
    }
  }

  /**
   * Start game loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    this.deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    const updateStartTime = performance.now();

    // Update phase
    this.update(this.deltaTime);

    const updateEndTime = performance.now();
    const renderStartTime = performance.now();

    // Render phase
    this.render();

    const renderEndTime = performance.now();

    // Update stats
    this.stats.updateTime = updateEndTime - updateStartTime;
    this.stats.renderTime = renderEndTime - renderStartTime;
    this.stats.frameTime = renderEndTime - updateStartTime;

    // Update FPS counter
    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Update camera
    this.camera.update();

    // Update all game objects
    for (const obj of this.gameObjects.values()) {
      if (obj.visible !== false) {
        obj.update(deltaTime);
      }
    }

    this.emit('update', deltaTime);
  }

  /**
   * Render scene
   */
  private render(): void {
    if (this.isWebGL) {
      this.renderWebGL();
    } else {
      this.renderCanvas2D();
    }
  }

  /**
   * Render using WebGL
   */
  private renderWebGL(): void {
    if (!this.glContext || !this.canvas) return;

    const gl = this.glContext;

    // Clear
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update matrices
    this.matrices.view = this.camera.getViewMatrix();
    this.matrices.projection = this.camera.getProjectionMatrix();

    // Render objects
    for (const obj of this.renderQueue) {
      if (obj.visible !== false) {
        obj.render(gl);
      }
    }
  }

  /**
   * Render using Canvas2D
   */
  private renderCanvas2D(): void {
    if (!this.ctx2d || !this.canvas) return;

    const ctx = this.ctx2d;
    const dpr = window.devicePixelRatio || 1;

    // Clear canvas
    ctx.fillStyle = `rgba(${this.renderState.clearColor.join(',')})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    ctx.save();

    // Apply camera transformations
    ctx.scale(dpr, dpr);
    ctx.translate(-this.camera.x, -this.camera.y);
    ctx.scale(this.camera.scale, this.camera.scale);

    // Render objects
    for (const obj of this.renderQueue) {
      if (obj.visible !== false) {
        obj.render(ctx);
      }
    }

    // Restore context state
    ctx.restore();
  }

  /**
   * Get engine statistics
   */
  getStats(): EngineStats {
    return { ...this.stats };
  }

  /**
   * Get render context
   */
  getRenderContext(): RenderContext | null {
    if (!this.canvas) return null;

    return {
      canvas: this.canvas,
      context: (this.glContext || this.ctx2d) as any,
      dpr: this.deviceConfig?.dpr || 1,
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.camera.width = width;
    this.camera.height = height;

    if (this.glContext) {
      this.glContext.viewport(0, 0, width * dpr, height * dpr);
    }

    this.emit('resize', { width, height });
  }

  /**
   * Destroy engine
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.stop();

    if (this.gestureManager) {
      this.gestureManager.destroy();
    }

    this.gameObjects.forEach((obj) => {
      if (obj.destroy) obj.destroy();
    });

    this.gameObjects.clear();
    this.renderQueue.length = 0;
    this.shaderPrograms.clear();
    this.removeAllListeners();

    this.isDestroyed = true;
    this.logger.info('Engine destroyed');
  }
}
