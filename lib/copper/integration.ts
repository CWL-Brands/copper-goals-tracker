import { CopperContext, CopperActivity } from '@/types';

declare global {
  interface Window {
    Copper: any;
    copperSdk: any;
  }
}

class CopperIntegration {
  private sdk: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private context: CopperContext | null = null;

  constructor() {
    // Auto-initialize only when in iframe AND required params exist
    if (typeof window !== 'undefined') {
      try {
        const isInIframe = window.self !== window.top;
        const params = new URLSearchParams(window.location.search);
        const parentOrigin = params.get('parentOrigin') || params.get('origin');
        const hasParams = !!(parentOrigin && params.get('instanceId'));
        
        if (isInIframe && hasParams) {
          this.init();
        }
        // If not in iframe or missing params, initialization will happen later if needed
      } catch {
        // Cross-origin iframe checks might fail, skip initialization
      }
    }
  }

  /**
   * Initialize Copper SDK
   */
  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Check if we're in Copper iframe with required params
      let isInIframe = false;
      try { 
        isInIframe = window.self !== window.top; 
      } catch { 
        isInIframe = true; 
      }
      
      const params = new URLSearchParams(window.location.search);
      const parentOrigin = params.get('parentOrigin') || params.get('origin');
      const hasParams = !!(parentOrigin && params.get('instanceId'));

      if (!isInIframe) {
        console.log('Not in Copper iframe, skipping SDK initialization');
        resolve();
        return;
      }
      
      if (!hasParams) {
        console.warn('Copper SDK initialization skipped: missing origin/instanceId');
        resolve();
        return;
      }

      // Load Copper SDK script
      const script = document.createElement('script');
      script.src = process.env.NEXT_PUBLIC_COPPER_SDK_URL ||
                   'https://cdn.jsdelivr.net/npm/copper-sdk@latest/dist/copper-sdk.min.js';

      script.onload = () => {
        this.initializeSdk()
          .then(() => resolve())
          .catch(reject);
      };

      script.onerror = () => {
        console.error('Failed to load Copper SDK');
        reject(new Error('Failed to load Copper SDK'));
      };

      document.head.appendChild(script);
    });

    return this.initPromise;
  }

  /**
   * Initialize SDK after script loads
   */
  private async initializeSdk(): Promise<void> {
    // Wait for Copper SDK to be available
    let attempts = 0;
    const maxAttempts = 20;

    while (!window.Copper && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.Copper) {
      throw new Error('Copper SDK not available');
    }

    try {
      // Initialize SDK
      this.sdk = window.Copper.init();
      this.isInitialized = true;
      console.log(' Copper SDK initialized');

      // Get initial context
      await this.refreshContext();

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize Copper SDK:', error);
      throw error;
    }
  }

  /**
   * Setup SDK event listeners
   */
  private setupEventListeners(): void {
    if (!this.sdk) return;

    // Listen for context changes
    this.sdk.on('contextUpdated', async (context: any) => {
      console.log('Copper context updated:', context);
      await this.refreshContext();
    });

    // Listen for navigation events
    this.sdk.on('navigate', (data: any) => {
      console.log('Copper navigation:', data);
    });
  }

  /**
   * Get current Copper context
   */
  async getContext(): Promise<CopperContext | null> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.sdk) {
      return null;
    }

    try {
      const data = await this.sdk.getContext();
      
      if (data && data.context && data.context.entity) {
        this.context = {
          type: data.type,
          id: data.context.entity.id,
          name: data.context.entity.name || data.context.entity.company_name,
          email: data.context.entity.email,
          phone: data.context.entity.phone_number,
          customFields: data.context.entity.custom_fields
        };
        return this.context;
      }
    } catch (error) {
      console.error('Failed to get Copper context:', error);
    }

    return null;
  }

  /**
   * Refresh context from Copper
   */
  async refreshContext(): Promise<void> {
    await this.getContext();
  }

  /**
   * Open modal in Copper
   */
  async openModal(params?: Record<string, any>): Promise<void> {
    if (!this.sdk) {
      console.error('Copper SDK not initialized');
      return;
    }

    try {
      await this.sdk.showModal({
        width: 900,
        height: 700,
        ...params
      });
    } catch (error) {
      console.error('Failed to open modal:', error);
    }
  }

  /**
   * Close modal
   */
  async closeModal(): Promise<void> {
    if (!this.sdk) return;

    try {
      await this.sdk.closeModal();
    } catch (error) {
      console.error('Failed to close modal:', error);
    }
  }

  /**
   * Log activity in Copper
   */
  async logActivity(activity: CopperActivity): Promise<void> {
    if (!this.sdk) {
      console.error('Copper SDK not initialized');
      return;
    }

    try {
      await this.sdk.logActivity(0, {
        type: activity.type,
        details: activity.details,
        activity_date: activity.date.toISOString(),
        parent: {
          type: activity.parentType,
          id: activity.parentId
        }
      });
      console.log(' Activity logged in Copper');
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Navigate to entity in Copper
   */
  async navigateTo(entityType: string, entityId: string): Promise<void> {
    if (!this.sdk) return;

    try {
      await this.sdk.navigateToEntity(entityType, entityId);
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  }

  /**
   * Get user info from Copper
   */
  async getCurrentUser(): Promise<any> {
    if (!this.sdk) return null;

    try {
      const userInfo = await this.sdk.getUserInfo();
      return userInfo;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Check if running in Copper
   */
  isInCopper(): boolean {
    return window.self !== window.top && this.isInitialized;
  }

  /**
   * Get app location in Copper
   */
  getAppLocation(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('location') || 'unknown';
  }
}

// Export singleton instance
export const copperIntegration = new CopperIntegration();

// Export convenience functions
export const isInCopper = () => copperIntegration.isInCopper();
export const getCopperContext = () => copperIntegration.getContext();
export const logCopperActivity = (activity: CopperActivity) => copperIntegration.logActivity(activity);
