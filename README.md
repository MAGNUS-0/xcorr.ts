# xcorr.ts
A web based client side cross-correlation (for audio).


# What is xcorr.ts?

It is a cross-correlation implementation built entirely for client-side web applications. The project is written in TypeScript but uses [WebPack](https://webpack.js.org/) (as well as [unminified-webpack-plugin](https://www.npmjs.com/package/unminified-webpack-plugin)) and [ts-loader](https://github.com/TypeStrong/ts-loader) to output a JavaScript callable interface.

There are two underlying cross-correlation implementations when calling `xcorr.ts`:

## WA_XCORR

A purely WebAudio implementation of the cross-correlation algorithm, using `offlineAudioContext`s to improve speed asynchronously.

## GCC-PHAT

An implementation of the *Generalized Cross-Correlation with Phase Transform* which uses a WebAssembly port ([PulseFFT](https://github.com/AWSM-WASM/PulseFFT)) of [kissfft](https://github.com/mborgerding/kissfft) to run on a client browser.


# Getting Started

Depending on the method of cross-correlation, certain extra dependencies will need to be added. To run `xcorr.ts` in `WA_XCORR` mode only WebAudio features will be needed. This can be simply setup by including the built version of the code `libxcorr.js` in the entry HTML.

```
<script src="js/libxcorr.js" type="text/javascript"></script>
```

On including this, an `xcorr` object will be appended to the window as a singleton that can be used. By default the mode will be set to `WA_XCORR`, but can be set explicitly:

```
xcorr.setMode('waxcorr'); // or 'gccphat'
```

The cross-correlation process can then be called asynchronously on two `Float32Array` buffers:

```
// buffer0: Float32Array 
// buffer1: Float32Array
// correlatedBuffer: Float32Array
const correlatedBuffer = await xcorr.correlated(buffer0, buffer1);
```

Or if required, a time-lag estimate can be called directly and the correlated buffer can be ignored:

```
// buffer0: Float32Array 
// buffer1: Float32Array
// timeLag: number
const timeLag = await xcorr.timeLag(buffer0, buffer1);
```

This will output the best found peak of time lag from the cross-correlation and uses Lagrangian interpolation with bias correction for fractional delays.

## Setting up GCC-PHAT

As the GCC-PHAT approach requires frequency domain transformation and manipulation, extra dependencies are required in.

### [PulseFFT](https://github.com/AWSM-WASM/PulseFFT)
Currently `PulseFFT` is setup asynchronously and requires a function being appended to the window so that `xcorr.ts` can load it correctly. Firstly the `index.js` script supplied with `PulseFFT` must be modified slightly to have the following appended:

```
// pulse/index.js
window.initPulse = loadPulse;
```

This file can then be included in the script tag and will search for the `PulseFFT` compiled WASM (make sure it is within the top level directory under a folder called `pulse`);

```
<script src="/pulse/index.js"></script>
```

Please follow setup instructions at [PulseFFT](https://github.com/AWSM-WASM/PulseFFT) for more information.

### [Mathjs](https://mathjs.org/)

Mathjs is used for extra complex data type manipulation within `xcorr.ts` and is needed in the `window` scope. This can be simply added by downloading the LTS version and including in the script tag as follows:

```
<script src="math.js" type="text/javascript"></script>
```

# Dependencies

Here is a full list of the dependencies used in making `xcorr.ts`:

* PulseFFT: WebAssembly Fourier Transform 
* Mathjs: Extensive math library for javascript

# Developing

**Coming Soon!**

# Author

Magnus Woodgate
