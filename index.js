// Homebridge Plugin for Mode Lighting System using Remote Control Interface

const axios = require('axios');
const parseXMLString = require('xml2js').parseString;
const config = require('./config');

// DMX (0-255) to Percentage (0-100) conversion lookup table
const dmx2pct = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 23, 23, 23, 24, 24, 24, 25, 25, 26, 26, 26, 27, 27, 28, 28, 28, 29, 29, 30, 30, 30, 31, 31, 32, 32, 32, 33, 33, 34, 34, 34, 35, 35, 36, 36, 36, 37, 37, 37, 38, 38, 38, 39, 39, 40, 40, 40, 41, 41, 42, 42, 42, 43, 43, 44, 44, 44, 45, 45, 46, 46, 46, 47, 47, 48, 48, 48, 49, 49, 49, 50, 50, 51, 51, 51, 52, 52, 53, 53, 53, 54, 54, 55, 55, 55, 56, 56, 57, 57, 57, 58, 58, 59, 59, 59, 60, 60, 61, 61, 61, 62, 62, 62, 63, 63, 63, 64, 64, 65, 65, 65, 66, 66, 67, 67, 67, 68, 68, 69, 69, 69, 70, 70, 71, 71, 71, 72, 72, 73, 73, 73, 74, 74, 74, 75, 75, 76, 76, 76, 77, 77, 78, 78, 79, 79, 79, 80, 80, 80, 81, 81, 82, 82, 82, 83, 83, 84, 84, 84, 85, 85, 86, 86, 86, 87, 87, 87, 88, 88, 88, 89, 89, 90, 90, 90, 91, 91, 92, 92, 92, 93, 93, 94, 94, 94, 95, 95, 96, 96, 96, 97, 97, 98, 98, 98, 99, 99, 100, 100];

// Percentage (0-100) to DMX (0-255) conversion lookup table
const pct2dmx = [0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40, 42, 45, 47, 50, 52, 55, 57, 60, 63, 65, 68, 70, 73, 75, 78, 80, 83, 85, 88, 90, 93, 96, 99, 101, 104, 106, 109, 111, 114, 116, 119, 121, 124, 127, 129, 132, 134, 137, 139, 142, 144, 147, 149, 152, 154, 157, 160, 163, 165, 168, 170, 173, 175, 178, 180, 183, 185, 188, 191, 193, 196, 198, 201, 203, 206, 208, 211, 213, 216, 218, 221, 224, 227, 229, 232, 234, 237, 239, 242, 244, 247, 249, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255];

let Service, Characteristic;

module.exports = function(homebridge) {
  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  // Register both platform and accessory
  homebridge.registerPlatform("homebridge-modelighting-v2", "ModelightingV2Platform", ModeLightingPlatform);
  homebridge.registerAccessory("homebridge-modelighting-v2", "ModelightingV2", ModeLightingAccessory);
};

// ============================================================================
// PLATFORM PLUGIN - Auto-discovers channels and scenes from NPU
// ============================================================================

function ModeLightingPlatform(log, config, api) {
  this.log = log;
  this.config = config;
  this.api = api;
  this.accessories = [];
  this.accessoryInstances = []; // Track all accessory instances for cleanup

  // Long-polling state
  this.longPollConnection = null;  // axios cancel token
  this.longPollActive = false;     // connection status
  this.isShuttingDown = false;     // shutdown flag

  // Validate required configuration
  if (!config.NPU_IP) {
    throw new Error('ModeLighting Platform: Missing required config field "NPU_IP"');
  }

  // Validate IP address format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(config.NPU_IP)) {
    throw new Error(`ModeLighting Platform: Invalid NPU_IP address format: "${config.NPU_IP}". Expected format: xxx.xxx.xxx.xxx`);
  }

  this.NPU_IP = config.NPU_IP;

  // Network settings with defaults
  this.requestTimeout = config.requestTimeout !== undefined
    ? Math.max(1000, Math.min(30000, parseInt(config.requestTimeout, 10)))
    : config.REQUEST_TIMEOUT || 5000;

  this.maxRetries = config.maxRetries !== undefined
    ? Math.max(0, Math.min(20, parseInt(config.maxRetries, 10)))
    : config.MAX_RETRIES || 10;

  this.retryDelay = config.retryDelay !== undefined
    ? Math.max(100, Math.min(5000, parseInt(config.retryDelay, 10)))
    : config.RETRY_DELAY || 500;

  // Discovery options
  this.discoverChannels = config.discoverChannels !== undefined ? config.discoverChannels : true;
  this.discoverScenes = config.discoverScenes !== undefined ? config.discoverScenes : true;

  // Optional filters
  this.channelFilter = config.channelFilter; // Array of channel numbers to include
  this.sceneFilter = config.sceneFilter; // Array of scene numbers to include

  this.log.info(`ModeLighting Platform initialized for NPU: ${this.NPU_IP}`);
  this.log.info(`Discovery settings - Channels: ${this.discoverChannels}, Scenes: ${this.discoverScenes}`);

  if (api) {
    // Wait for Homebridge to finish launching before discovering accessories
    this.api.on('didFinishLaunching', () => {
      this.log.info('Homebridge finished launching, starting NPU discovery...');
      this.discoverAccessories();
    });

    // Clean up on shutdown
    this.api.on('shutdown', () => {
      this.log.info('Homebridge shutting down...');
      this.isShuttingDown = true;

      // Stop long-polling
      this.stopLongPolling();

      // Stop any remaining accessory-level polling (for accessory plugin mode)
      this.accessoryInstances.forEach(instance => {
        if (instance.stopPolling) {
          instance.stopPolling();
        }
      });
    });
  }
}

