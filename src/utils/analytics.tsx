/**
 * Type definition for event properties
 */
export type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Interface for analytics providers
 */
interface AnalyticsProvider {
  trackEvent: (eventName: string, properties?: EventProperties) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (pageName?: string, properties?: EventProperties) => void;
}

/**
 * Optional configuration for the analytics system
 */
interface AnalyticsConfig {
  /** Whether analytics tracking is enabled */
  enabled: boolean;
  /** Environment (development, staging, production) */
  environment: string;
  /** Application version */
  appVersion?: string;
}

// Default configuration
const defaultConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
};

// Global configuration
let config: AnalyticsConfig = { ...defaultConfig };

// Array of analytics providers (like Google Analytics, Mixpanel, etc.)
const providers: AnalyticsProvider[] = [];

/**
 * Initializes the analytics system with the provided configuration
 * 
 * @param userConfig - Custom configuration options
 */
export const initAnalytics = (userConfig: Partial<AnalyticsConfig> = {}): void => {
  config = {
    ...defaultConfig,
    ...userConfig,
  };
  
  // Initialize providers based on environment
  if (typeof window !== 'undefined') {
    // Add analytics providers here
    // Example: setupGoogleAnalytics();
    // Example: setupMixpanel();
  }
};

/**
 * Registers an analytics provider with the system
 * 
 * @param provider - The analytics provider to register
 */
export const registerProvider = (provider: AnalyticsProvider): void => {
  providers.push(provider);
};

/**
 * Tracks an event with the registered analytics providers
 * 
 * @param eventName - Name of the event to track
 * @param properties - Properties associated with the event
 */
export const trackEvent = (eventName: string, properties: EventProperties = {}): void => {
  if (!config.enabled) return;
  
  try {
    // Add common properties
    const enrichedProperties = {
      ...properties,
      environment: config.environment,
      appVersion: config.appVersion,
      timestamp: new Date().toISOString(),
    };
    
    // Track with all registered providers
    providers.forEach(provider => {
      provider.trackEvent(eventName, enrichedProperties);
    });
    
    // Log events in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${eventName}`, enrichedProperties);
    }
  } catch (error) {
    // Silently catch errors to prevent analytics from breaking the app
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Error tracking event:', error);
    }
  }
};

/**
 * Identifies a user with the registered analytics providers
 * 
 * @param userId - The user's unique identifier
 * @param traits - User traits or properties
 */
export const identifyUser = (userId: string, traits: Record<string, any> = {}): void => {
  if (!config.enabled) return;
  
  try {
    providers.forEach(provider => {
      provider.identify(userId, traits);
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Error identifying user:', error);
    }
  }
};

/**
 * Tracks a page view with the registered analytics providers
 * 
 * @param pageName - Name of the page being viewed
 * @param properties - Additional properties for the page view
 */
export const trackPageView = (pageName?: string, properties: EventProperties = {}): void => {
  if (!config.enabled) return;
  
  try {
    const enrichedProperties = {
      ...properties,
      url: typeof window !== 'undefined' ? window.location.href : '',
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      environment: config.environment,
      appVersion: config.appVersion,
      timestamp: new Date().toISOString(),
    };
    
    providers.forEach(provider => {
      provider.page(pageName, enrichedProperties);
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Page View: ${pageName || window.location.pathname}`, enrichedProperties);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Error tracking page view:', error);
    }
  }
};

/**
 * Enables or disables analytics tracking
 * 
 * @param enabled - Whether analytics should be enabled
 */
export const setAnalyticsEnabled = (enabled: boolean): void => {
  config.enabled = enabled;
};

/**
 * Checks if analytics tracking is currently enabled
 * 
 * @returns Whether analytics tracking is enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return config.enabled;
};