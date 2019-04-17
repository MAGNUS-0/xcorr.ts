/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const gccphat_1 = __webpack_require__(1);
const waxcorr_1 = __webpack_require__(2);
/**
 * @class Xcorr
 * @description A web based cross-correlation class.
 */
class Xcorr {
    /**
     * @constructor
     * @param mode : Cross-correlation mode
     * @param prewhiten  : Signal prewhitening method
     */
    constructor(mode) {
        this.processing = ProcessingType.WA_XCORR;
        this.sampleRate = 44100;
        this.setMode(mode);
        this.gccphat = new gccphat_1.Gccphat(this.sampleRate);
        this.waxcorr = new waxcorr_1.Waxcorr(this.sampleRate);
        this.prewhiten = PrewhiteningType.NONE;
    }
    /**
     * @method correlate
     * @async
     * @public
     * @param buffer0 : First buffer for cross correlation
     * @param buffer1 : Secondary buffer of cross correlation
     */
    async correlate(buffer0, buffer1) {
        switch (this.prewhiten) {
            case (PrewhiteningType.NONE):
                break;
            case (PrewhiteningType.MEAN_REMOVAL):
                break;
            case (PrewhiteningType.TREND_REMOVAL):
                break;
        }
        let outputBuffer;
        return new Promise((resolve, reject) => {
            switch (this.processing) {
                case (ProcessingType.GCC_PHAT):
                    outputBuffer = this.gccphat.xcorr(buffer0, buffer1);
                    outputBuffer = Xcorr.normalize(outputBuffer);
                    resolve(outputBuffer);
                    break;
                case (ProcessingType.WA_XCORR):
                    this.waxcorr.xcorr(buffer0, buffer1).then((correlatedBuffer) => {
                        correlatedBuffer = Xcorr.normalize(correlatedBuffer);
                        resolve(correlatedBuffer);
                    }).catch(_ => console.warn('Warning Waxcorr failed, offlineAudioContext not setup.'));
                    break;
                default:
                    outputBuffer = this.gccphat.xcorr(buffer0, buffer1);
                    outputBuffer = Xcorr.normalize(outputBuffer);
                    resolve(outputBuffer);
                    break;
            }
        });
    }
    /**
     * @method timeLag
     * @async
     * @public
     * @param buffer0 : First buffer for cross correlation
     * @param buffer1 : Secondary buffer of cross correlation
     */
    async timeLag(buffer0, buffer1) {
        const correlatedBuffer = await this.correlate(buffer0, buffer1);
        let lag = this.locatePeakIndex(correlatedBuffer);
        return lag;
    }
    /**
     * @public
     * @method
     * @param mode : New processing mode to use for cross-correlation
     */
    setMode(mode) {
        switch (mode) {
            case ('waxcorr'):
                this.processing = ProcessingType.WA_XCORR;
                break;
            case ('gccphat'):
                this.processing = ProcessingType.GCC_PHAT;
                break;
        }
    }
    /**
     * @method indexOfMax
     * @static
     * @private
     * @param buffer : Buffer to calculate maximum index of
     */
    static indexOfMax(buffer) {
        if (buffer.length === 0) {
            return -1;
        }
        let max = buffer[0];
        let maxIndex = 0;
        for (var index = 1; index < buffer.length; index++) {
            if (buffer[index] > max) {
                maxIndex = index;
                max = Math.abs(buffer[index]);
            }
        }
        return maxIndex;
    }
    /**
     * @method locatePeakIndex
     * @private
     * @param buffer : Buffer to locate the peak index
     */
    locatePeakIndex(buffer) {
        let idx = Xcorr.indexOfMax(buffer);
        let sampleLag = 0;
        if (this.processing === ProcessingType.GCC_PHAT) {
            if (idx > Math.floor(buffer.length / 2)) {
                sampleLag = buffer.length - idx;
            }
            else {
                sampleLag = idx;
            }
        }
        else {
            sampleLag = idx - this.waxcorr.getOffset();
        }
        let interpLag;
        if (sampleLag > 1) {
            interpLag = Xcorr.interpolate(buffer[sampleLag - 1], buffer[sampleLag], buffer[sampleLag + 1]);
            interpLag += sampleLag;
        }
        else {
            interpLag = Math.abs(sampleLag);
        }
        return interpLag;
    }
    /**
     * @method interpolate
     * @static
     * @private
     * @param peakM1 : Index before peak index
     * @param peakIdx : Peak index
     * @param peakP1 : Index after peak index
     */
    static interpolate(peakM1, peakIdx, peakP1) {
        let lagrangePeak = 0.5 * (peakM1 - peakP1) / (peakM1 - (2 * peakIdx) + peakP1);
        let biasCorrected = (Math.sqrt(32 * (lagrangePeak * lagrangePeak) + 1) - 1) / (8 * lagrangePeak);
        return biasCorrected;
    }
    /**
     * @method normalize
     * @static
     * @private
     * @param buffer : Buffer to normalize
     */
    static normalize(buffer) {
        let maxValue = 0;
        let outputBuffer = new Float32Array(buffer.length);
        for (let tempIndex = 0; tempIndex < buffer.length; tempIndex++) {
            if (Math.abs(buffer[tempIndex]) > maxValue) {
                maxValue = Math.abs(buffer[tempIndex]);
            }
        }
        for (let index = 0; index < buffer.length; index++) {
            outputBuffer[index] = buffer[index] / maxValue;
        }
        return outputBuffer;
    }
}
/**
 * @enum ProcessingType
 */
