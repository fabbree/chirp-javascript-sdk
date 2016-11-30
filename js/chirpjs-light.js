"use strict";

var ChirpAudio = function () {

  var that = {};
  /* jshint -W056 */
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();


  /*-----------------------------------------------------------------------*
   * general audio state
   *-----------------------------------------------------------------------*/
  var phase = 0.0;
  var amp = 0.25;
  var freq = 0;
  var freqTarget = 0;
  var freqChangePerSample = 0.0;
  var samplerate = 44100.0;
  var wavetablesize = 1024;

  if (audioCtx.sampleRate) {
    samplerate = parseFloat(audioCtx.sampleRate);
  }

  /*-----------------------------------------------------------------------*
   * chirp settings
   *-----------------------------------------------------------------------*/
  var sampleindex = 0;
  var letterindex = 0;
  var letterposition = 0;
  var shortcode = "";
  var fundamental = 1760.0;
  var alphabet = "0123456789abcdefghijklmnopqrstuv";
  var noteratio = 1.0594630943591;

  /*-----------------------------------------------------------------------*
   * envelope variables
   *-----------------------------------------------------------------------*/
  var portaLength = 0.008;
  var envLength = 0.0872;
  var envAttack = 0.15 * envLength;
  var envRelease = 0.15 * envLength;
  var envLengthSamples = Math.round(envLength * samplerate);
  var envAttackSamples = Math.round(envAttack * samplerate);
  var envReleaseSamples = Math.round(envRelease * samplerate);
  var envSustainSamples = Math.round((envLength - envAttack - envRelease) * samplerate);
  var portaSamples = Math.round(portaLength * samplerate);

  /*-----------------------------------------------------------------------*
   * initialise our sine wavetable
   *-----------------------------------------------------------------------*/
  var wavetable = new Array(wavetablesize);
  for (var i = 0; i < wavetablesize + 2; i++) {
    wavetable[i] = Math.sin(Math.PI * 2.0 * i / wavetablesize);
  }

  var source;
  /*-----------------------------------------------------------------------*
   * function for wavetable interpolation (gives smooth porta)
   *-----------------------------------------------------------------------*/
  that.interpolate = function (phase) {
    var phaseInt = Math.floor(phase);
    var phaseFrac = phase - phaseInt;
    var value = wavetable[phaseInt];
    var interp = phaseFrac * (wavetable[phaseInt + 1] - wavetable[phaseInt]);
    return value + interp;
  };

  that.letterFreq = function (letter) {
    var index = alphabet.indexOf(letter);
    return fundamental * Math.pow(noteratio, index);
  };

  that.init = function () {

    if (that.audio) {
      return;
    }

    /*-----------------------------------------------------------------------*
     * Setup our web audio context
     * TODO: indicate whether web audio is available
     *-----------------------------------------------------------------------*/
    try {
      /*-----------------------------------------------------------------------*
       * AudioContext used in FF, webKit in Safari/Chrome.
       *-----------------------------------------------------------------------*/
      that.audio = new (window.AudioContext || window.webkitAudioContext)();
      that.audio.createGain();

      var bufferNode = that.audio.createBufferSource();

      source = that.audio.createScriptProcessor(4096, 1, 2);
      source.onaudioprocess = that.process;

      /*-----------------------------------------------------------------------*
       * This bufferNode is some strange voodoo needed to get this to work
       * in iOS6. Seems to break chrome though, so comment out for now.
       *-----------------------------------------------------------------------*/
      bufferNode.connect(source);
      source.connect(that.audio.destination);
      // bufferNode.noteOn(0);
    }
    catch (err) {
      that.audio = false;
    }
    //console.log("Successfully initialised audio.");
  };

  /*-----------------------------------------------------------------------*
   * updates our shortcode and sets position to 0
   *-----------------------------------------------------------------------*/
  that.play = function (_shortcode) {
    //console.log('samplerate' + samplerate);
    //console.log("Playing code " + _shortcode);
    if (!that.audio) {
      //console.log("Initialising audio");
      that.init();
    }

    shortcode = 'hj' + _shortcode;
    sampleindex = -1;
    letterindex = -1;
  };

  /*-----------------------------------------------------------------------*
   * fill audio buffer
   *-----------------------------------------------------------------------*/
  that.process = function (event) {
    var left = event.outputBuffer.getChannelData(0);
    var right = event.outputBuffer.getChannelData(1);

    for (var i = 0; i < left.length; i++) {
      sampleindex += 1;

      if (sampleindex % envLengthSamples === 0) {
        letterindex += 1;
        letterposition = -1;
        freqTarget = that.letterFreq(shortcode[letterindex]);
        if (!freq) {
          freq = freqTarget;
        }
        freqChangePerSample = (freqTarget - freq) / portaSamples;
      }
      letterposition += 1;

      /*-----------------------------------------------------------------------*
       * portamento
       *-----------------------------------------------------------------------*/
      if (letterposition < portaSamples) {
        freq += freqChangePerSample;
      }

      var letterAmp = 0.0;
      if (letterposition < envAttackSamples) {
        letterAmp = (letterposition / envAttackSamples) * amp;
      }
      else if (letterposition < envAttackSamples + envSustainSamples) {
        letterAmp = amp;
      }
      else if (letterposition < envAttackSamples + envSustainSamples + envReleaseSamples) {
        letterAmp = amp * (1.0 - (letterposition - envAttackSamples - envSustainSamples) / envReleaseSamples);
      }

      /*-----------------------------------------------------------------------*
       * TODO: amplitude envelope
       *-----------------------------------------------------------------------*/
      left[i] = that.interpolate(phase) * letterAmp;
      right[i] = left[i];

      /*-----------------------------------------------------------------------*
       * update our wavetable ptr
       *-----------------------------------------------------------------------*/
      phase += freq * wavetablesize / samplerate;
      if (phase > wavetablesize) {
        phase -= wavetablesize;
      }

      /*-----------------------------------------------------------------------*
       * if we've already played the entire chirp, output silence
       * TODO: this should happen before the playback logic (minimise CPU)
       *-----------------------------------------------------------------------*/
      if (sampleindex > envLengthSamples * shortcode.length) {
        left[i] = 0;
        right[i] = 0;
      }
    }
  };

  // we no longer want to immediately init for iOS 6 devices as the
  // initial audio connection needs to be triggered by a user action.
  // that.init();

  return that;
};



