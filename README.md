# homebridge-modelightingv1
homebridge-plugin for Mode Lighting eDinControl using Remote Control Interface

# Installation

    Install homebridge by following instructions on homebridge github pages:
		https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi#install-homebridge-and-dependencies

	Install this plugin from NPM using: sudo npm install -g homebridge-modelightingv1
	
	The latest Github development version of the plugin can also be installed directly
		sudo npm install -g maxlyth/homebridge-modelightingv1
	
    Update your config.json configuration file. See sample-config.json in
	this repository for a sample.

# Getting Your Scene Information
	Scene numbers can be identified by navigating to the eDin web page 
	and looking at the event log as you change scenes. The values to configure in
	the config.json are in the Object column.

# Configuration

Configuration sample:

	"accessories": [
		{
			"accessory": "modelightingv1",
			"NPU_IP": "192.168.0.1",
			"name": "Living Room",
			"on_scene": "001",
			"off_scene": "002"
		},
		{
			"accessory": "modelightingv1",
			"NPU_IP": "192.168.0.1",
			"name": "Kitchen",
			"on_scene": "003",
			"off_scene": "004"
		}
	]