var ProcessingType;
(function (ProcessingType) {
    ProcessingType["WA_XCORR"] = "waxcorr";
    ProcessingType["GCC_PHAT"] = "gccphat";
})(ProcessingType || (ProcessingType = {}));
;
/**
 * @enum PrewhiteningType
 */
var PrewhiteningType;
(function (PrewhiteningType) {
    PrewhiteningType[PrewhiteningType["NONE"] = 0] = "NONE";
    PrewhiteningType[PrewhiteningType["MEAN_REMOVAL"] = 1] = "MEAN_REMOVAL";
    PrewhiteningType[PrewhiteningType["TREND_REMOVAL"] = 2] = "TREND_REMOVAL";
})(PrewhiteningType || (PrewhiteningType = {}));
// Apply to window for easy JS calls
window.xcorr = new Xcorr(ProcessingType.WA_XCORR);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class Gccphat
 */
class Gccphat {
    /**
     * @constructor
     * @param sampleRate : Sample rate of device
     */
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.libmath = window.math;
        this.winmath = window.Math;
        if (window.initPulse || window.math) {
            window.initPulse().then((pulse) => {
                this.pulse = pulse;
            });
        }
        else {
            console.warn('GCC-PHAT was not setup correctly!');
        }
    }
    /**
     * @method xcorr
     * @async
     * @public
     * @param buffer0 : First buffer to cross correlate
     * @param buffer1 : Second buffer to cross correlate
     */
    xcorr(buffer0, buffer1) {
        // Convert both to frequency domain
        var spectrum0 = this.forwardFFT(buffer0);
        var spectrum1 = this.forwardFFT(buffer1);
        // Complex conjugate 
        var spectrum1Conj = spectrum1.conj();
        // Calculate numerator
        var numerator = ComplexDataArray1D.multiply(spectrum0, spectrum1Conj);
        // Absolute of the numerator
        var denominator = numerator.abs();
        // Divide the results
        var result = ComplexDataArray1D.divide(numerator, denominator);
        // Convert to time domain
        var timeResult = this.inverseFFT(result);
        window.resXcorrMath = timeResult;
        return timeResult;
    }
    /**
     * @method forwardFFT
     * @private
     * @param buffer : Buffer to transform
     */
    forwardFFT(buffer) {
        if (this.activeFFT !== undefined) {
            this.free();
        }
        this.activeFFT = new this.pulse.fftReal(buffer.length);
        var result = this.activeFFT.forward(buffer);
        let re = this.extractReal(result);
        let im = this.extractImag(result);
        let spectrum = new ComplexDataArray1D(result.length);
        spectrum.setEntire(re, im);
        return spectrum;
    }
    /**
     * @method inverseFFT
     * @private
     * @param spectrum : Complex data array to inverse transform
     */
    inverseFFT(spectrum) {
        let frequencyBuffer = new Float32Array(spectrum.length * 2);
        let reCounter = 0;
        let imCounter = 0;
        for (let index = 0; index < frequencyBuffer.length; index++) {
            if (index % 2 === 0) {
                frequencyBuffer[index] = spectrum.data[reCounter].re;
                reCounter++;
            }
            else {
                frequencyBuffer[index] = spectrum.data[imCounter].im;
                imCounter++;
            }
        }
        let result = new Float32Array(frequencyBuffer.length);
        if (this.activeFFT !== undefined) {
            result = this.activeFFT.inverse(frequencyBuffer);
            this.free();
        }
        else {
            console.warn("Error activeFFT not defined on GCC-PHAT handler!");
        }
        return result;
    }
    /**
     * @method free
     * @private
     */
    free() {
        this.activeFFT.dispose();
        this.activeFFT = undefined;
    }
    /**
     * @method extractReal
     * @private
     * @param complexFreqBuffer : Frequency buffer returned from pulseFFT
     */
    extractReal(complexFreqBuffer) {
        if (complexFreqBuffer.length % 2 !== 0) {
            return new Float32Array(1);
        }
        let output = new Float32Array(this.winmath.floor(complexFreqBuffer.length / 2));
        let counter = 0;
        for (let index = 0; index < complexFreqBuffer.length; index++) {
            if ((index % 2) === 0) {
                output[counter] = complexFreqBuffer[index];
                counter++;
            }
        }
        return output;
    }
    /**
     * @method extractImag
     * @private
     * @param complexFreqBuffer : Frequency buffer returned from pulseFFT
     */
    extractImag(complexFreqBuffer) {
        if (complexFreqBuffer.length % 2 !== 0) {
            return new Float32Array(1);
        }
        let output = new Float32Array(this.winmath.floor(complexFreqBuffer.length / 2));
        let counter = 0;
        for (let index = 0; index < complexFreqBuffer.length; index++) {
            if ((index % 2) !== 0) {
                output[counter] = complexFreqBuffer[index];
                counter++;
            }
        }
        return output;
    }
}
exports.Gccphat = Gccphat;
/**
 * @class ComplexData
 */