var ChirpError = function(code, message) {
  var errors = {
    "10000": {
      code: 10000,
      message: "Account not active"
    },
    "10001": {
      code: 10001,
      message: "No credentials were provided"
    },
    "10002": {
      code: 10002,
      message: "Credentials provided are invalid"
    },
    "11000": {
      code: 11000,
      message: "Chirps create permission required"
    },
    "11001": {
      code: 11001,
      message: "Chirps read permission required"
    },
    "11004": {
      code: 11004,
      message: "Chirps say permission required"
    },
    "11006": {
      code: 11006,
      message: "Chirps encode permission required"
    },
    "11008": {
      code: 11008,
      message: "Chirps wav permission required"
    },
    "20400": {
      code: 20400,
      message: "Invalid request"
    },
    "20401": {
      code: 20401,
      message: "Unauthorized: Retry with valid authentication token."
    },
    "20403": {
      code: 20403,
      message: "Forbidden: Well-formed authentication token, but invalid credentials or bad origin"
    },
    "20404": {
      code: 20404,
      message: "Not found"
    },
    "20500": {
      code: 20500,
      message: "Internal server error"
    },
    "20503": {
      code: 20503,
      message: "Service Unavailable: Back-end server is at capacity"
    },
    "21000": {
      code: 21000,
      message: "Connection failure reaching API server"
    },
    "21002": {
      code: 21002,
      message: "The JSON payload specified is invalid"
    },
    "30000": {
      code: 30000,
      message: "Generic error."
    },
    "32000": {
      code: 32000,
      message: "Identifier/message is invalid"
    }
  };
  if (!errors[code]) {
    this.code = 30000;
    this.message = errors[3000].message + (message ? " " + message : "");
  } else {
    this.message = errors[code].message;
    this.code = errors[code].code;
  }

  return this;
};
ChirpError.prototype = new Error();


// Requires jQuery