ModeLightingPlatform.prototype.configureAccessory = function(accessory) {
  // Called when restoring cached accessories from disk
  this.log.info(`Restoring cached accessory: ${accessory.displayName}`);
  this.accessories.push(accessory);
};

ModeLightingPlatform.prototype.discoverAccessories = function() {
  const settings = {
    requestTimeout: this.requestTimeout,
    maxRetries: this.maxRetries,
    retryDelay: this.retryDelay
  };

  this.log.info('Querying NPU configuration...');

  // Query the NPU configuration endpoint
  axios.get(`http://${this.NPU_IP}/xml-dump?nocrlf=true&what=configuration&where=/`, {
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: settings.requestTimeout,
    validateStatus: function (status) {
      return status === 200;
    }
  })
  .then((response) => {
    this.log.info('NPU configuration received, parsing...');

    parseXMLString(response.data, (err, result) => {
      if (err) {
        this.log.error(`Failed to parse NPU configuration XML: ${err.message}`);
        return;
      }

      try {
        this.parseAndCreateAccessories(result);
      } catch (parseError) {
        this.log.error(`Error parsing NPU configuration: ${parseError.message}`);
        this.log.debug('Raw XML response:', response.data);
      }
    });
  })
  .catch((error) => {
    const errorMsg = error.response ? error.response.status : (error.code || error.message);
    this.log.error(`Failed to query NPU configuration: ${errorMsg}`);
    this.log.error('Make sure the NPU is reachable and the IP address is correct.');
  });
};

ModeLightingPlatform.prototype.parseAndCreateAccessories = function(configData) {
  const discoveredAccessories = [];

  // Log summary of configuration structure
  const deviceCount = configData?.Evolution?.Devices?.[0]?.EDIN8ChDimmerModule?.length || 0;
  const sceneCount = configData?.Evolution?.Scenes?.[0]?.Scene?.length || 0;
  this.log.info(`NPU configuration summary - Devices: ${deviceCount}, Scenes: ${sceneCount}`);

  // Try to find channels in the configuration
  if (this.discoverChannels) {
    const channels = this.findChannels(configData);
    this.log.info(`Discovered ${channels.length} channels`);

    channels.forEach(channelInfo => {
      if (!this.shouldIncludeChannel(channelInfo.number)) {
        this.log.debug(`Skipping channel ${channelInfo.number} (filtered out)`);
        return;
      }

      const accessoryConfig = {
        name: channelInfo.name || `Channel ${channelInfo.number}`,
        NPU_IP: this.NPU_IP,
        channel: channelInfo.number,
        dimmable: channelInfo.dimmable !== undefined ? channelInfo.dimmable : true,
        defaultBrightness: 100,
        requestTimeout: this.requestTimeout,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      };

      discoveredAccessories.push({
        type: 'channel',
        config: accessoryConfig
      });
    });
  }

  // Try to find scenes in the configuration
  if (this.discoverScenes) {
    const scenes = this.findScenes(configData);
    this.log.info(`Discovered ${scenes.length} scenes`);

    scenes.forEach(sceneInfo => {
      if (!this.shouldIncludeScene(sceneInfo.number)) {
        this.log.debug(`Skipping scene ${sceneInfo.number} (filtered out)`);
        return;
      }

      const accessoryConfig = {
        name: sceneInfo.name || `Scene ${sceneInfo.number}`,
        NPU_IP: this.NPU_IP,
        on_scene: sceneInfo.number,
        off_scene: "0", // Default off scene
        requestTimeout: this.requestTimeout,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      };

      discoveredAccessories.push({
        type: 'scene',
        config: accessoryConfig
      });
    });
  }

  this.log.info(`Creating ${discoveredAccessories.length} accessories...`);

  // Track which accessories we're keeping
  const discoveredUUIDs = [];

  // Create accessories
  discoveredAccessories.forEach(accessoryInfo => {
    const uuid = this.addAccessory(accessoryInfo.config);
    if (uuid) {
      discoveredUUIDs.push(uuid);
    }
  });

  // Remove stale cached accessories that weren't rediscovered
  const staleAccessories = this.accessories.filter(acc => !discoveredUUIDs.includes(acc.UUID));
  if (staleAccessories.length > 0) {
    this.log.info(`Removing ${staleAccessories.length} stale cached accessories`);
    staleAccessories.forEach(accessory => {
      this.log.info(`Removing stale accessory: ${accessory.displayName}`);
      this.api.unregisterPlatformAccessories("homebridge-modelighting-v2", "ModelightingV2Platform", [accessory]);
    });
    // Update accessories array
    this.accessories = this.accessories.filter(acc => discoveredUUIDs.includes(acc.UUID));
  }

  // Start long-polling for real-time state updates after all accessories are registered
  this.startLongPolling();
};

