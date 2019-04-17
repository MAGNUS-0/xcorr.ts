
/**
 * @class Waxcorr
 */
export class Waxcorr {

    offlineAudio: OfflineAudioGraph;

    /**
     * @constructor
     * @param sampleRate : Sampling rate of offline audio context processing
     */
    constructor (sampleRate: number) {
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
    private async calculate (deviceBuffer0: Float32Array, deviceBuffer1: Float32Array, outputBufferLength: number) {

        // Setup audio graph before correlation
        this.offlineAudio.setupGraph(deviceBuffer0, deviceBuffer1, outputBufferLength);

        // Start buffer playing
        if (this.offlineAudio.source0) {
            this.offlineAudio.source0.start()
        }

        if (this.offlineAudio.offlineAudioCtx) {
            // Wait for context to complete
            return this.offlineAudio.offlineAudioCtx.startRendering();
        } else {
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
    public async xcorr (buffer0: Float32Array, buffer1: Float32Array) {
        let outputBufferLength = buffer0.length + buffer1.length - 1;
        return this.calculate(buffer0, buffer1, outputBufferLength).then((correlatedBufferNode)=>{
            return new Promise(resolve => {
                resolve((<AudioBuffer>correlatedBufferNode).getChannelData(0));
            });
        });
    }

    /**
     * @method getOffset
     * @public
     */
    public getOffset (): number {
        return this.offlineAudio.getOffset();
    }
}

/**
 * @class OfflineAudioGraph
 */
class OfflineAudioGraph {

    offlineAudioCtx?: OfflineAudioContext;
    reverseOffset: number = 0;
    convolver?: ConvolverNode;
    source0?: AudioBufferSourceNode;
    source1?: AudioBufferSourceNode;
    buffer0?: AudioBuffer;
    buffer1?: AudioBuffer;
    biquad0?: BiquadFilterNode;
    samplingRate: number = 44100;

    /**
     * @constructor
     * @param samplingRate : Sampling rate of offline audio context
     */
    constructor (samplingRate: number) {
        this.samplingRate = samplingRate;
    }

    /**
     * @method getOffset
     * @public
     */
    public getOffset () : number {
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
    private setBiquad (context: OfflineAudioContext, biquad: BiquadFilterNode, gain: number, fc: number, Q: number): void {

        biquad.gain.setValueAtTime(gain, context.currentTime);

        biquad.frequency.setValueAtTime(fc, context.currentTime);
        
        biquad.Q.setValueAtTime(Q, context.currentTime);

    }

    /**
     * @method free
     * @public
     */
    public free () {
    }

    /**
     * @method setupGraph
     * @public
     * @param deviceBuffer0 : Audio buffer to cross correlate
     * @param deviceBuffer1 : Second audio buffer to cross correlate
     * @param outputBufferLength : Output audio buffer length expected
     */
    public setupGraph (deviceBuffer0: Float32Array, deviceBuffer1: Float32Array, outputBufferLength: number): void {

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
