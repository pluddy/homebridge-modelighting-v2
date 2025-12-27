#!/usr/bin/env node

// Test script to query NPU configuration and see the XML structure

const axios = require('axios');
const parseXMLString = require('xml2js').parseString;

const NPU_IP = process.argv[2] || '192.168.1.101';

console.log(`Testing NPU discovery at ${NPU_IP}...\n`);

axios.get(`http://${NPU_IP}/xml-dump?nocrlf=true&what=configuration&where=/`, {
  headers: {
    'Content-Type': 'application/xml'
  },
  timeout: 10000,
  validateStatus: function (status) {
    return status === 200;
  }
})
.then((response) => {
  console.log('✓ Successfully received NPU configuration\n');
  console.log('Raw XML (first 500 chars):');
  console.log(response.data.substring(0, 500));
  console.log('...\n');

  parseXMLString(response.data, (err, result) => {
    if (err) {
      console.error('✗ Failed to parse XML:', err.message);
      return;
    }

    console.log('✓ Successfully parsed XML\n');
    console.log('Parsed structure (JSON):');
    console.log(JSON.stringify(result, null, 2));

    // Try to find channels
    console.log('\n=== CHANNEL DISCOVERY ===');
    const channels = [];

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
              const name = channel.$ && channel.$.Text ? channel.$.Text : null;

              if (loadId) {
                channels.push({
                  number: String(loadId).padStart(3, '0'),
                  name: name || `Channel ${loadId}`
                });
              }
            });
          }
        });
      }
    }

    if (channels.length > 0) {
      console.log(`Found ${channels.length} channels:`);
      channels.forEach((channel, index) => {
        console.log(`  ${index + 1}. Channel ${channel.number}: ${channel.name}`);
      });
    } else {
      console.log('No channels found');
    }

    // Try to find scenes
    console.log('\n=== SCENE DISCOVERY ===');
    const scenes = [];

    if (result.Evolution && result.Evolution.Scenes && result.Evolution.Scenes[0]) {
      const scenesData = result.Evolution.Scenes[0];

      if (scenesData.Scene) {
        const sceneArray = Array.isArray(scenesData.Scene)
          ? scenesData.Scene
          : [scenesData.Scene];

        sceneArray.forEach(scene => {
          const sceneNo = scene.SceneNo && scene.SceneNo[0] ? scene.SceneNo[0] : null;
          const loadId = scene.$ && scene.$.LoadId ? scene.$.LoadId : null;
          const name = scene.$ && scene.$.Text ? scene.$.Text : null;

          // Skip scenes with placeholder names like "2121" or empty names
          if (name && (name === "2121" || name.match(/^[0-9]+$/))) {
            return; // Skip this scene
          }

          const number = sceneNo || loadId;

          if (number && name) {
            scenes.push({
              number: String(number),
              name: name
            });
          }
        });
      }
    }

    if (scenes.length > 0) {
      console.log(`Found ${scenes.length} scenes:`);
      scenes.forEach((scene, index) => {
        console.log(`  ${index + 1}. Scene ${scene.number}: ${scene.name}`);
      });
    } else {
      console.log('No scenes found');
    }
  });
})
.catch((error) => {
  const errorMsg = error.response ? error.response.status : (error.code || error.message);
  console.error(`✗ Failed to query NPU: ${errorMsg}`);
  console.error('Make sure:');
  console.error('  1. The NPU is powered on and connected to the network');
  console.error('  2. The IP address is correct');
  console.error('  3. Your computer can reach the NPU');
});