class ComplexData {
    /**
     * @constructor
     * @param re : Real number of the data
     * @param im : Imaginary number of the data
     */
    constructor(re, im) {
        this.data = window.math.complex(re, im);
    }
}
/**
 * @class ComplexDataArray1D
 */
class ComplexDataArray1D {
    /**
     * @constructor
     * @param length : Length of the array
     */
    constructor(length) {
        this.length = length;
        this.data = new Array(length);
        for (let index = 0; index < length; index++) {
            this.data[index] = new ComplexData(0, 0);
        }
    }
    /**
     * @method setEntire
     * @public
     * @param re : An array of 32 bit floats of real numbers
     * @param im : An array of 32 bit floats of imaginary numbers
     */
    setEntire(re, im) {
        let newData = new Array(re.length);
        for (let index = 0; index < re.length; index++) {
            newData[index] = window.math.complex(re[index], im[index]);
        }
        this.data = newData;
        this.length = this.data.length;
    }
    /**
     * @method conj
     * @public
     */
    conj() {
        let conjArray = new ComplexDataArray1D(this.length);
        for (let index = 0; index < this.length; index++) {
            conjArray.data[index] = window.math.conj(this.data[index]);
        }
        return conjArray;
    }
    /**
     * @method abs
     * @public
     */
    abs() {
        let absArray = new ComplexDataArray1D(this.length);
        for (let index = 0; index < this.length; index++) {
            absArray.data[index] = window.math.abs(this.data[index]);
        }
        return absArray;
    }
    /**
     * @method multiply
     * @public
     * @param spectrum0 : Complex data to be multiplied
     * @param spectrum1 : Complex data to be multiplied
     */
    static multiply(spectrum0, spectrum1) {
        let result = new ComplexDataArray1D(spectrum0.length);
        for (let index = 0; index < spectrum0.length; index++) {
            result.data[index] = window.math.multiply(spectrum0.data[index], spectrum1.data[index]);
        }
        return result;
    }
    /**
     * @method divide
     * @public
     * @param spectrum0 : Complex data to be divided
     * @param spectrum1 : Complex data to be divided
     */
    static divide(spectrum0, spectrum1) {
        let result = new ComplexDataArray1D(spectrum0.length);
        for (let index = 0; index < spectrum0.length; index++) {
            result.data[index] = window.math.divide(spectrum0.data[index], spectrum1.data[index]);
        }
        return result;
    }
}
// let gccphat = new Gccphat(44100);
// console.log(gccphat);
// let buffer0 = new Float32Array(400);
// let buffer1 = new Float32Array(buffer0.length);
// for (let index = 0; index < buffer0.length; index++) {
//     buffer0[index] = (Math.random() * 2) - 1;
//     buffer1[index] = (Math.random() * 2) - 1;
// }
// setTimeout(()=>{
//     var result = gccphat.xcorr(buffer0, buffer1);
//     console.log('gccphat_ts', result)
// }, 2000)


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class Waxcorr
 */