ModeLightingPlatform.prototype.findChannels = function(configData) {
  const channels = [];

  try {
    // Navigate to Evolution.Devices array
    if (!configData.Evolution || !configData.Evolution.Devices || !configData.Evolution.Devices[0]) {
      return channels;
    }

    const devices = configData.Evolution.Devices[0];

    // Look for EDIN8ChDimmerModule devices
    if (devices.EDIN8ChDimmerModule) {
      const modules = Array.isArray(devices.EDIN8ChDimmerModule)
        ? devices.EDIN8ChDimmerModule
        : [devices.EDIN8ChDimmerModule];

      modules.forEach(module => {
        // Each module has Elements.SlavePowerChannel array
        if (module.Elements && module.Elements[0] && module.Elements[0].SlavePowerChannel) {
          const channelArray = Array.isArray(module.Elements[0].SlavePowerChannel)
            ? module.Elements[0].SlavePowerChannel
            : [module.Elements[0].SlavePowerChannel];

          channelArray.forEach(channel => {
            // LoadId is the channel identifier
            const loadId = channel.$ && channel.$.LoadId ? channel.$.LoadId : null;
            const name = channel.$ && channel.$.Text ? channel.$.Text : null;

            // DimmingType: 1 = switched (non-dimmable), 2 = dimmable
            const dimmingType = channel.DimmingType && channel.DimmingType[0]
              ? parseInt(channel.DimmingType[0], 10)
              : 2; // Default to dimmable if not specified
            const dimmable = dimmingType === 2;

            if (loadId) {
              channels.push({
                number: String(loadId).padStart(3, '0'),
                name: name || `Channel ${loadId}`,
                dimmable: dimmable
              });
            }
          });
        }
      });
    }
  } catch (error) {
    this.log.error(`Error extracting channels: ${error.message}`);
  }

  return channels;
};

ModeLightingPlatform.prototype.findScenes = function(configData) {
  const scenes = [];

  try {
    // Navigate to Evolution.Scenes array
    if (!configData.Evolution || !configData.Evolution.Scenes || !configData.Evolution.Scenes[0]) {
      return scenes;
    }

    const scenesData = configData.Evolution.Scenes[0];

    // Look for Scene array
    if (scenesData.Scene) {
      const sceneArray = Array.isArray(scenesData.Scene)
        ? scenesData.Scene
        : [scenesData.Scene];

      sceneArray.forEach(scene => {
        // LoadId is the unique identifier used for API calls
        // SceneNo is the user-facing scene number
        const loadId = scene.$ && scene.$.LoadId ? scene.$.LoadId : null;
        const name = scene.$ && scene.$.Text ? scene.$.Text : null;

        // Skip scenes with placeholder names like "2121" or empty names
        if (name && (name === "2121" || name.match(/^[0-9]+$/))) {
          return; // Skip this scene
        }

        // We must use LoadId for API calls, not SceneNo
        if (loadId && name) {
          scenes.push({
            number: String(loadId), // Use LoadId for API queries
            name: name
          });
        }
      });
    }
  } catch (error) {
    this.log.error(`Error extracting scenes: ${error.message}`);
  }

  return scenes;
};

ModeLightingPlatform.prototype.shouldIncludeChannel = function(channelNumber) {
  if (!this.channelFilter || this.channelFilter.length === 0) {
    return true; // No filter, include all
  }
  return this.channelFilter.includes(channelNumber) || this.channelFilter.includes(parseInt(channelNumber, 10));
};

ModeLightingPlatform.prototype.shouldIncludeScene = function(sceneNumber) {
  if (!this.sceneFilter || this.sceneFilter.length === 0) {
    return true; // No filter, include all
  }
  return this.sceneFilter.includes(sceneNumber) || this.sceneFilter.includes(parseInt(sceneNumber, 10));
};

