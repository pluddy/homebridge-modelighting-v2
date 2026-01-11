# AGENTS.md - AI Assistant Guide for homebridge-modelighting-v2

This document provides comprehensive guidance for AI assistants working on the homebridge-modelighting-v2 codebase. It covers architecture, conventions, workflows, and important domain knowledge.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Key Components](#key-components)
5. [Development Workflows](#development-workflows)
6. [Coding Conventions](#coding-conventions)
7. [API Communication](#api-communication)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Common Tasks](#common-tasks)
11. [Domain Knowledge](#domain-knowledge)
12. [Gotchas and Important Notes](#gotchas-and-important-notes)

---

## Project Overview

**homebridge-modelighting-v2** is a Homebridge plugin for Mode Lighting eDinControl systems. It enables HomeKit control of DMX lighting channels and scenes through an NPU (Network Processing Unit).

### Key Features

- **Dual-mode architecture**: Platform plugin (auto-discovery) + Accessory plugin (manual config)
- **Real-time state updates**: Platform-level long-polling for instant synchronization
- **Two control modes**: Channel mode (DMX dimming) and Scene mode (preset activation)
- **Robust error handling**: Automatic retries with exponential backoff
- **Modern codebase**: ES6+, axios, comprehensive validation

### Tech Stack

- **Runtime**: Node.js >=14.0.0
- **Framework**: Homebridge >=1.3.0
- **HTTP Client**: axios ^1.13.2
- **XML Parser**: xml2js ^0.4.23

### Version

Current: 0.3.0 (see CHANGELOG.md for history)

---

## Architecture

### Dual Plugin System

The plugin supports **two distinct operation modes** that can coexist:

#### 1. Platform Plugin (Recommended)
- **Class**: `ModeLightingPlatform` (index.js:29-661)
- **Registration**: `"platform": "ModelightingV2Platform"`
- **Purpose**: Auto-discovers all channels and scenes from NPU
- **Lifecycle**:
  1. Homebridge calls `configureAccessory()` to restore cached accessories
  2. `didFinishLaunching` event triggers `discoverAccessories()`
  3. Queries NPU configuration endpoint
  4. Creates/updates accessories based on discovery
  5. Removes stale cached accessories
  6. Starts platform-level long-polling for state updates

#### 2. Accessory Plugin (Manual)
- **Class**: `ModeLightingAccessory` (index.js:666-1011)
- **Registration**: `"accessory": "ModelightingV2"`
- **Purpose**: Manually configured individual lights/scenes
- **Lifecycle**:
  1. Homebridge instantiates one accessory per config entry
  2. Each accessory operates independently
  3. If used with platform plugin, shares long-polling infrastructure

### Platform vs Accessory Decision Tree

```
User wants...
├─ Auto-discovery of all devices → Platform Plugin
├─ Full control without manual config → Platform Plugin
├─ Selective exposure with filters → Platform Plugin + filters
├─ Legacy compatibility → Accessory Plugin
└─ Mixed manual + auto → Both (platform + accessory entries)
```

---

## File Structure

```
homebridge-modelighting-v2/
├── index.js                    # Main entry point (1014 lines)
│   ├── ModeLightingPlatform    # Platform plugin class
│   ├── ModeLightingAccessory   # Accessory plugin class
│   └── Module-level functions  # ModeSetChannel, ModeGetChannel, ModeActivateScene
│
├── edin.library.js            # NPU web interface library (675 lines)
│   └── Legacy functions for web automation (not actively used)
│
├── config.js                  # Configuration constants
│   ├── REQUEST_TIMEOUT         # HTTP timeouts
│   ├── MAX_RETRIES            # Retry limits
│   ├── LONG_POLLING           # Long-poll settings
│   └── DEVICE_INFO            # Manufacturer metadata
│
├── config.schema.json         # Homebridge UI configuration schema
│   └── JSON Schema validation for UI form
│
├── sample_config.json         # Example configurations
├── test-discovery.js          # NPU discovery test script
├── test-longpoll.sh          # Long-polling test (monitoring)
├── test-longpoll-simple.sh   # Interactive long-polling test
│
├── package.json              # NPM metadata and dependencies
├── README.md                 # User documentation
├── CHANGELOG.md             # Version history
└── LICENSE                  # ISC license
```

### Important: Single File Architecture

**CRITICAL**: The entire plugin logic is in `index.js`. This is intentional for Homebridge compatibility. Do NOT refactor into multiple modules without understanding Homebridge's plugin loading mechanism.

---

## Key Components

### 1. ModeLightingPlatform Class (Lines 29-661)

**Responsibilities**:
- NPU discovery and XML parsing
- Accessory lifecycle (create, restore, remove)
- Platform-level long-polling for all accessories
- Filter application (channelFilter, sceneFilter)
- Shutdown cleanup

**Key Properties**:
```javascript
this.NPU_IP              // NPU IP address (required)
this.accessories[]       // Cached HomeKit accessories
this.accessoryInstances[]// ModeLightingAccessory instances
this.longPollConnection  // Axios cancel token
this.longPollActive      // Boolean polling state
this.isShuttingDown      // Shutdown flag
this.requestTimeout      // HTTP timeout (1000-30000ms)
this.maxRetries          // Retry attempts (0-20)
this.retryDelay          // Retry delay (100-5000ms)
this.discoverChannels    // Enable channel discovery
this.discoverScenes      // Enable scene discovery
this.channelFilter       // Array of channel LoadIds to include
this.sceneFilter         // Array of scene numbers to include
```

**Key Methods**:
```javascript
configureAccessory(accessory)              // Restore cached accessories (lines 103-107)
discoverAccessories()                      // Query NPU and discover (lines 109-150)
parseAndCreateAccessories(result)          // Parse XML and create (lines 152-244)
findChannels(config)                       // Extract channels from XML (lines 246-297)
findScenes(config)                         // Extract scenes from XML (lines 299-341)
shouldIncludeChannel(loadId)               // Filter logic (lines 343-347)
shouldIncludeScene(sceneNo)                // Filter logic (lines 349-355)
addAccessory(...)                          // Create/update accessory (lines 357-392)
startLongPolling()                         // Start long-polling (lines 395-404)
doLongPoll()                               // Long-poll request loop (lines 407-457)
handleStatusUpdate(xml)                    // Process status updates (lines 460-482)
extractChannelStates(result)               // Parse channel states (lines 485-523)
updateChannelAccessories(states)           // Update HomeKit (lines 526-567)
stopLongPolling()                          // Cleanup (lines 570-579)
configureAccessoryInstance(accessory, ...) // Setup services (lines 581-660)
```

### 2. ModeLightingAccessory Class (Lines 666-1011)

**Responsibilities**:
- Individual accessory control logic
- Mode detection (channel vs scene)
- State management and caching
- HomeKit characteristic handlers

**Key Properties**:
```javascript
this.mode               // 'channel' or 'scene'
this.NPU_IP            // NPU IP address
this.name              // Display name
this.channel           // DMX channel (if channel mode)
this.on_scene          // Scene to activate on (if scene mode)
this.off_scene         // Scene to activate off (if scene mode)
this.dimmable          // Brightness control enabled (channel mode only)
this.defaultBrightness // Initial brightness (0-100)
this.cachedBrightness  // Last user-set brightness
this.lastKnownState    // Current state (for long-polling)
this.controlService    // HomeKit service (Lightbulb or Switch)
this.requestTimeout    // HTTP timeout
this.maxRetries        // Retry attempts
this.retryDelay        // Retry delay
```

**Key Methods**:
```javascript
getServices()           // Return HomeKit services (lines 973-1010)
getPowerState(callback) // HomeKit Get handler (lines 870-890)
setPowerState(value, cb)// HomeKit Set handler (lines 891-923)
getBrightness(callback) // HomeKit Get handler (lines 924-947)
setBrightness(value, cb)// HomeKit Set handler (lines 948-968)
```

### 3. Module-Level NPU Communication Functions

These are **standalone functions** (not class methods) that handle NPU API calls:

#### ModeSetChannel (Lines 760-791)
```javascript
function ModeSetChannel(log, NPU_IP, channel, percent, callback, settings, trycount = 0)
```
- Sets DMX channel to specified brightness (0-100%)
- Uses XML-RPC `setChannelToLevel` method
- Automatic retry with exponential backoff
- Converts percentage to DMX (0-255) using `pct2dmx` lookup table

#### ModeGetChannel (Lines 792-834)
```javascript
function ModeGetChannel(log, NPU_IP, channel, callback, settings, trycount = 0)
```
- Queries current channel state
- Uses `/xml-dump?what=status&where={channel}` endpoint
- Parses `<State>` element from XML
- Converts DMX to percentage using `dmx2pct` lookup table
- Returns percentage (0-100) to callback

#### ModeActivateScene (Lines 837-867)
```javascript
function ModeActivateScene(log, NPU_IP, scene, callback, settings, trycount = 0)
```
- Activates a scene on the NPU
- Uses XML-RPC `fadeScene` method
- Scene activation is instantaneous (no dimming)
- **CRITICAL**: Uses scene's `LoadId`, not `SceneNo`

### 4. DMX Conversion Tables (Lines 8-11)

**dmx2pct[256]**: DMX (0-255) → Percentage (0-100)
**pct2dmx[256]**: Percentage (0-100) → DMX (0-255)

**Why non-linear?** Perceptual brightness correction. Human eyes perceive brightness logarithmically, so linear DMX values don't appear evenly spaced.

---

## Development Workflows

### Adding New Features

1. **Read existing code first**: Understand current implementation before proposing changes
2. **Maintain architecture**: Don't merge platform and accessory logic
3. **Update all relevant sections**:
   - Implementation in index.js
   - Configuration validation
   - config.schema.json (for UI)
   - README.md documentation
   - CHANGELOG.md entry
4. **Test both modes**: Platform and accessory plugin compatibility

### Modifying NPU Communication

1. **Review NPU API docs** (if available) or test-*.js scripts
2. **Update module-level functions** (ModeSetChannel, ModeGetChannel, etc.)
3. **Maintain retry pattern**: All NPU calls must support retries
4. **Test with real hardware**: NPU quirks are not always predictable
5. **Update error messages**: Include NPU IP, command, and parameters

### Configuration Changes

When adding/modifying config parameters:

1. **Update validation**:
   - Platform constructor (lines 41-73)
   - Accessory constructor (lines 670-754)
2. **Update config.schema.json**:
   - Add field definition
   - Set type, range, defaults
   - Add description
3. **Update README.md**:
   - Document parameter
   - Show examples
4. **Set sensible defaults**: Fail gracefully if omitted
5. **Clamp values**: Don't reject out-of-range, constrain to valid range

### Bug Fixes

1. **Reproduce the issue**: Use test scripts (test-discovery.js, test-longpoll.sh)
2. **Check error handling**: Ensure callbacks are called on all paths
3. **Add logging**: Use appropriate level (error, warn, info, debug)
4. **Test edge cases**:
   - NPU unreachable
   - Invalid XML responses
   - Network timeouts
   - Concurrent requests
5. **Update CHANGELOG.md**: Document fix under "Bug Fixes"

---

## Coding Conventions

### JavaScript Style

**Modern ES6+** throughout:
```javascript
// Good
const myVar = 'value';
let counter = 0;
const url = `http://${this.NPU_IP}/endpoint`;

// Bad (legacy)
var myVar = 'value';
var url = 'http://' + this.NPU_IP + '/endpoint';
```

### Naming Conventions

**Functions**:
- **Module-level NPU functions**: `CapitalCase` (e.g., `ModeSetChannel`, `ModeGetChannel`)
- **Class methods**: `camelCase` (e.g., `getPowerState`, `discoverAccessories`)
- **Private/internal**: Prefix with `_` (e.g., `_parseXML`) - currently not used

**Variables**:
- **Descriptive names**: `requestTimeout`, `longPollActive`, `cachedBrightness`
- **Constants (config.js)**: `ALL_CAPS` (e.g., `REQUEST_TIMEOUT`, `MAX_RETRIES`)
- **Avoid abbreviations** except standard: NPU, IP, DMX, RPC, XML

**Classes**:
- `ModeLightingPlatform`
- `ModeLightingAccessory`

### Code Organization

**Function Order** in index.js:
1. Module exports and registration
2. Platform class definition
3. Platform methods (discovery, long-polling, accessory management)
4. Accessory class definition
5. Accessory methods (HomeKit handlers)
6. Module-level NPU communication functions

**Method Order** within classes:
1. Constructor
2. Lifecycle methods (configureAccessory, discoverAccessories)
3. Public methods (in logical order)
4. Private methods (if any)

### Comments

**When to comment**:
- Complex logic (XML parsing, DMX conversion)
- Non-obvious behavior (long-polling reconnect, scene stateless behavior)
- Configuration validation rules
- NPU API quirks

**When NOT to comment**:
- Self-explanatory code
- Obvious getters/setters
- Standard patterns

**Style**:
```javascript
// Single-line comments for brief explanations
// Use complete sentences with proper capitalization

/**
 * Multi-line comments for complex explanations
 * or function documentation (if needed)
 */
```

### Logging Levels

**Critical**: Use appropriate logging level:

```javascript
this.log.error(msg)  // Failures: max retries exhausted, validation errors
this.log.warn(msg)   // Recoverable issues: retrying requests, missing optional fields
this.log.info(msg)   // Normal operations: startup, discovery, commands
this.log.debug(msg)  // Detailed info: retry attempts, raw XML, state updates
```

**Format**:
```javascript
// Include context: NPU IP, channel/scene, operation
this.log.error(`NPU: ${NPU_IP}, channel: ${channel}, error: ${err.message}`);

// For retries
this.log.debug(`Retry ${trycount}/${settings.maxRetries}: ${operation}`);

// For state changes
this.log.info(`Discovered ${channels.length} channels, ${scenes.length} scenes`);
```

---

## API Communication

### NPU Endpoints

Base URL: `http://{NPU_IP}`

#### 1. Configuration Discovery
```
GET /xml-dump?nocrlf=true&what=configuration&where=/
```
- Returns complete NPU configuration as XML
- Used for auto-discovery
- Contains channels, scenes, modules, settings

#### 2. Status Query (Single Channel)
```
GET /xml-dump?nocrlf=true&what=status&where={channel}
```
- Returns current state of specific channel
- Response: `<Evolution><State>123</State></Evolution>` (DMX 0-255)

#### 3. Long-Polling (All Channels)
```
GET /xml-dump?nocrlf=true&longpoll={timeout_seconds}&what=status&where=/
```
- Blocks until state change OR timeout
- Default timeout: 100 seconds (config.js:34)
- Returns complete status XML for all devices
- Used for real-time HomeKit updates

#### 4. XML-RPC Commands
```
POST /xml-rpc?1
Content-Type: application/xml

<?xml version="1.0"?>
<methodCall>
  <methodName>{method}</methodName>
  <params>
    <param><value><string>{param1}</string></value></param>
    <param><value><string>{param2}</string></value></param>
  </params>
</methodCall>
```

**Methods**:
- `setChannelToLevel` - params: channel (e.g., "001"), dmxValue (e.g., "200")
- `fadeScene` - params: sceneLoadId (e.g., "42")

### XML Parsing Patterns

**Always use xml2js**, never regex:

```javascript
parseXMLString(xml, { explicitArray: false }, (err, result) => {
  if (err) {
    // Handle parse error
    return;
  }

  // Navigate safely with optional chaining
  const devices = result?.Evolution?.Devices?.[0];
  if (!devices) return;

  // Handle both arrays and single elements
  const modules = Array.isArray(devices.EDIN8ChDimmerModule)
    ? devices.EDIN8ChDimmerModule
    : [devices.EDIN8ChDimmerModule];
});
```

**Key XML structures**:

Configuration:
```xml
<Evolution>
  <Devices>
    <EDIN8ChDimmerModule>
      <Elements>
        <SlavePowerChannel>
          <LoadId>1</LoadId>              <!-- Channel number -->
          <Text>Kitchen Light</Text>       <!-- Display name -->
          <DimmingType>2</DimmingType>     <!-- 1=switched, 2=dimmable -->
        </SlavePowerChannel>
      </Elements>
    </EDIN8ChDimmerModule>
  </Devices>
  <Scenes>
    <Scene>
      <LoadId>42</LoadId>                  <!-- Scene number for API -->
      <SceneNo>1</SceneNo>                 <!-- Display number (don't use!) -->
      <Text>Evening</Text>                 <!-- Display name -->
    </Scene>
  </Scenes>
</Evolution>
```

Status:
```xml
<Evolution>
  <Devices>
    <EDIN8ChDimmerModule>
      <Elements>
        <SlavePowerChannel>
          <State>200</State>               <!-- DMX value 0-255 -->
        </SlavePowerChannel>
      </Elements>
    </EDIN8ChDimmerModule>
  </Devices>
</Evolution>
```

### Retry Pattern

All NPU communication functions follow this pattern:

```javascript
function ModeOperationName(log, NPU_IP, param, callback, settings, trycount = 0) {
  axios.method(url, data, { timeout: settings.requestTimeout })
    .then(response => {
      // Process response
      callback(null, result);
    })
    .catch(error => {
      const errorMsg = error.response?.status || error.code || error.message;

      if (trycount < settings.maxRetries) {
        log.debug(`Retry ${trycount + 1}/${settings.maxRetries}: ${errorMsg}`);
        setTimeout(ModeOperationName, settings.retryDelay, log, NPU_IP, param, callback, settings, trycount + 1);
      } else {
        log.error(`FAIL after ${settings.maxRetries} retries: ${errorMsg}`);
        callback(error);
      }
    });
}
```

**Key aspects**:
1. `trycount = 0` default parameter
2. Recursive retry with incremented trycount
3. `setTimeout` for retry delay
4. Pass all original parameters on retry
5. Log retries at DEBUG, final failure at ERROR
6. Always call callback (success or failure)

---

## Error Handling

### Critical Patterns

#### 1. Always Call Callbacks

**BAD**:
```javascript
axios.get(url).catch(err => {
  log.error(err.message);
  // Missing: callback(err)
});
// HomeKit will hang waiting for response!
```

**GOOD**:
```javascript
axios.get(url)
  .then(response => callback(null, result))
  .catch(err => {
    log.error(err.message);
    callback(err);  // Critical!
  });
```

#### 2. XML Parsing Errors

**BAD**:
```javascript
parseXMLString(xml, (err, result) => {
  const value = result.Evolution.State;  // Crash if parse failed!
});
```

**GOOD**:
```javascript
parseXMLString(xml, (err, result) => {
  if (err) {
    log.error(`XML parse error: ${err.message}`);
    callback(new Error('XML parse error'));
    return;
  }

  const value = result?.Evolution?.State;
  if (value === undefined) {
    log.error('Missing State element in XML');
    callback(new Error('Invalid XML structure'));
    return;
  }

  callback(null, parseInt(value, 10));
});
```

#### 3. Network Timeouts

All axios requests **must** have timeout:

```javascript
axios.get(url, {
  timeout: settings.requestTimeout  // Required!
});
```

#### 4. Long-Polling Shutdown

Must support clean cancellation:

```javascript
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
this.longPollConnection = source;

axios.get(url, { cancelToken: source.token })
  .catch(error => {
    if (axios.isCancel(error)) {
      log.debug('Long-poll cancelled (shutdown)');
      return;  // Don't reconnect
    }
    // Other errors: reconnect
  });
```

### Validation Errors

**Throw during construction** (fail fast):

```javascript
function ModeLightingAccessory(log, config) {
  // Validate required fields
  if (!config.NPU_IP) {
    throw new Error('Missing required config field "NPU_IP"');
  }

  // Validate format
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(config.NPU_IP)) {
    throw new Error(`Invalid NPU_IP format: "${config.NPU_IP}"`);
  }

  // Validate range
  const brightness = parseInt(config.defaultBrightness, 10);
  if (brightness < 0 || brightness > 100) {
    throw new Error(`defaultBrightness must be 0-100, got: ${brightness}`);
  }

  // Validate mutual exclusivity
  if (hasChannel && hasScenes) {
    throw new Error('Cannot specify both channel and scene parameters');
  }
}
```

**Include in error messages**:
- Field name
- Expected format/range
- Received value
- Suggestion for fix (if applicable)

---

## Testing

### Manual Testing Scripts

#### test-discovery.js
```bash
node test-discovery.js
```
- Queries NPU configuration endpoint
- Displays all discovered channels and scenes
- Useful for debugging discovery issues
- **Before using**: Update NPU_IP in script

#### test-longpoll.sh
```bash
./test-longpoll.sh
```
- Monitors long-polling endpoint
- Logs state changes in real-time
- Displays response times
- **Before using**: Update NPU_IP in script

#### test-longpoll-simple.sh
```bash
./test-longpoll-simple.sh
```
- Interactive long-polling test
- Shows raw XML responses
- Good for understanding NPU behavior

### Testing Checklist

When making changes, test:

**Platform Plugin**:
- [ ] Discovery finds all channels
- [ ] Discovery finds all scenes
- [ ] Filters work correctly (channelFilter, sceneFilter)
- [ ] Accessories appear in Home app
- [ ] Cached accessories restored after Homebridge restart
- [ ] Stale accessories removed after config changes
- [ ] Long-polling updates HomeKit state
- [ ] Shutdown stops long-polling cleanly

**Accessory Plugin**:
- [ ] Channel mode controls brightness
- [ ] Scene mode activates scenes
- [ ] Non-dimmable channels work
- [ ] State queries return correct values
- [ ] Retries work on network errors
- [ ] Timeouts don't hang HomeKit

**Both Modes**:
- [ ] Error messages are clear
- [ ] Invalid configs throw errors on startup
- [ ] NPU unreachable doesn't crash plugin
- [ ] Concurrent requests handled correctly

### Debugging Tips

**Enable debug logging**:
- Homebridge `-D` flag shows debug logs
- Check for retry attempts, XML parse errors

**Common issues**:
- **Accessories not appearing**: Check NPU_IP, network connectivity
- **State not updating**: Check long-polling logs, NPU firmware
- **Brightness incorrect**: Check DMX conversion tables
- **Scenes not working**: Verify using `LoadId` not `SceneNo`

---

## Common Tasks

### Adding a New Configuration Parameter

1. **Add to constructor validation**:
```javascript
this.myParameter = config.myParameter !== undefined
  ? validateMyParameter(config.myParameter)
  : DEFAULT_VALUE;
```

2. **Add to config.schema.json**:
```json
{
  "myParameter": {
    "title": "My Parameter",
    "type": "number",
    "default": 100,
    "minimum": 0,
    "maximum": 1000,
    "description": "Description of what it does"
  }
}
```

3. **Update README.md** with example

4. **Update CHANGELOG.md** under "Added"

### Supporting a New NPU Feature

1. **Understand NPU API**: Use test scripts or NPU web interface
2. **Add module-level function**:
```javascript
function ModeNewFeature(log, NPU_IP, param, callback, settings, trycount = 0) {
  // Implement with retry pattern
}
```
3. **Integrate into accessory methods**
4. **Update documentation**

### Modifying Discovery Logic

**Location**: `parseAndCreateAccessories()` (lines 152-244)

1. **Add new device type** in `findChannels()` or `findScenes()`
2. **Update XML navigation** logic
3. **Add filter support** if needed
4. **Test with real NPU configuration**

### Changing Long-Polling Behavior

**Location**: `doLongPoll()` (lines 407-457)

**Be careful**: Long-polling is performance-critical

1. **Update LONG_POLLING constants** in config.js
2. **Modify reconnection logic** if needed
3. **Test shutdown behavior** (clean cancellation)
4. **Monitor for memory leaks** (recursive setTimeout)

---

## Domain Knowledge

### NPU (Network Processing Unit)

- Mode Lighting's central controller
- Runs embedded Linux with web interface
- HTTP API on port 80 (default)
- XML-based protocol
- Version: v1.3.2.1 (typical, may vary)

### DMX Protocol

- **Range**: 0-255 (8-bit)
- **0**: Off
- **255**: Full brightness
- **Non-linear perception**: Lookup tables compensate

### Channels vs Scenes

| Aspect | Channels | Scenes |
|--------|----------|--------|
| **Purpose** | Direct DMX control | Preset configurations |
| **Dimmable** | Yes (if DimmingType=2) | No |
| **State** | Stateful (remembered) | Stateless (momentary) |
| **HomeKit Service** | Lightbulb | Switch |
| **API Method** | setChannelToLevel | fadeScene |
| **Identifier** | Channel number (001) | Scene LoadId (42) |

### Scene Behavior

**Important**: Scenes are **stateless** in HomeKit:
1. User activates scene (switch ON)
2. Plugin calls `fadeScene` with `on_scene`
3. Plugin immediately sets switch to OFF
4. HomeKit shows momentary activation

**Why?** Scenes don't have a binary "on/off" state. They're commands, not states.

### Channel Addressing

- **Format**: 3-digit string ("001", "042", "100")
- **Range**: Typically 1-512 (DMX universe limit)
- **Discovery**: From `<LoadId>` in configuration XML
- **Must be strings**: "001" not 1 (API requirement)

### Scene Identification

**CRITICAL**: Use `LoadId`, NOT `SceneNo`!

- `<LoadId>`: API identifier (use this!)
- `<SceneNo>`: Display number (ignore)
- Example:
  ```xml
  <Scene>
    <LoadId>42</LoadId>    <!-- Use this for fadeScene -->
    <SceneNo>1</SceneNo>   <!-- Ignore this -->
    <Text>Evening</Text>
  </Scene>
  ```

### DimmingType

From NPU configuration:
- **1**: Switched (on/off only)
- **2**: Dimmable (supports brightness)

Auto-discovery uses this to set `dimmable` flag.

### Room Extraction

Platform plugin attempts to extract room from name:
```javascript
// Name: "Kitchen:1" → Room: "Kitchen"
const parts = accessoryName.split(':');
if (parts.length === 2) {
  accessory.context.room = parts[0];
}
```

HomeKit uses this for room grouping.

---

## Gotchas and Important Notes

### 1. Single File Architecture

**DO NOT** split index.js into multiple files without testing!

Homebridge plugins must export registration function from main file specified in package.json. Moving classes to separate files requires proper module.exports handling.

### 2. Callback Requirement

**Every HomeKit characteristic handler MUST call callback**:
```javascript
getPowerState(callback) {
  // Always call callback, even on error
  if (error) {
    callback(error);
  } else {
    callback(null, value);
  }
}
```

Missing callback = HomeKit hangs = bad user experience.

### 3. Long-Polling is Platform-Level

Not per-accessory! One long-poll connection for entire platform.

**Why?** Efficiency. 100 accessories = 1 connection, not 100.

### 4. Scene LoadId vs SceneNo

**Use LoadId for API calls**, not SceneNo:
```javascript
// CORRECT
ModeActivateScene(log, NPU_IP, scene.LoadId, callback, settings);

// WRONG
ModeActivateScene(log, NPU_IP, scene.SceneNo, callback, settings);
```

LoadId is the API identifier. SceneNo is just display order.

### 5. DMX Conversion Required

Never send percentage directly to NPU:
```javascript
// WRONG
setChannelToLevel(channel, percent);

// CORRECT
const dmxValue = pct2dmx[percent];
setChannelToLevel(channel, dmxValue);
```

### 6. UUID Changes Break Caching

Changing name, channel, or scene creates NEW accessory:
```javascript
const uuid = this.api.hap.uuid.generate(accessoryName + NPU_IP + (channel || on_scene));
```

Old accessory won't auto-remove. User must manually remove from Home app.

### 7. Service Type Mismatch

If cached accessory has wrong service type (Lightbulb vs Switch), must remove and re-add:
```javascript
const existingService = accessory.getService(Service.Lightbulb);
if (existingService && mode === 'scene') {
  accessory.removeService(existingService);
  accessory.addService(Service.Switch, accessoryName);
}
```

### 8. Brightness Caching

Two brightness values:
- `cachedBrightness`: User's last setting (for restore)
- `lastKnownState`: Current actual state (from long-polling)

Use `cachedBrightness` when turning on with no level specified.

### 9. updateValue vs setValue

- `updateValue()`: External change (long-polling, status query) - doesn't trigger handler
- `setValue()`: Programmatic change - **triggers handler** (avoid infinite loops!)

### 10. Axios Cancel Tokens

Must store cancel token to stop long-polling:
```javascript
const source = CancelToken.source();
this.longPollConnection = source;  // Store reference

// Later, on shutdown:
this.longPollConnection.cancel('Shutdown');
```

Without this, long-poll continues after Homebridge shutdown.

### 11. Placeholder Scene Filtering

Auto-discovery skips numeric-only scene names:
```javascript
// Skip scenes like "2121", "1234" (placeholders)
if (/^\d+$/.test(sceneName)) continue;
```

These are NPU placeholders, not real scenes.

### 12. explicitArray: false

xml2js option affects structure:
```javascript
parseXMLString(xml, { explicitArray: false }, callback);
```

**Result**: Single elements are objects, not arrays.
**Must handle both**:
```javascript
const modules = Array.isArray(devices.EDIN8ChDimmerModule)
  ? devices.EDIN8ChDimmerModule
  : [devices.EDIN8ChDimmerModule];
```

---

## Quick Reference

### File Locations

| Feature | File | Lines |
|---------|------|-------|
| Platform plugin | index.js | 29-661 |
| Accessory plugin | index.js | 666-1011 |
| NPU communication | index.js | 760-867 |
| DMX conversion | index.js | 8-11 |
| Configuration constants | config.js | 1-42 |
| UI schema | config.schema.json | - |

### Key Endpoints

| Purpose | Endpoint |
|---------|----------|
| Configuration | `/xml-dump?nocrlf=true&what=configuration&where=/` |
| Status (single) | `/xml-dump?nocrlf=true&what=status&where={channel}` |
| Status (all) | `/xml-dump?nocrlf=true&what=status&where=/` |
| Long-polling | `/xml-dump?nocrlf=true&longpoll=100&what=status&where=/` |
| XML-RPC | `/xml-rpc?1` (POST) |

### Configuration Ranges

| Parameter | Min | Max | Default |
|-----------|-----|-----|---------|
| requestTimeout | 1000ms | 30000ms | 5000ms |
| maxRetries | 0 | 20 | 10 |
| retryDelay | 100ms | 5000ms | 500ms |
| defaultBrightness | 0% | 100% | 100% |
| longpoll timeout | - | - | 100s |

### Common Log Messages

```javascript
// Discovery
this.log.info(`Discovered ${n} channels, ${m} scenes`);

// Long-polling
this.log.debug('Long-poll timeout (normal), reconnecting...');

// Retries
this.log.debug(`Retry ${trycount}/${maxRetries}: ${operation}`);

// Errors
this.log.error(`NPU: ${NPU_IP}, channel: ${channel}, error: ${err}`);
```

---

## Getting Help

- **Issues**: https://github.com/pluddy/homebridge-modelighting-v2/issues
- **Homebridge docs**: https://developers.homebridge.io/
- **NPU API**: Check test-*.js scripts for examples

---

## Version History

See CHANGELOG.md for detailed version history.

**Current version**: 0.3.0 (Platform plugin with auto-discovery)

---

**Last Updated**: 2025-01-11
**For**: homebridge-modelighting-v2 v0.3.0