var ChirpNetwork = function (key) {

  var self = this;
  self.key = key;

  var baseUrl = 'https://api.chirp.io/v1/';

//-----------------------------------------
// network functions
//-----------------------------------------

  self.call = function (endpoint, data, method, success, error) {
    var ajaxData = {
      type: method,
      url: baseUrl + endpoint,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      success: success,
      error: error
    };

    if (data !== null) {
      ajaxData.data = JSON.stringify(data);
    }

    if (isAuthenticated()) {
      ajaxData.headers = {'X-Auth-Token': store.get("auth").access_token};
    }

    jQuery.ajax(ajaxData);
  };

//-----------------------------------------
// chirp functions
//-----------------------------------------

  self.encode = function (shortcode, callback) {
    self.call('chirps/encode/' + shortcode, null, 'GET',
      function (data) {
        if (callback) {
          callback(null, data.longcode);
        }
      },
      errorHandler('encode', callback));
  };

  self.create = function (data, callback) {
    self.call('chirps', {data: data}, 'POST',
      function (data) {
        if (callback) {
          callback(null, data);
        }
      },
      errorHandler('create', callback));
  };

  self.read = function (shortcode, callback) {
    self.call('chirps/' + shortcode, null, 'GET',
      function (data) {
        if (callback) {
          callback(null, data);
        }
      },
      errorHandler('read', callback));
  };

  self.authenticate = function (callback, force) {
    var err;
    var authKeyRegEx = /^[a-zA-Z0-9]{25}$/;

    //Verify and validate key
    if (!self.key) {
      err = new ChirpError(10001);
    } else if (!self.key.match(authKeyRegEx)) {
      err = new ChirpError(10002);
    }
    if (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
      return;
    }
    //if force authenticate skip verification.
    if (!force && isAuthenticated()) {
      var auth = store.get("auth");
      if (callback) {
        callback(null, auth);
      }
      return auth;
    }

    removeAuth();
    var url = 'authenticate/' + self.key + '?device_id=' + store.get("auth").deviceId;
    self.call(
      url,
      null,
      'GET',
      function (data) {
        self.auth = data;
        data.deviceId = store.get("auth").deviceId;
        data.key = self.key;
        store.set("auth", data);
        if (callback) {
          callback(null, data);
        }
      },
      errorHandler("authenticate", callback));
  };
//-----------------------------------------
// helper functions
//-----------------------------------------

  /**
   * Generate uuid function
   * @returns {string}
   */
  function makeUuid() {
    var crypto = window.crypto || window.msCrypto;

    function randomDigit() {
      if (crypto && crypto.getRandomValues) {
        var rands = new Uint8Array(1);
        crypto.getRandomValues(rands);
        return (rands[0] % 16).toString(16);
      } else {
        return ((Math.random() * 16) | 0).toString(16);
      }
    }

    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
  }

  /**
   * Checks if user is authenticated, if is not authentication data is deleted
   * @returns {boolean}
   */
  function isAuthenticated() {
    var authenticated = true;
    var auth = store.get("auth"); //store (from store-js) is an localStorage object
    //authenticated = false if there is no auth object in localStorage or we have new authentication key
    if (!auth || typeof auth !== 'object' || auth.key !== self.key) {
      authenticated = false;
    } else {
      //Check if authentication does not expired.
      var expiresAt = new Date(auth.expires_at);
      var dateIsValid = !isNaN( expiresAt.getTime() );
      var now = new Date();
      if (!dateIsValid || now >= expiresAt) {
        authenticated = false;
      }
    }
    return authenticated;
  }

  function removeAuth() {
    var auth = store.get("auth");
    auth = {
      deviceId: !auth ? makeUuid() : auth.deviceId    //generate new deviceId if we don't have one
    };
    store.remove("auth");
    store.set("auth", auth); //save same deviceId in localStorage.
  }

  /**
   * Error Handler for http errors.
   * If callback is provided, it will be called with a new ChirpError as a first argument.
   * Otherwise, it will throw an new ChirpError
   * @param endpoint -  endpoint that was returned error
   * @param callback - (optional)
   * @returns {Function}
   */
  function errorHandler (endpoint, callback) {
    return function (httpError) {

      var error;
      var auth = store.get("auth");
      if (auth.access && !auth.access.enabled) {
        error = new ChirpError(10000);
        self.authenticate(null, true);
      }

      //try to re-authenticate if request failed
      if ([403, 401].indexOf(httpError.status) !== -1 && endpoint !== 'authenticate') {
        self.authenticate(null, true);
      }
      //verify if connection error
      if (!error && [0, -1].indexOf(httpError.status) !== -1) {
        error = new ChirpError(21000);
      }
      if (!error) {
        switch (endpoint) {

          case "encode":
            if (httpError.status === 403) {
              error = new ChirpError(11006);
            } else if (httpError.status === 401) {
              error = new ChirpError(20401);
            }
            break;

          case "read":
            if (httpError.status === 403) {
              error = new ChirpError(11001);
            } else if (httpError.status === 401) {
              error = new ChirpError(20401);
            }
            break;

          case "create":
            if (httpError.status === 403) {
              error = new ChirpError(11000);
            } else if (httpError.status === 401) {
              error = new ChirpError(20401);
            }
            break;

          case "authenticate":
            if (httpError instanceof ChirpError) {
              error = httpError;
            } else {
              error = new ChirpError(20 + '' + httpError.status);
            }
            break;

          default:
            error = new ChirpError(30000, httpError.message);
        }
      }

      if (callback) {
        callback(error);
      } else {
        throw error;
      }

    };
  }

  return self;
};


