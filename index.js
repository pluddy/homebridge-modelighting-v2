// Homebridge Plugin for Mode Lighting System using Remote Control Interface
// Need to enhance with more error checking

var request = require('request');
var parseXMLString = require('xml2js').parseString;

var dmx2pct = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 23, 23, 23, 24, 24, 24, 25, 25, 26, 26, 26, 27, 27, 28, 28, 28, 29, 29, 30, 30, 30, 31, 31, 32, 32, 32, 33, 33, 34, 34, 34, 35, 35, 36, 36, 36, 37, 37, 37, 38, 38, 38, 39, 39, 40, 40, 40, 41, 41, 42, 42, 42, 43, 43, 44, 44, 44, 45, 45, 46, 46, 46, 47, 47, 48, 48, 48, 49, 49, 49, 50, 50, 51, 51, 51, 52, 52, 53, 53, 53, 54, 54, 55, 55, 55, 56, 56, 57, 57, 57, 58, 58, 59, 59, 59, 60, 60, 61, 61, 61, 62, 62, 62, 63, 63, 63, 64, 64, 65, 65, 65, 66, 66, 67, 67, 67, 68, 68, 69, 69, 69, 70, 70, 71, 71, 71, 72, 72, 73, 73, 73, 74, 74, 74, 75, 75, 76, 76, 76, 77, 77, 78, 78, 79, 79, 79, 80, 80, 80, 81, 81, 82, 82, 82, 83, 83, 84, 84, 84, 85, 85, 86, 86, 86, 87, 87, 87, 88, 88, 88, 89, 89, 90, 90, 90, 91, 91, 92, 92, 92, 93, 93, 94, 94, 94, 95, 95, 96, 96, 96, 97, 97, 98, 98, 98, 99, 99, 100, 100];
var pct2dmx = [0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40, 42, 45, 47, 50, 52, 55, 57, 60, 63, 65, 68, 70, 73, 75, 78, 80, 83, 85, 88, 90, 93, 96, 99, 101, 104, 106, 109, 111, 114, 116, 119, 121, 124, 127, 129, 132, 134, 137, 139, 142, 144, 147, 149, 152, 154, 157, 160, 163, 165, 168, 170, 173, 175, 178, 180, 183, 185, 188, 191, 193, 196, 198, 201, 203, 206, 208, 211, 213, 216, 218, 221, 224, 227, 229, 232, 234, 237, 239, 242, 244, 247, 249, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255];

var Service, Characteristic;

module.exports = function(homebridge) {
  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-modelightingv1", "modelightingv1", ModeLightingAccessory);
};

function ModeLightingAccessory(log, config) {
  this.log = log;

  // Get config.json information for NPU IP Address, Room Name,
  // On Scene Number and Off Scene Number
  this.NPU_IP = config.NPU_IP;
  this.name = config.name;
  this.channel = config.channel;
  this.dimmable = config.dimmable;
  this.defaultBrightness = config.defaultBrightness;

  if (!this.name || !this.channel || !this.NPU_IP) {
    this.log('Invalid entry in config.json');
    this.log('NPU Address: ' + this.NPU_IP + ', Name:' + this.name + ', Channel:' + this.channel);
  }
}