ModeLightingPlatform.prototype.addAccessory = function(accessoryConfig) {
  const uuid = this.api.hap.uuid.generate(accessoryConfig.name + accessoryConfig.NPU_IP + (accessoryConfig.channel || accessoryConfig.on_scene));

  // Check if accessory already exists
  const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

  if (existingAccessory) {
    this.log.info(`Accessory already exists: ${accessoryConfig.name}`);
    this.configureAccessoryInstance(existingAccessory, accessoryConfig);
    return uuid;
  }

  this.log.info(`Adding new accessory: ${accessoryConfig.name}`);

  const accessory = new this.api.platformAccessory(accessoryConfig.name, uuid);

  // Store config in context for recovery
  accessory.context.config = accessoryConfig;

  // Extract room hint from name prefix (e.g., "Kitchen:1" -> "Kitchen")
  const colonIndex = accessoryConfig.name.indexOf(':');
  if (colonIndex > 0) {
    const roomHint = accessoryConfig.name.substring(0, colonIndex).trim();
    if (roomHint) {
      accessory.context.room = roomHint;
      this.log.debug(`Setting room hint "${roomHint}" for ${accessoryConfig.name}`);
    }
  }

  this.configureAccessoryInstance(accessory, accessoryConfig);

  this.api.registerPlatformAccessories("homebridge-modelighting-v2", "ModelightingV2Platform", [accessory]);
  this.accessories.push(accessory);

  return uuid;
};

// Start long-polling for NPU status updates
ModeLightingPlatform.prototype.startLongPolling = function() {
  if (this.longPollActive) {
    this.log.debug('Long-polling already active');
    return;
  }

  this.log.info('Starting NPU long-polling for real-time updates');
  this.longPollActive = true;
  this.doLongPoll();
};

// Perform a single long-poll request
ModeLightingPlatform.prototype.doLongPoll = function() {
  if (!this.longPollActive || this.isShuttingDown) {
    return;
  }

  // Create cancel token for this request
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  this.longPollConnection = source;

  const url = `http://${this.NPU_IP}/xml-dump?nocrlf=true&longpoll=${config.LONG_POLLING.TIMEOUT_SECONDS}&what=status&where=/`;

  axios.get(url, {
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: config.LONG_POLLING.REQUEST_TIMEOUT,
    cancelToken: source.token,
    validateStatus: function (status) {
      return status === 200;
    }
  })
  .then((response) => {
    // Status update received - process it
    this.handleStatusUpdate(response.data);

    // Immediately reconnect to wait for next change
    if (this.longPollActive && !this.isShuttingDown) {
      setImmediate(() => this.doLongPoll());
    }
  })
  .catch((error) => {
    if (axios.isCancel(error)) {
      this.log.debug('Long-poll request cancelled');
      return;
    }

    // Log error (but timeout is normal - means no changes occurred)
    if (error.code === 'ECONNABORTED') {
      this.log.debug('Long-poll timeout (no changes) - reconnecting');
    } else {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      this.log.warn(`Long-poll error: ${errorMsg} - reconnecting`);
    }

    // Reconnect after delay
    if (this.longPollActive && !this.isShuttingDown) {
      setTimeout(() => this.doLongPoll(), config.LONG_POLLING.RECONNECT_DELAY);
    }
  });
};

// Process status update from NPU
ModeLightingPlatform.prototype.handleStatusUpdate = function(xmlData) {
  parseXMLString(xmlData, (err, result) => {
    if (err) {
      this.log.error(`Long-poll XML parse error: ${err.message}`);
      return;
    }

    try {
      // Extract channel states
      const channelStates = this.extractChannelStates(result);

      // Update all affected channel accessories
      this.updateChannelAccessories(channelStates);

      // TODO: Future - extract and handle button press events
      // const buttonEvents = this.extractButtonEvents(result);
      // this.handleButtonEvents(buttonEvents);

    } catch (parseError) {
      this.log.error(`Long-poll data extraction error: ${parseError.message}`);
    }
  });
};

// Extract channel brightness states from status XML
ModeLightingPlatform.prototype.extractChannelStates = function(result) {
  const channelStates = {};

  try {
    if (result.Evolution && result.Evolution.Devices && result.Evolution.Devices[0]) {
      const devices = result.Evolution.Devices[0];

      if (devices.EDIN8ChDimmerModule) {
        const modules = Array.isArray(devices.EDIN8ChDimmerModule)
          ? devices.EDIN8ChDimmerModule
          : [devices.EDIN8ChDimmerModule];

        modules.forEach(module => {
          if (module.Elements && module.Elements[0] && module.Elements[0].SlavePowerChannel) {
            const channelArray = Array.isArray(module.Elements[0].SlavePowerChannel)
              ? module.Elements[0].SlavePowerChannel
              : [module.Elements[0].SlavePowerChannel];

            channelArray.forEach(channel => {
              const loadId = channel.$ && channel.$.LoadId ? channel.$.LoadId : null;
              const state = channel.State && channel.State[0] ? channel.State[0] : null;

              if (loadId && state !== null) {
                // Convert DMX value to percentage
                const percent = dmx2pct[state] || 0;
                const channelNum = String(loadId).padStart(3, '0');
                channelStates[channelNum] = percent;
              }
            });
          }
        });
      }
    }
  } catch (error) {
    this.log.error(`Error extracting channel states: ${error.message}`);
  }

  return channelStates;
};

