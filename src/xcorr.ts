import { Gccphat } from "./gccphat";
import { Waxcorr } from './waxcorr';

/**
 * @class Xcorr
 * @description A web based cross-correlation class.
 */
class Xcorr {

    gccphat: Gccphat;
    waxcorr: Waxcorr;
    prewhiten: PrewhiteningType;
    processing: ProcessingType = ProcessingType.WA_XCORR;
    sampleRate: number = 44100;

    /**
     * @constructor
     * @param mode : Cross-correlation mode
     * @param prewhiten  : Signal prewhitening method
     */
    constructor (mode: string) {

        this.setMode(mode);

        this.gccphat = new Gccphat(this.sampleRate);
        this.waxcorr = new Waxcorr(this.sampleRate);
        this.prewhiten = PrewhiteningType.NONE;        

    }

    /**
     * @method correlate
     * @async
     * @public
     * @param buffer0 : First buffer for cross correlation 
     * @param buffer1 : Secondary buffer of cross correlation
     */
    public async correlate (buffer0: Float32Array, buffer1: Float32Array) {

        switch (this.prewhiten) {
            case (PrewhiteningType.NONE):
                break;
            case (PrewhiteningType.MEAN_REMOVAL):
                break;
            case (PrewhiteningType.TREND_REMOVAL):
                break;
        }

        let outputBuffer: Float32Array;

        return new Promise((resolve, reject) => {
            switch (this.processing) {
                case (ProcessingType.GCC_PHAT):
                    outputBuffer = this.gccphat.xcorr(buffer0, buffer1);
                    outputBuffer = Xcorr.normalize(outputBuffer);
                    resolve(outputBuffer);
                    break;
                case (ProcessingType.WA_XCORR):
                    this.waxcorr.xcorr(buffer0, buffer1).then((correlatedBuffer) => {
                        correlatedBuffer = Xcorr.normalize(<Float32Array>correlatedBuffer);
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
    public async timeLag (buffer0: Float32Array, buffer1: Float32Array) {

        const correlatedBuffer = await this.correlate(buffer0, buffer1);
        let lag = this.locatePeakIndex(<Float32Array>correlatedBuffer);
    
        return lag;
    }

    /**
     * @public
     * @method
     * @param mode : New processing mode to use for cross-correlation
     */
    public setMode (mode: string): void {

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
    private static indexOfMax (buffer: Float32Array): number {

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
    private locatePeakIndex (buffer: Float32Array): number {

        let idx: number = Xcorr.indexOfMax(buffer);

        let sampleLag = 0;

        if (this.processing === ProcessingType.GCC_PHAT) {
            if (idx > Math.floor(buffer.length/2)) {
                sampleLag = buffer.length - idx;
            } else {
                sampleLag = idx;
            }
        } else {
            sampleLag = idx - this.waxcorr.getOffset();
        }

        let interpLag: number;

        if (sampleLag > 1) {
            interpLag = Xcorr.interpolate(buffer[sampleLag-1], buffer[sampleLag], buffer[sampleLag+1]);
            interpLag += sampleLag;
        } else {
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
    private static interpolate (peakM1: number, peakIdx: number, peakP1: number): number {
        
        let lagrangePeak = 0.5 * (peakM1 - peakP1) / (peakM1 - (2*peakIdx) + peakP1);

        let biasCorrected = (Math.sqrt(32 * (lagrangePeak*lagrangePeak) + 1) - 1) / (8 * lagrangePeak);

        return biasCorrected;

    }

    /**
     * @method normalize
     * @static
     * @private
     * @param buffer : Buffer to normalize
     */
    private static normalize (buffer: Float32Array): Float32Array {

        let maxValue = 0;
        let outputBuffer: Float32Array = new Float32Array(buffer.length);

        for (let tempIndex = 0; tempIndex < buffer.length; tempIndex++) {
            if (Math.abs(buffer[tempIndex]) > maxValue){
                maxValue = Math.abs(buffer[tempIndex]);
            }
        }

        for (let index = 0; index < buffer.length; index++){
            outputBuffer[index] = buffer[index]/maxValue;
        }

        return outputBuffer;

    }

}

/**
 * @enum ProcessingType
 */
enum ProcessingType {
    WA_XCORR = 'waxcorr',
    GCC_PHAT = 'gccphat'
};

/**
 * @enum PrewhiteningType
 */
enum PrewhiteningType {
    NONE,
    MEAN_REMOVAL,
    TREND_REMOVAL
}

// Apply to window for easy JS calls
(<any>window).xcorr = new Xcorr(ProcessingType.WA_XCORR);