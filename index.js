// Homebridge Plugin for Mode Lighting System using Remote Control Interface
// Need to enhance with more error checking

var request = require('request');
var parseXMLString = require('xml2js').parseString;

var Service, Characteristic;

module.exports = function(homebridge) {
  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-modelightingv1", "modelightingv1", ModeLightingAccessory);
};

function ModeLightingAccessory(log, config) {
  this.log = log;

  // Get config.json informatio for NPU IP Address, Room Name,
  // On Scene Number and Off Scene Number
  this.NPU_IP = config.NPU_IP;
  this.name = config.name;
  this.on_scene = config.on_scene;
  this.off_scene = config.off_scene;

  if (!this.name || !this.on_scene || !this.off_scene || !this.NPU_IP) {
    this.log('Invalid entry in config.json');
    this.log('NPU Address is ' + this.NPU_IP + ' Name is ' + this.name +
      ' On Scene is ' + this.on_scene + 'Off Scene is ' + this.off_scene);
  }
}

function ModeSetScene(NPU_IP, scene, callback, trycount = 0) {
  var payload = '<?xml version="1.0"?><methodCall>\n<methodName>fadeScene</methodName><params><param>'+scene+'</param></params></methodCall>';
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
  request.post(options,
    function(error, response, body) {
      if (error) {
        if (trycount < 3) {
          this.log('Retry:'+(trycount+1)+', NPU:' + NPU_IP + ', cmd:fadeScene, scene: '+ scene +', error: ' + error +', code:'+error.code);
          setTimeout(ModeSetScene(NPU_IP, scene, callback, trycount+1), 500);
        } else {
          this.log('FAIL! NPU:' + NPU_IP + ', cmd:fadeScene, scene: '+ scene +', error: ' + error +', code:'+error.code);
        }
      } else if (response.statusCode > 200) {
        if (trycount < 3) {
          this.log('Retry:'+(trycount+1)+', NPU:' + NPU_IP + ', cmd:fadeScene, scene: '+ scene +', response: ' + response.statusMessage +', code:'+response.statusCode);
          setTimeout(ModeSetScene(NPU_IP, scene, callback, trycount+1), 500);
        } else {
          this.log('FAIL! NPU:' + NPU_IP + ', cmd:fadeScene, scene: '+ scene +', response: ' + response.statusMessage +', code:'+response.statusCode);
        }
      } else {
        this.log('NPU:' + NPU_IP + ', cmd:fadeScene, scene: ' + scene + ', try:'+trycount);
        callback(null, 0);
      }
    }
  );
}
function ModeGetScene(NPU_IP, scene, callback, trycount = 0) {
  var options = {
    url: 'http://' + NPU_IP + '/xml-dump?nocrlf=true&what=status&where='+scene,
    contentType: 'application/xml'
  };
  request.get(options,
    function(error, response, body) {
      if (error) {
        if (trycount < 3) {
          this.log('Retry:'+(trycount+1)+', NPU:' + NPU_IP + ', getscene:'+ scene +', error:' + error +', code:'+error.code);
          setTimeout(ModeGetScene(NPU_IP, scene, callback, trycount+1), 500);
        } else {
          this.log('FAIL! NPU:' + NPU_IP + ', getscene:'+ scene +', error:' + error +', code:'+error.code);
        }
      } else if (response.statusCode > 200) {
        if (trycount < 3) {
          this.log('Retry:'+(trycount+1)+', NPU:' + NPU_IP + ', getscene:'+ scene +', response:' + response.statusMessage +', code:'+response.statusCode);
          setTimeout(ModeGetScene(NPU_IP, scene, callback, trycount+1), 500);
        } else {
          this.log('FAIL! NPU:' + NPU_IP + ', getscene:'+ scene +', response:' + response.statusMessage +', code:'+response.statusCode);
        }
      } else {
        //this.log('WebServer request result: ' + body);
        parseXMLString(body, function (err, result) {
          var active = result.Evolution.Scene[0].Active[0];
          this.log('NPU:' + NPU_IP + ', getscene:' + scene + ', active:' + active + ', try:'+trycount);
          callback(null, active);
        });
      }
    }
  );
}


ModeLightingAccessory.prototype = {
  getPowerState: function(callback) {
    ModeGetScene(this.NPU_IP, this.on_scene, callback);
  },
  setPowerState: function(powerOn, callback) {
    ModeSetScene(this.NPU_IP, powerOn ? this.on_scene : this.off_scene, callback);
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

    var switchService = new Service.Switch(this.name);
    switchService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setPowerState.bind(this))
      .on('get', this.getPowerState.bind(this));

    return [informationService, switchService];
  }
};
