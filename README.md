# homebridge-modelighting-v2

Modern, improved Homebridge plugin for Mode Lighting eDinControl using Remote Control Interface.

## What's New in V2

- ✅ **Platform plugin with auto-discovery** - Automatically discovers all channels and scenes from your NPU
- ✅ **Dual-mode operation** - Supports both channel mode (dimming) and scene mode (switching)
- ✅ Modern dependencies (replaced deprecated `request` with `axios`)
- ✅ Robust error handling with automatic retries and timeouts
- ✅ User-configurable network settings
- ✅ Comprehensive input validation
- ✅ Modern JavaScript (ES6+)
- ✅ Better logging and debugging

## Installation

Install homebridge by following instructions on the homebridge website:
https://homebridge.io/

Install this plugin from NPM:

```bash
sudo npm install -g homebridge-modelighting-v2
```

Or install the latest development version directly from GitHub:

```bash
sudo npm install -g pluddy/homebridge-modelighting-v2
```
	
    Update your config.json configuration file. See sample-config.json in
	this repository for a sample.

# Getting Your Scene Information
	Scene numbers can be identified by navigating to the eDin web page 
	and looking at the event log as you change scenes. The values to configure in
	the config.json are in the Object column.

# Configuration

This plugin can be used in two ways:

1. **Platform Plugin (Recommended)** - Automatically discovers all channels and scenes from your NPU
2. **Accessory Plugin** - Manually configure individual channels and scenes

## Platform Plugin Configuration (Auto-Discovery)

The platform plugin automatically discovers all channels and scenes from your NPU and creates HomeKit accessories for them.

### Basic Platform Configuration

```json
{
  "platforms": [
    {
      "platform": "ModelightingV2Platform",
      "name": "Mode Lighting",
      "NPU_IP": "192.168.1.101"
    }
  ]
}
```

This will discover and expose **all** channels and scenes from your NPU.

### Platform Configuration with Filters

If you only want to expose specific channels or scenes:

```json
{
  "platforms": [
    {
      "platform": "ModelightingV2Platform",
      "name": "Mode Lighting",
      "NPU_IP": "192.168.1.101",
      "discoverChannels": true,
      "discoverScenes": true,
      "channelFilter": [9, 10, 15, 16],
      "sceneFilter": [24, 25, 38, 42]
    }
  ]
}
```

### Platform Configuration Options

- `platform`: Must be "ModelightingV2Platform"
- `name`: Display name for the platform
- `NPU_IP`: IP address of your Mode Lighting NPU (required)
- `discoverChannels`: Enable channel discovery (default: `true`)
- `discoverScenes`: Enable scene discovery (default: `true`)
- `channelFilter`: Array of channel LoadIds to include (optional, if omitted all channels are included)
- `sceneFilter`: Array of scene numbers to include (optional, if omitted all scenes are included)
- `requestTimeout`: HTTP timeout in ms (default: `5000`, range: 1000-30000)
- `maxRetries`: Max retry attempts (default: `10`, range: 0-20)
- `retryDelay`: Delay between retries in ms (default: `500`, range: 100-5000)

## Accessory Plugin Configuration (Manual)

If you prefer manual configuration or need more control over individual accessories, use the accessory plugin.

### Operation Modes

The accessory plugin supports two operation modes:

### Channel Mode (Direct DMX Control)

Control individual DMX channels directly with support for brightness/dimming.

### Scene Mode (Scene Activation)

Activate pre-configured scenes on the NPU. Scenes are not dimmable - they execute whatever lighting configuration is stored in the scene.

## Required Parameters

- `accessory`: Must be "ModelightingV2"
- `NPU_IP`: IP address of your Mode Lighting NPU (format: xxx.xxx.xxx.xxx)
- `name`: Display name for the light in HomeKit

**For Channel Mode:**

- `channel`: DMX channel number (e.g., "001", "042")

**For Scene Mode:**

- `on_scene`: Scene number to activate when turning on
- `off_scene`: Scene number to activate when turning off

**Note:** You must specify either `channel` OR both `on_scene`/`off_scene`, not both.

## Optional Parameters

**For Channel Mode Only:**

- `dimmable`: Enable brightness control (default: `true`)
- `defaultBrightness`: Brightness level (0-100) when turning on (default: `100`)

**For Both Modes:**

- `requestTimeout`: HTTP request timeout in milliseconds (default: `5000`, range: 1000-30000)
- `maxRetries`: Maximum retry attempts for failed requests (default: `10`, range: 0-20)
- `retryDelay`: Delay between retries in milliseconds (default: `500`, range: 100-5000)

## Configuration Examples

### Basic Channel Mode Configuration

```json
"accessories": [
	{
		"accessory": "ModelightingV2",
		"NPU_IP": "192.168.0.1",
		"name": "Bedroom Lamp",
		"channel": "001",
		"dimmable": true,
		"defaultBrightness": 80
	},
	{
		"accessory": "ModelightingV2",
		"NPU_IP": "192.168.0.1",
		"name": "Kitchen Table",
		"channel": "002",
		"dimmable": true,
		"defaultBrightness": 80
	}
]
```

### Scene Mode Configuration

```json
"accessories": [
	{
		"accessory": "ModelightingV2",
		"NPU_IP": "192.168.0.1",
		"name": "Evening Scene",
		"on_scene": "42",
		"off_scene": "0"
	},
	{
		"accessory": "ModelightingV2",
		"NPU_IP": "192.168.0.1",
		"name": "Party Mode",
		"on_scene": "100",
		"off_scene": "0"
	}
]
```

### Advanced Configuration with Custom Network Settings

For slow or unreliable networks:

```json
"accessories": [
	{
		"accessory": "ModelightingV2",
		"NPU_IP": "192.168.0.1",
		"name": "Remote Light",
		"channel": "001",
		"dimmable": true,
		"defaultBrightness": 100,
		"requestTimeout": 10000,
		"maxRetries": 15,
		"retryDelay": 1000
	}
]
```

## Migration from V1

If you're upgrading from the old `homebridge-modelighting` plugin:

1. Uninstall the old plugin: `sudo npm uninstall -g homebridge-modelighting`
2. Install this plugin: `sudo npm install -g homebridge-modelighting-v2`
3. Update your config.json: Change `"accessory": "modelightingv1"` to `"accessory": "ModelightingV2"`
4. Restart Homebridge

Your accessories will need to be re-added to HomeKit, but your existing configurations (IP addresses, channels, etc.) will work without changes.