class Waxcorr {
    /**
     * @constructor
     * @param sampleRate : Sampling rate of offline audio context processing
     */
    constructor(sampleRate) {
        this.offlineAudio = new OfflineAudioGraph(sampleRate);
    }
    /**
     * @method calculate
     * @async
     * @private
     * @param deviceBuffer0 : Audio buffer to cross correlate
     * @param deviceBuffer1 : Second audio buffer to cross correlate
     * @param outputBufferLength : Output audio buffer length expected
     */
    async calculate(deviceBuffer0, deviceBuffer1, outputBufferLength) {
        // Setup audio graph before correlation
        this.offlineAudio.setupGraph(deviceBuffer0, deviceBuffer1, outputBufferLength);
        // Start buffer playing
        if (this.offlineAudio.source0) {
            this.offlineAudio.source0.start();
        }
        if (this.offlineAudio.offlineAudioCtx) {
            // Wait for context to complete
            return this.offlineAudio.offlineAudioCtx.startRendering();
        }
        else {
            return Promise.reject();
        }
    }
    /**
     * @method xcorr
     * @async
     * @public
     * @param buffer0 : First buffer to cross correlate
     * @param buffer1 : Second buffer to cross correlate
     */
    async xcorr(buffer0, buffer1) {
        let outputBufferLength = buffer0.length + buffer1.length - 1;
        return this.calculate(buffer0, buffer1, outputBufferLength).then((correlatedBufferNode) => {
            return new Promise(resolve => {
                resolve(correlatedBufferNode.getChannelData(0));
            });
        });
    }
    /**
     * @method getOffset
     * @public
     */
    getOffset() {
        return this.offlineAudio.getOffset();
    }
}
exports.Waxcorr = Waxcorr;
/**
 * @class OfflineAudioGraph
 */
class OfflineAudioGraph {
    /**
     * @constructor
     * @param samplingRate : Sampling rate of offline audio context
     */
    constructor(samplingRate) {
        this.reverseOffset = 0;
        this.samplingRate = 44100;
        this.samplingRate = samplingRate;
    }
    /**
     * @method getOffset
     * @public
     */
    getOffset() {
        return this.reverseOffset;
    }
    /**
     * @method setBiquad
     * @private
     * @param context : Offline audio context
     * @param biquad : BiquadFilterNode object reference
     * @param gain : Gain of filter to set
     * @param fc : Cutoff frequency to set
     * @param Q : Q-factor to set
     */
    setBiquad(context, biquad, gain, fc, Q) {
        biquad.gain.setValueAtTime(gain, context.currentTime);
        biquad.frequency.setValueAtTime(fc, context.currentTime);
        biquad.Q.setValueAtTime(Q, context.currentTime);
    }
    /**
     * @method free
     * @public
     */
    free() {
    }
    /**
     * @method setupGraph
     * @public
     * @param deviceBuffer0 : Audio buffer to cross correlate
     * @param deviceBuffer1 : Second audio buffer to cross correlate
     * @param outputBufferLength : Output audio buffer length expected
     */
    setupGraph(deviceBuffer0, deviceBuffer1, outputBufferLength) {
        this.offlineAudioCtx = new OfflineAudioContext(1, outputBufferLength, 44100);
        // Create nodes
        this.source0 = this.offlineAudioCtx.createBufferSource();
        this.source1 = this.offlineAudioCtx.createBufferSource();
        this.convolver = this.offlineAudioCtx.createConvolver();
        this.biquad0 = this.offlineAudioCtx.createBiquadFilter();
        // Create audio buffers
        this.buffer0 = this.offlineAudioCtx.createBuffer(1, deviceBuffer0.length, this.samplingRate);
        this.buffer1 = this.offlineAudioCtx.createBuffer(1, deviceBuffer1.length, this.samplingRate);
        // Set the audio buffers
        this.buffer0.copyToChannel(deviceBuffer0, 0);
        this.buffer1.copyToChannel(deviceBuffer1, 0);
        // Set the buffer nodes to the new audio buffers
        this.source0.buffer = this.buffer0;
        this.source1.buffer = this.buffer1;
        // Reverse second buffer
        Array.prototype.reverse.call(this.source1.buffer.getChannelData(0));
        // Store the reverse offset 
        this.reverseOffset = this.buffer1.getChannelData(0).length - 1;
        // Set the convolution buffer
        this.convolver.buffer = this.source1.buffer;
        // Connect up processing graph
        this.source0.connect(this.convolver);
        this.convolver.connect(this.offlineAudioCtx.destination);
    }
}


/***/ })
/******/ ]);