// Update channel accessories with new states
ModeLightingPlatform.prototype.updateChannelAccessories = function(channelStates) {
  this.accessoryInstances.forEach(instance => {
    if (instance.mode !== 'channel') {
      return; // Skip scene accessories
    }

    const newState = channelStates[instance.channel];
    if (newState === undefined) {
      return; // No state update for this channel
    }

    // Check if state actually changed
    if (instance.lastKnownState === newState) {
      return; // No change
    }

    this.log.info(`${instance.name}: State change detected (${instance.lastKnownState}% -> ${newState}%)`);

    // Update HomeKit with the new state
    if (instance.controlService) {
      // Update power state
      const isOn = newState > 0;
      const wasOn = instance.lastKnownState > 0;
      if (isOn !== wasOn) {
        instance.controlService.getCharacteristic(Characteristic.On).updateValue(isOn);
      }

      // Update brightness if dimmable and changed
      if (instance.dimmable && newState !== instance.lastKnownState) {
        instance.controlService.getCharacteristic(Characteristic.Brightness).updateValue(newState);
      }

      // Update cached brightness
      if (newState > 0) {
        instance.cachedBrightness = newState;
      }
    }

    // Update last known state
    instance.lastKnownState = newState;
  });
};

// Stop long-polling
ModeLightingPlatform.prototype.stopLongPolling = function() {
  this.log.info('Stopping NPU long-polling');
  this.longPollActive = false;

  // Cancel current connection if active
  if (this.longPollConnection) {
    this.longPollConnection.cancel('Stopping long-polling');
    this.longPollConnection = null;
  }
};

ModeLightingPlatform.prototype.configureAccessoryInstance = function(accessory, accessoryConfig) {
  // Create a ModeLightingAccessory instance that will handle all the logic
  const accessoryInstance = new ModeLightingAccessory(this.log, accessoryConfig);

  // Store reference to platform for cross-accessory coordination (e.g., scene polling)
  accessoryInstance.platform = this;

  // Store reference for future use
  accessory.accessoryInstance = accessoryInstance;

  // Track instance for cleanup on shutdown
  this.accessoryInstances.push(accessoryInstance);

  // Determine which service type to use based on mode
  const ServiceType = accessoryInstance.mode === 'scene' ? Service.Switch : Service.Lightbulb;
  const WrongServiceType = accessoryInstance.mode === 'scene' ? Service.Lightbulb : Service.Switch;

  // Remove wrong service type if it exists (in case mode changed)
  const wrongService = accessory.getService(WrongServiceType);
  if (wrongService) {
    this.log.info(`Removing wrong service type for ${accessoryConfig.name}`);
    accessory.removeService(wrongService);
  }

  // Get or add the correct control service
  let controlService = accessory.getService(ServiceType);
  if (!controlService) {
    controlService = accessory.addService(ServiceType, accessoryConfig.name);
  }

  // Update display name if it changed
  if (accessory.displayName !== accessoryConfig.name) {
    this.log.info(`Updating display name for ${accessory.displayName} to ${accessoryConfig.name}`);
    accessory.displayName = accessoryConfig.name;
    accessory._associatedHAPAccessory.displayName = accessoryConfig.name;
  }

  // Store reference to control service for polling updates
  accessoryInstance.controlService = controlService;

  // Configure the On/Off characteristic
  controlService
    .getCharacteristic(Characteristic.On)
    .removeAllListeners('set')
    .removeAllListeners('get')
    .on('set', accessoryInstance.setPowerState.bind(accessoryInstance))
    .on('get', accessoryInstance.getPowerState.bind(accessoryInstance));

  // Add or remove brightness control based on dimmable status (only for channel mode)
  if (accessoryInstance.mode === 'channel') {
    if (accessoryInstance.dimmable) {
      // Add brightness characteristic if dimmable
      controlService
        .getCharacteristic(Characteristic.Brightness)
        .removeAllListeners('set')
        .removeAllListeners('get')
        .on('set', accessoryInstance.setBrightness.bind(accessoryInstance))
        .on('get', accessoryInstance.getBrightness.bind(accessoryInstance));
    } else {
      // Remove brightness characteristic if not dimmable (switched mode)
      const brightnessChar = controlService.getCharacteristic(Characteristic.Brightness);
      if (brightnessChar) {
        controlService.removeCharacteristic(brightnessChar);
      }
    }
  }

  // Ensure AccessoryInformation service exists
  let informationService = accessory.getService(Service.AccessoryInformation);
  if (!informationService) {
    informationService = accessory.addService(Service.AccessoryInformation);
  }

  informationService
    .setCharacteristic(Characteristic.Manufacturer, config.DEVICE_INFO.MANUFACTURER)
    .setCharacteristic(Characteristic.Model, config.DEVICE_INFO.MODEL)
    .setCharacteristic(Characteristic.SerialNumber, "123456");

  // Long-polling is now handled at platform level - no per-accessory polling needed
};

