/**
 * @class Gccphat
 */
export class Gccphat {

    libmath: any;
    winmath: any;
    pulse: any;
    activeFFT: any;
    sampleRate: number;

    /**
     * @constructor
     * @param sampleRate : Sample rate of device
     */
    constructor (sampleRate: number) {

        this.sampleRate = sampleRate;
        this.libmath = (<any>window).math;
        this.winmath = (<any>window).Math;

        if ((<any>window).initPulse || (<any>window).math) {
            (<any>window).initPulse().then((pulse: any) => {
                this.pulse = pulse;
            });
        } else {
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
    public xcorr (buffer0: Float32Array, buffer1: Float32Array) {

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
        
        (<any>window).resXcorrMath = timeResult;

        return timeResult;

    }

    /**
     * @method forwardFFT
     * @private
     * @param buffer : Buffer to transform
     */
    private forwardFFT (buffer: Float32Array): ComplexDataArray1D {

        if (this.activeFFT !== undefined) {
            this.free();
        } 

        this.activeFFT = new this.pulse.fftReal(buffer.length);
        
        var result: Float32Array = this.activeFFT.forward(buffer);

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
    private inverseFFT (spectrum: ComplexDataArray1D): Float32Array {

        let frequencyBuffer = new Float32Array(spectrum.length * 2);

        let reCounter = 0;
        let imCounter = 0;
        
        for (let index = 0; index < frequencyBuffer.length; index++) {
            if (index%2 === 0) {
                frequencyBuffer[index] = spectrum.data[reCounter].re;
                reCounter++
            } else {
                frequencyBuffer[index] = spectrum.data[imCounter].im;
                imCounter++;
            }
        }

        let result = new Float32Array(frequencyBuffer.length);

        if (this.activeFFT !== undefined) {
            result = this.activeFFT.inverse(frequencyBuffer);
            this.free();
        } else {
            console.warn("Error activeFFT not defined on GCC-PHAT handler!");
        }

        return result;

    }

    /**
     * @method free
     * @private
     */
    private free () {
        this.activeFFT.dispose();
        this.activeFFT = undefined;
    }

    /**
     * @method extractReal
     * @private 
     * @param complexFreqBuffer : Frequency buffer returned from pulseFFT
     */
    private extractReal (complexFreqBuffer: Float32Array) {

        if (complexFreqBuffer.length%2 !== 0) {
            return new Float32Array(1);
        }

        let output: Float32Array = new Float32Array(this.winmath.floor(complexFreqBuffer.length/2));
        let counter: number = 0;

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
    private extractImag (complexFreqBuffer: Float32Array) {

        if (complexFreqBuffer.length%2 !== 0) {
            return new Float32Array(1);
        }

        let output: Float32Array = new Float32Array(this.winmath.floor(complexFreqBuffer.length/2));
        let counter: number = 0;

        for (let index = 0; index < complexFreqBuffer.length; index++) {
            if ((index % 2) !== 0) {
                output[counter] = complexFreqBuffer[index];
                counter++;
            }
        }

        return output;
    }

}

/**
 * @class ComplexData
 */
class ComplexData {

    data: Object;

    /**
     * @constructor
     * @param re : Real number of the data
     * @param im : Imaginary number of the data
     */
    constructor (re: number, im: number) {
        this.data = (<any>window).math.complex(re, im);
    }
}

/**
 * @interface ComplexData
 */
interface ComplexData {
    data: Object;
    re: number;
    im: number;
}

/**
 * @class ComplexDataArray1D
 */
class ComplexDataArray1D {

    data: ComplexData[];
    length: number;

    /**
     * @constructor
     * @param length : Length of the array
     */
    constructor (length: number) {

        this.length = length;
        this.data = new Array(length);

        for (let index = 0; index < length; index++) {
            this.data[index] = new ComplexData(0,0);
        }
    }

    /**
     * @method setEntire
     * @public
     * @param re : An array of 32 bit floats of real numbers
     * @param im : An array of 32 bit floats of imaginary numbers
     */
    public setEntire (re: Float32Array, im: Float32Array) {

        let newData = new Array(re.length);

        for (let index = 0; index < re.length; index++) {
            newData[index] = (<any>window).math.complex(re[index], im[index]);
        }

        this.data = newData;
        this.length = this.data.length;
    }

    /**
     * @method conj
     * @public
     */
    public conj () : ComplexDataArray1D {

        let conjArray = new ComplexDataArray1D(this.length);

        for (let index = 0; index < this.length; index++) {
            conjArray.data[index] = (<any>window).math.conj(this.data[index]);
        }

        return conjArray;
    }

    /**
     * @method abs
     * @public
     */
    public abs () : ComplexDataArray1D {

        let absArray = new ComplexDataArray1D(this.length);

        for (let index = 0; index < this.length; index++) {
            absArray.data[index] = (<any>window).math.abs(this.data[index]);
        }

        return absArray;
    }

    /**
     * @method multiply
     * @public
     * @param spectrum0 : Complex data to be multiplied
     * @param spectrum1 : Complex data to be multiplied
     */
    public static multiply (spectrum0: ComplexDataArray1D, spectrum1: ComplexDataArray1D) : ComplexDataArray1D {

        let result = new ComplexDataArray1D(spectrum0.length);

        for (let index = 0; index < spectrum0.length; index++) {
            result.data[index] = (<any>window).math.multiply(spectrum0.data[index], spectrum1.data[index]);
        }

        return result;
    }

    /**
     * @method divide
     * @public
     * @param spectrum0 : Complex data to be divided
     * @param spectrum1 : Complex data to be divided
     */
    public static divide (spectrum0: ComplexDataArray1D, spectrum1: ComplexDataArray1D) : ComplexDataArray1D {

        let result = new ComplexDataArray1D(spectrum0.length);

        for (let index = 0; index < spectrum0.length; index++) {
            result.data[index] = (<any>window).math.divide(spectrum0.data[index], spectrum1.data[index]);
        }

        return result;
    }

}

/**
 * @interface Object
 */
interface Object {
    re: number;
    im: number;
}