function ModeSetChannel(log, NPU_IP, channel, percent, callback, trycount = 0) {
  var dmx = pct2dmx[percent];
  var payload = '<?xml version="1.0"?><methodCall>\n<methodName>setChannelToLevel</methodName><params><param>'+channel+'</param><param>'+dmx+'</param></params></methodCall>';
  var options = {
    url: 'http://' + NPU_IP + '/xml-rpc?1',
    contentType: 'application/xml',
    method: 'POST',
    headers: {
      'Content-Length': Buffer.byteLength(payload, 'utf8'),
      'Content-Type': 'application/xml'
    },
    body: Buffer.from(payload, 'utf8')
  };
  trycount++;
  request.post(options,
    function(error, response, body) {
      if (error) {
        if (trycount < 10) {
          log.debug('Retry:'+trycount+', NPU:' + NPU_IP + ', cmd:setChannelToLevel, channel: '+ channel + ', pct:' + percent +', error: ' + error +', code:'+error.code);
          setTimeout(ModeSetChannel, 500, log, NPU_IP, channel, percent, callback, trycount);
        } else {
          log.error('FAIL! NPU:' + NPU_IP + ', cmd:setChannelToLevel, channel: '+ channel + ', pct:' + percent +', error: ' + error +', code:'+error.code);
        }
      } else if (response.statusCode > 200) {
        if (trycount < 10) {
          log.debug('Retry:'+trycount+', NPU:' + NPU_IP + ', cmd:setChannelToLevel, channel: '+ channel + ', pct:' + percent +', response: ' + response.statusMessage +', code:'+response.statusCode);
          setTimeout(ModeSetChannel, 500, log, NPU_IP, channel, percent, callback, trycount);
        } else {
          log.error('FAIL! NPU:' + NPU_IP + ', cmd:setChannelToLevel, channel: '+ channel + ', pct:' + percent +', response: ' + response.statusMessage +', code:'+response.statusCode);
        }
      } else {
        log.info('NPU:' + NPU_IP + ', cmd:setChannelToLevel, channel: ' + channel + ', pct:' + percent + ', try:'+trycount);
        callback(null, 0);
      }
    }
  );
}
function ModeGetChannel(log, NPU_IP, channel, callback, trycount = 0) {
  var options = {
    url: 'http://' + NPU_IP + '/xml-dump?nocrlf=true&what=status&where='+channel,
    contentType: 'application/xml'
  };
  trycount++;
  request.get(options,
    function(error, response, body) {
      if (error) {
        if (trycount < 10) {
          log.debug('Retry:'+trycount+', NPU:' + NPU_IP + ', getChannel:'+ channel +', error:' + error +', code:'+error.code);
          setTimeout(ModeGetChannel, 500, log, NPU_IP, channel, callback, trycount);
        } else {
          log.error('FAIL! NPU:' + NPU_IP + ', getChannel:'+ channel +', error:' + error +', code:'+error.code);
        }
      } else if (response.statusCode > 200) {
        if (trycount < 10) {
          log.debug('Retry:'+trycount+', NPU:' + NPU_IP + ', getChannel:'+ channel +', response:' + response.statusMessage +', code:'+response.statusCode);
          setTimeout(ModeGetChannel, 500, log, NPU_IP, channel, callback, trycount);
        } else {
          log.error('FAIL! NPU:' + NPU_IP + ', getChannel:'+ channel +', response:' + response.statusMessage +', code:'+response.statusCode);
        }
      } else {
        //log.debug('WebServer request result: ' + body);
        parseXMLString(body, function (err, result) {
          var state = result.Evolution.SlavePowerChannel[0].State;
          var percent = dmx2pct[state];
          log.info('NPU:' + NPU_IP + ', getChannel:' + channel + ', state:' + state + ', pct:' + percent + ', try:'+trycount);
          callback(null, state);
        });
      }
    }
  );
}


ModeLightingAccessory.prototype = {
  getPowerState: function(callback) {
    ModeGetChannel(this.log, this.NPU_IP, this.channel, callback);
  },
  setPowerState: function(powerOn, callback) {
    ModeSetChannel(this.log, this.NPU_IP, powerOn ? this.defaultBrightness : 0, callback);
  },
  getBrightness: function(callback) {
    ModeGetChannel(this.log, this.NPU_IP, this.channel, callback);
  },
  setBrightness: function(brightness, callback) {
    ModeSetChannel(this.log, this.NPU_IP, brightness, callback);
  },
  identify: function(callback) {
    this.log("identify: Identify requested!");
    callback(); // success
  },
  getServices: function() {

    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Mode Lighting")
      .setCharacteristic(Characteristic.Model, "NPU v1.3.2.1")
      .setCharacteristic(Characteristic.SerialNumber, "123456");

    var lightService = new Service.LightBulb(this.name);
    lightService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setPowerState.bind(this))
      .on('get', this.getPowerState.bind(this));
    if (this.dimmable) {
      lightService
        .getCharacteristic(Characteristic.Brightness)
        .on('set', this.getBrightness.bind(this))
        .on('get', this.setBrightness.bind(this));
    }
    
    return [informationService, lightService];
  }
};