// ============================================================================
// ACCESSORY PLUGIN - Manual configuration for individual channels/scenes
// ============================================================================

function ModeLightingAccessory(log, config) {
  this.log = log;

  // Validate required configuration fields
  if (!config.name) {
    throw new Error('ModeLighting: Missing required config field "name"');
  }
  if (!config.NPU_IP) {
    throw new Error('ModeLighting: Missing required config field "NPU_IP"');
  }

  // Validate IP address format (basic check)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(config.NPU_IP)) {
    throw new Error(`ModeLighting: Invalid NPU_IP address format: "${config.NPU_IP}". Expected format: xxx.xxx.xxx.xxx`);
  }

  // Determine operation mode: channel-based or scene-based
  const hasChannel = config.channel !== undefined;
  const hasScenes = config.on_scene !== undefined && config.off_scene !== undefined;

  if (!hasChannel && !hasScenes) {
    throw new Error('ModeLighting: Must specify either "channel" (for channel mode) or both "on_scene" and "off_scene" (for scene mode)');
  }

  if (hasChannel && hasScenes) {
    throw new Error('ModeLighting: Cannot specify both "channel" and scene parameters. Choose either channel mode or scene mode.');
  }

  // Store mode
  this.mode = hasChannel ? 'channel' : 'scene';

  if (this.mode === 'channel') {
    // Channel mode configuration
    this.channel = config.channel;

    // Validate defaultBrightness if provided
    if (config.defaultBrightness !== undefined) {
      const brightness = parseInt(config.defaultBrightness, 10);
      if (isNaN(brightness) || brightness < 0 || brightness > 100) {
        throw new Error(`ModeLighting: defaultBrightness must be between 0 and 100, got: ${config.defaultBrightness}`);
      }
      this.defaultBrightness = brightness;
    } else {
      this.defaultBrightness = 100; // Default to full brightness
    }

    // Validate dimmable if provided
    if (config.dimmable !== undefined && typeof config.dimmable !== 'boolean') {
      throw new Error(`ModeLighting: dimmable must be a boolean (true/false), got: ${config.dimmable}`);
    }
    this.dimmable = config.dimmable !== undefined ? config.dimmable : true; // Default to dimmable

    // Track the last brightness level for restoring when turning on
    this.cachedBrightness = this.defaultBrightness;
  } else {
    // Scene mode configuration
    this.on_scene = config.on_scene;
    this.off_scene = config.off_scene;
    this.dimmable = false; // Scenes are not dimmable
  }

  // Store validated configuration
  this.NPU_IP = config.NPU_IP;
  this.name = config.name;

  // Allow user to override network settings (with validation)
  this.requestTimeout = config.requestTimeout !== undefined
    ? Math.max(1000, Math.min(30000, parseInt(config.requestTimeout, 10)))
    : config.REQUEST_TIMEOUT;

  this.maxRetries = config.maxRetries !== undefined
    ? Math.max(0, Math.min(20, parseInt(config.maxRetries, 10)))
    : config.MAX_RETRIES;

  this.retryDelay = config.retryDelay !== undefined
    ? Math.max(100, Math.min(5000, parseInt(config.retryDelay, 10)))
    : config.RETRY_DELAY;

  // Log initialization
  if (this.mode === 'channel') {
    this.log.info(`ModeLighting initialized: ${this.name} (Mode: Channel, NPU: ${this.NPU_IP}, Channel: ${this.channel}, Dimmable: ${this.dimmable})`);
  } else {
    this.log.info(`ModeLighting initialized: ${this.name} (Mode: Scene, NPU: ${this.NPU_IP}, On Scene: ${this.on_scene}, Off Scene: ${this.off_scene})`);
  }

  if (config.requestTimeout || config.maxRetries || config.retryDelay) {
    this.log.info(`Custom network settings - Timeout: ${this.requestTimeout}ms, Max Retries: ${this.maxRetries}, Retry Delay: ${this.retryDelay}ms`);
  }

  // State tracking for long-polling updates (managed at platform level)
  this.lastKnownState = null;
}

