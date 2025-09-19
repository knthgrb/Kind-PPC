const environment = process.env.NODE_ENV;
const isDevelopment = environment === "development";
const isStaging = environment === "test";
const isProduction = environment === "production";

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

// Set log level based on environment
const getLogLevel = () => {
  if (isDevelopment) return LOG_LEVELS.DEBUG; // Show all logs
  if (isStaging) return LOG_LEVELS.INFO; // Show info and above
  if (isProduction) return LOG_LEVELS.WARN; // Show warn and error only
  return LOG_LEVELS.ERROR; // Default to error only
};

const currentLogLevel = getLogLevel();

export const logger = {
  error: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(...args);
    }
  },
  // Keep the old 'log' method for backward compatibility
  log: (...args: any[]) => {
    logger.debug(...args);
  },
};
