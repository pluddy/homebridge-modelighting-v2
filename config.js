// Configuration settings for Mode Lighting Homebridge Plugin

module.exports = {
  // HTTP request timeout in milliseconds
  REQUEST_TIMEOUT: 5000,

  // Maximum number of retry attempts for failed requests
  MAX_RETRIES: 10,

  // Delay between retry attempts in milliseconds
  RETRY_DELAY: 500,

  // NPU connection settings
  NPU: {
    // Default port (if needed in future)
    DEFAULT_PORT: 80,

    // XML-RPC endpoint
    RPC_ENDPOINT: '/xml-rpc?1',

    // Status dump endpoint template
    STATUS_ENDPOINT: '/xml-dump?nocrlf=true&what=status&where='
  },

  // Device information
  DEVICE_INFO: {
    MANUFACTURER: 'Mode Lighting',
    MODEL: 'NPU v1.3.2.1'
  },

  // Polling configuration for detecting external state changes
  POLLING: {
    // Fast polling interval after activity (milliseconds)
    FAST_INTERVAL: 2000,

    // Slow polling interval during idle (milliseconds)
    SLOW_INTERVAL: 30000,

    // How long to maintain fast polling after activity (milliseconds)
    FAST_DURATION: 60000
  }
};