function ModeSetChannel(log, NPU_IP, channel, percent, callback, settings, trycount = 0) {
  const dmx = pct2dmx[percent];
  const payload = `<?xml version="1.0"?><methodCall>
<methodName>setChannelToLevel</methodName><params><param>${channel}</param><param>${dmx}</param></params></methodCall>`;

  trycount++;

  axios.post(`http://${NPU_IP}${config.NPU.RPC_ENDPOINT}`, payload, {
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: settings.requestTimeout,
    validateStatus: function (status) {
      return status === 200;
    }
  })
  .then(function(response) {
    log.info(`NPU: ${NPU_IP}, cmd: setChannelToLevel, channel: ${channel}, pct: ${percent}, try: ${trycount}`);
    callback(null);
  })
  .catch(function(error) {
    if (trycount < settings.maxRetries) {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.debug(`Retry: ${trycount}, NPU: ${NPU_IP}, cmd: setChannelToLevel, channel: ${channel}, pct: ${percent}, error: ${errorMsg}`);
      setTimeout(ModeSetChannel, settings.retryDelay, log, NPU_IP, channel, percent, callback, settings, trycount);
    } else {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.error(`FAIL! NPU: ${NPU_IP}, cmd: setChannelToLevel, channel: ${channel}, pct: ${percent}, error: ${errorMsg}`);
      callback(error);
    }
  });
}
function ModeGetChannel(log, NPU_IP, channel, callback, settings, trycount = 0) {
  trycount++;

  axios.get(`http://${NPU_IP}${config.NPU.STATUS_ENDPOINT}${channel}`, {
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: settings.requestTimeout,
    validateStatus: function (status) {
      return status === 200;
    }
  })
  .then(function(response) {
    parseXMLString(response.data, function (err, result) {
      if (err) {
        log.error(`NPU: ${NPU_IP}, getChannel: ${channel}, XML parse error: ${err.message}`);
        callback(new Error('XML parse error'), null);
        return;
      }

      try {
        const state = result.Evolution.SlavePowerChannel[0].State[0];
        const percent = dmx2pct[state];
        log.info(`NPU: ${NPU_IP}, getChannel: ${channel}, state: ${state}, pct: ${percent}, try: ${trycount}`);
        callback(null, percent);
      } catch (parseError) {
        log.error(`NPU: ${NPU_IP}, getChannel: ${channel}, data extraction error: ${parseError.message}`);
        callback(new Error('Invalid response structure'), null);
      }
    });
  })
  .catch(function(error) {
    if (trycount < settings.maxRetries) {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.debug(`Retry: ${trycount}, NPU: ${NPU_IP}, getChannel: ${channel}, error: ${errorMsg}`);
      setTimeout(ModeGetChannel, settings.retryDelay, log, NPU_IP, channel, callback, settings, trycount);
    } else {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.error(`FAIL! NPU: ${NPU_IP}, getChannel: ${channel}, error: ${errorMsg}`);
      callback(error, null);
    }
  });
}

// Scene-based functions
function ModeActivateScene(log, NPU_IP, scene, callback, settings, trycount = 0) {
  const payload = `<?xml version="1.0"?><methodCall>
<methodName>fadeScene</methodName><params><param>${scene}</param></params></methodCall>`;

  trycount++;

  axios.post(`http://${NPU_IP}${config.NPU.RPC_ENDPOINT}`, payload, {
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: settings.requestTimeout,
    validateStatus: function (status) {
      return status === 200;
    }
  })
  .then(function(response) {
    log.info(`NPU: ${NPU_IP}, cmd: fadeScene, scene: ${scene}, try: ${trycount}`);
    callback(null);
  })
  .catch(function(error) {
    if (trycount < settings.maxRetries) {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.debug(`Retry: ${trycount}, NPU: ${NPU_IP}, cmd: fadeScene, scene: ${scene}, error: ${errorMsg}`);
      setTimeout(ModeActivateScene, settings.retryDelay, log, NPU_IP, scene, callback, settings, trycount);
    } else {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.error(`FAIL! NPU: ${NPU_IP}, cmd: fadeScene, scene: ${scene}, error: ${errorMsg}`);
      callback(error);
    }
  });
}