// Requires jQuery

var ChirpAnalytics = function(accessToken, sdk_version)
{

  var self = this;
  self.accessToken = accessToken;
  self.sdk_version = sdk_version;

  self.meta = {
    "os": window.navigator.platform.replace(" ", "-"),
    "os_version": window.navigator.platform.replace(" ", "-").replace("_", "-"),
    "sdk_version": self.sdk_version.replace(" ", "-")
  };

  var baseUrl = 'https://analytics.chirp.io/v1/';


//-----------------------------------------
// network functions
//-----------------------------------------

  self.call = function(endpoint, data, method, success, error)
  {
    var ajaxData = {
      type : method,
      url : baseUrl + endpoint,
      contentType: "application/json; charset=utf-8",
      dataType : "json",
      crossDomain: true,
      success: success,
      error: error
    };

    if (data !== null) {
      ajaxData.data = JSON.stringify(data);
    }

    if (self.accessToken) {
      ajaxData.headers = {'X-Auth-Token':self.accessToken};
    }

    jQuery.ajax(ajaxData);
  };

//-----------------------------------------
// chirp analytics functions
//-----------------------------------------

  self.say = function(shortcode, callback)
  {
    var data = {
      "created_at": new Date(),
      "shortcode": shortcode,
      "status": "SUCCESS",
      "operation": "say",
      meta: self.meta
    };
    self.call("data", data, "POST", callback);
  };

  return self;
};


/* chirpjs main */

var SHORTCODE = "shortcode";
var LONGCODE = "longcode";

// Base Object.
var Chirpjs = function (key, authCb) {
  var self = this;
  this.version = '1.0.0';

  this.network = new ChirpNetwork(key);
  this.network.authenticate(function (err, data) {
    if (!err) {
      self.analytics = new ChirpAnalytics(data.access_token, self.version);
      self.access = data.access;
    }
    if (authCb) {
      authCb(err, data);
    }
  });
  console.info('=== chirp : ', this.version, ' ===');
};

/* ================================================
 UTILTIY
 ==================================================*/
function isValidId(id, type) {
  var shortcode = /^[0123456789abcdefghijklmnopqrstuv]{10}$/;
  var longcode = /^[0123456789abcdefghijklmnopqrstuv]{18}$/;
  if (type === SHORTCODE && id.match(shortcode)) {
    return true;
  }
  if (type === LONGCODE && id.match(longcode)) {
    return true;
  }
  return false;
}

/* ================================================
 Chirpjs public methods
 ==================================================*/
Chirpjs.prototype.init = function () {
  this.audio = new ChirpAudio();
  this.audio.init();
};

Chirpjs.prototype.chirp = function (identifier, callback) {
  var self = this;
  if (!this.audio) {
    this.init();
  }
  if (isValidId(identifier, SHORTCODE)) {
    this.network.encode(identifier, function (err, longcode) {
      if (!err && longcode) {
        self.audio.play(longcode);
        self.analytics.say(identifier);
        if (callback) {
          setTimeout(function() {
            callback(null, identifier);
          }, 2000); //TODO:  need a proper chirpAudio callback SDKJS-38
        }
      } else {
        if (callback) {
          callback(err);
        }
      }
    });
  } else if (isValidId(identifier, LONGCODE)) {
    self.audio.play(identifier);
    if (self.analytics) {
      self.analytics.say(identifier.substring(0, 10));
    }
    if (callback) {
      setTimeout(function() {
        callback(null, identifier);
      }, 2000); //TODO:  need a proper chirpAudio callback SDKJS-38
    }
  } else {
    var error = new ChirpError(32000);
    if (callback) {
      callback(error);
    } else {
      throw error;
    }
  }

};

Chirpjs.prototype.create = function (data, callback) {
  if (!data || typeof data !== 'object') {
    var err = new ChirpError(21002);
    if (callback) {
      callback(err);
    }
    return err;
  }
  this.network.create(data, callback);
};

Chirpjs.prototype.get = function (shortcode, callback) {
  if (isValidId(shortcode, SHORTCODE)) {
    this.network.read(shortcode, callback);
  } else {
    var error = new ChirpError(32000);
    if (callback) {
      callback(error);
    } else {
      throw error;
    }
  }
};

Chirpjs.prototype.encode = function (shortcode, callback) {
  if (isValidId(shortcode, SHORTCODE)) {
    this.network.encode(shortcode, callback);
  } else {
    var error = new ChirpError(32000);
    if (callback) {
      callback(error);
    } else {
      throw error;
    }
  }
};

window.Chirpjs = Chirpjs;
