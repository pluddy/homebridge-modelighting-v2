# Changelog

All notable changes to homebridge-modelighting-v2 will be documented in this file.

## [0.3.0] - 2025-12-27

### Major Improvements

#### Platform Plugin with Auto-Discovery

- **NEW**: Platform plugin that automatically discovers all channels and scenes from your NPU
- Query NPU configuration endpoint (`/xml-dump?nocrlf=true&what=configuration&where=/`) on startup
- Automatically parse XML to extract all configured channels and scenes
- Create HomeKit accessories for each discovered channel and scene
- Optional filtering: Configure `channelFilter` and `sceneFilter` to only expose specific channels/scenes
- Smart filtering: Automatically skips placeholder scenes (e.g., "2121" or numeric-only names)
- Discovery options: Toggle `discoverChannels` and `discoverScenes` independently
- Works alongside existing accessory plugin - can use both in same config
- Uses same network settings (timeout, retries) as accessory plugin

#### Dual-Mode Operation Support

- **NEW**: Added scene mode alongside channel mode
- Scene mode: Activate pre-configured NPU scenes via `on_scene`/`off_scene` parameters
- Channel mode: Direct DMX channel control with brightness support (existing functionality)
- Automatic mode detection based on configuration
- Validation ensures only one mode is configured per accessory
- Scene mode uses `fadeScene` XML-RPC method for smooth transitions (matching original plugin)
- Scene mode uses Switch service (appears as switch in Home app, not lightbulb)
- Channel mode uses Lightbulb service (appears as light with brightness control)
- Scene mode accessories are automatically non-dimmable (scenes execute fixed configurations)
- Scene state querying: Plugin checks if `on_scene` is active to show correct switch state in Home app

#### Replaced Deprecated Dependencies

- **BREAKING**: Replaced deprecated `request` library with modern `axios`
- Removed 42 deprecated npm packages from dependency tree
- Better performance and security

#### Enhanced Error Handling

- Fixed critical bug where `ModeGetChannel` didn't call callback on errors (would leave HomeKit hanging)
- Added request timeouts (default: 5000ms) to prevent indefinite hangs
- Added XML parsing error handling with try/catch blocks
- Added validation for response structure
- Better error messages showing HTTP status codes or error types

#### User-Configurable Network Settings

- Added `requestTimeout` parameter (range: 1000-30000ms, default: 5000ms)
- Added `maxRetries` parameter (range: 0-20, default: 10)
- Added `retryDelay` parameter (range: 100-5000ms, default: 500ms)
- All settings validated and clamped to safe ranges
- Per-accessory settings (useful for NPUs on different networks)

#### Configuration Validation

- Added comprehensive validation for all config fields
- Validates required fields (`name`, `channel`, `NPU_IP`)
- Validates IP address format with regex
- Validates `defaultBrightness` range (0-100)
- Validates `dimmable` is boolean type
- Throws clear error messages on startup instead of silent failures
- Added sensible defaults: `dimmable: true`, `defaultBrightness: 100`

#### Code Modernization

- Replaced all `var` declarations with `const`/`let`
- Converted all string concatenations to template literals
- Added helpful code comments and documentation
- Improved function organization and readability
- Modern ES6+ JavaScript throughout

#### Configuration Management

- Extracted hardcoded constants to separate `config.js` file
- Centralized network settings for easy modification
- Device information (manufacturer, model) in config

### Breaking Changes

- **Accessory Type Changed**: Update `config.json` from `"accessory": "modelightingv1"` to `"accessory": "ModelightingV2"`
- Accessories will need to be re-added to HomeKit after upgrade
- Package name changed to `homebridge-modelighting-v2`

### Bug Fixes

- Fixed callback not being called when `ModeGetChannel` fails after all retries
- Fixed potential crashes from XML parsing errors
- Fixed missing error handling for network timeouts
- Fixed poor error messages that didn't show actual error codes

### Documentation

- Updated README with comprehensive configuration guide
- Documented all parameters with defaults and ranges
- Added basic and advanced configuration examples
- Added scene mode examples alongside channel mode
- Added migration guide from V1
- Added "What's New in V2" section

## [0.0.9] - 2019-04-11 (Original)

Initial release by homeautomator