function ModeGetScene(log, NPU_IP, scene, callback, settings, trycount = 0) {
  trycount++;

  axios.get(`http://${NPU_IP}${config.NPU.STATUS_ENDPOINT}${scene}`, {
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: settings.requestTimeout,
    validateStatus: function (status) {
      return status === 200;
    }
  })
  .then(function(response) {
    parseXMLString(response.data, function (err, result) {
      if (err) {
        log.error(`NPU: ${NPU_IP}, getScene: ${scene}, XML parse error: ${err.message}`);
        callback(err);
        return;
      }

      try {
        const active = result.Evolution.Scene[0].Active[0];
        log.info(`NPU: ${NPU_IP}, getScene: ${scene}, active: ${active}, try: ${trycount}`);
        // Active is "1" for active, "0" for inactive
        callback(null, active === "1");
      } catch (parseError) {
        log.error(`NPU: ${NPU_IP}, getScene: ${scene}, data extraction error: ${parseError.message}`);
        callback(new Error('Invalid response structure'));
      }
    });
  })
  .catch(function(error) {
    if (trycount < settings.maxRetries) {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.debug(`Retry: ${trycount}, NPU: ${NPU_IP}, getScene: ${scene}, error: ${errorMsg}`);
      setTimeout(ModeGetScene, settings.retryDelay, log, NPU_IP, scene, callback, settings, trycount);
    } else {
      const errorMsg = error.response ? error.response.status : (error.code || error.message);
      log.error(`FAIL! NPU: ${NPU_IP}, getScene: ${scene}, error: ${errorMsg}`);
      callback(error);
    }
  });
}

ModeLightingAccessory.prototype = {
  getPowerState: function(callback) {
    const settings = {
      requestTimeout: this.requestTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };

    if (this.mode === 'scene') {
      // Scene mode: check if the on_scene is currently active
      ModeGetScene(this.log, this.NPU_IP, this.on_scene, callback, settings);
    } else {
      // Channel mode: check if brightness is greater than 0
      ModeGetChannel(this.log, this.NPU_IP, this.channel, (error, percent) => {
        if (error) {
          callback(error);
        } else {
          callback(null, percent > 0);
        }
      }, settings);
    }
  },
  setPowerState: function(powerOn, callback) {
    const settings = {
      requestTimeout: this.requestTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };

    if (this.mode === 'scene') {
      // Scene mode: activate the appropriate scene based on powerOn state
      const scene = powerOn ? this.on_scene : this.off_scene;
      ModeActivateScene(this.log, this.NPU_IP, scene, (error) => {
        callback(error);

        // Long-polling will automatically detect state changes from scene activation
      }, settings);
    } else {
      // Channel mode: set brightness
      // When turning on, restore the last brightness (not defaultBrightness)
      const targetBrightness = powerOn ? this.cachedBrightness : 0;

      // Update last known state for polling
      this.lastKnownState = targetBrightness;

      ModeSetChannel(this.log, this.NPU_IP, this.channel, targetBrightness, callback, settings);
    }
  },
  getBrightness: function(callback) {
    if (this.mode === 'scene') {
      // Scene mode doesn't support brightness
      callback(new Error('Brightness not supported in scene mode'));
      return;
    }

    const settings = {
      requestTimeout: this.requestTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };
    ModeGetChannel(this.log, this.NPU_IP, this.channel, (error, percent) => {
      if (error) {
        callback(error);
      } else {
        // Update cached brightness to match reality (in case light was changed outside HomeKit)
        if (percent > 0) {
          this.cachedBrightness = percent;
        }
        callback(null, percent);
      }
    }, settings);
  },
  setBrightness: function(brightness, callback) {
    if (this.mode === 'scene') {
      // Scene mode doesn't support brightness
      callback(new Error('Brightness not supported in scene mode'));
      return;
    }

    const settings = {
      requestTimeout: this.requestTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };

    // Cache the brightness so we can restore it when turning on
    this.cachedBrightness = brightness;

    // Update last known state for polling
    this.lastKnownState = brightness;

    ModeSetChannel(this.log, this.NPU_IP, this.channel, brightness, callback, settings);
  },
  identify: function(callback) {
    this.log("identify: Identify requested!");
    callback(); // success
  },
  getServices: function() {
    // Create information service with device metadata
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, config.DEVICE_INFO.MANUFACTURER)
      .setCharacteristic(Characteristic.Model, config.DEVICE_INFO.MODEL)
      .setCharacteristic(Characteristic.SerialNumber, "123456");

    // Create appropriate service based on mode
    let controlService;
    if (this.mode === 'scene') {
      // Scene mode uses Switch service (scenes are on/off actions)
      controlService = new Service.Switch(this.name);
    } else {
      // Channel mode uses Lightbulb service (supports brightness)
      controlService = new Service.Lightbulb(this.name);
    }

    controlService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setPowerState.bind(this))
      .on('get', this.getPowerState.bind(this));

    // Add brightness control if dimmable (only for channel mode)
    if (this.dimmable) {
      controlService
        .getCharacteristic(Characteristic.Brightness)
        .on('set', this.setBrightness.bind(this))
        .on('get', this.getBrightness.bind(this));
    }

    // Store reference to control service for state updates
    this.controlService = controlService;

    // Long-polling is now handled at platform level - no per-accessory polling needed

    return [informationService, controlService];
  }
};

// Polling methods removed - now using platform-level long-polling for real-time state updates
