# Chirp JavaScript SDK 1.0.0

The Chirp SDK for JavaScript allows you to send chirps from within your website or JavaScript project. It uses the Web Audio API to generate chirps natively within the browser, played from the visitor's speaker.

This SDK is *send only*. It can be used to send data via Chirp, but not receive. To receive the data sent from your web project, check out the Chirp SDKs for iOS or Android.

## Requirements

To embed Chirp within your web project, you will need:
* The Chirp JavaScript SDK
* Credentials for a Chirp application, registered on the [Chirp Admin Centre](https://admin.chirp.io/)
* A [browser that supports the Web Audio API](http://caniuse.com/#feat=audio-api)

## Registering for Credentials

To get started, you'll need to register for a Chirp application at the [Chirp Admin Centre](https://admin.chirp.io/).

Unlike our mobile SDKs, the JavaScript SDK does not need an application secret for authentication. It only uses the `application_key` for authentication, in combination with a specific `origin`.

An origin represents the host name of the website where the SDK and HTML files will be hosted.  
You can add a new origin by editing your application in the [Chirp Admin Centre](https://admin.chirp.io).
Please note that the origin should contain the hostname and port number only. 
It should not include the protocol scheme (`http/https`)

## Running the Demo

A simple demo project is included that shows the key functions of the Chirp JavaScript SDK. To use it:

* In the [Chirp Admin Centre](https://admin.chirp.io), register an application, and add the origin `localhost:8000`.
* In `demo/index.html`, replace `YOUR_APP_KEY` with the application key you obtained above.

Now, serve up a webserver pointing to the `demo` directory: 
```
cd demo
python -m SimpleHTTPServer
```

Finally, go to [localhost:8000](http://localhost:8000/). Voila! You're chirping.

## Installing the JavaScript SDK

We'll now take you through installing the JavaScript SDK within your own project.

### 1. Include the file `chirpjs.min.js` within your project.

Copy `chirpjs.min.js` to your project folder, and include it within your HTML:

```
<script src="chirpjs.min.js"></script>
```

### 2. Create a new instance of `Chirpjs` with your application key.

Replace `YOUR_APP_KEY` with your application's key.

```
var chirpjs = new Chirpjs("YOUR_APP_KEY");
```

At this point, `Chirpjs` will automatically try to authenticate your application. 

To catch the authentication response, you can pass a callback function as a second argument.

```
var chirpjs = new Chirpjs("YOUR_APP_KEY", function(err, res) {
    if (err) {
        console.error(err); return;
    }
    console.info('Authentication successful!');
});
```

### 3. Create a Chirp

After the application is successfully authenticated, you can start creating new chirps.  
The example below creates a chirp with associated JSON data, with key `foo` and value `bar`. 
The response format is detailed on the Chirp API [POST /chirp documentation](http://developers.chirp.io/v2/docs/api-post-chirp)

```
chirpjs.create({foo: 'bar'}, function(err, chirp) {
   if (err) {
      console.error(err); return;
   };
   console.info('Created new chirp: ' + chirp.shortcode);
});
```

### 4. Play a Chirp

The response contains two identifiers, the `shortcode` and `longcode`. 
The `longcode` represents the `shortcode` with error-correction symbols appended, preparing it for audio playback. 
If you want to play a chirp in **offline** mode, you can play the `longcode` directly.

> For more information about `shortcodes` and `longcodes`, see [Anatomy of a Chirp](http://developers.chirp.io/v1/docs/chirps-shortcodes).

```
chirpjs.chirp("kingfishereru8acg7", function(err, data) {
   if (err) {
      console.error(err); return;
   };
  console.info(data);
});
```

You can also pass the `shortcode` directly. 
However, in this case, you'll need an internet connection so that the SDK is able to add error correction to the `shortcode`. There will be a brief delay whilst the client contacts the server to obtain the error correction characters. 

```
chirpjs.chirp("kingfisher", function(err, data) {
   if (err) {
      console.error(err); return;
   };
  console.info(data);
});
```

### 5. Get a Chirp
To get the data that was attached to your chirp, you can retrieve it based on the `shortcode`.

```
chirpjs.get("shortcode", function(err, data){
		if (err) {
      console.error(err); return;
   };
   console.info(data);
});
```

### 6. Encode a Chirp
You can also encode your own `shortcode`, 
which should be 10 characters in length (see [Anatomy of a Chirp](http://developers.chirp.io/v1/docs/chirps-shortcodes)).

```
chirpjs.encode("shortcode", function(err, longcode){
		if (err) {
      console.error(err); return;
   };
   console.info(longcode);
});
```

## Further Information

For more Chirp developer resources, visit the [Chirp Developer Hub](http://developers.chirp.io).

-----------

This file is part of the Chirp JavaScript SDK.
For full information on usage and licensing, see http://chirp.io/

Copyright (c) 2011-2016, Asio Ltd.
All rights reserved.

For commercial usage, commercial licences apply. Please contact us.

For non-commercial projects these files are licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
