import {Injectable} from '@angular/core';

import {OggOpusDecoderWebWorker} from 'ogg-opus-decoder';

// @ts-ignore
import OpusMediaRecorder from 'opus-media-recorder/OpusMediaRecorder.umd.js';
// Use worker-loader
// @ts-ignore
import encoderPath from 'opus-media-recorder/encoderWorker.umd.js';

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingServiceOgg {

  private startTime: number | undefined;

  constructor() {
  }

  private stream: any;


  blob: Blob | undefined;
  workerOptions = {
    encoderWorkerFactory: (_: any) => new Worker(encoderPath),
    OggOpusEncoderWasmPath: '/assets/OggOpusEncoder.wasm',
    WebMOpusEncoderWasmPath: '/assets/WebMOpusEncoder.wasm'
  };


  recorder: OpusMediaRecorder | undefined;

  startRecording(onStart: () => void, failed: () => void) {
    navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
      this.startTime = undefined;
      window.MediaRecorder = OpusMediaRecorder;
      let options = {mimeType: 'audio/ogg', audioBitsPerSecond: 48000,};
      // Start recording
      this.recorder = new OpusMediaRecorder(stream, options, this.workerOptions);

      this.recorder.onstart = (_: any) => {
        this.startTime = Date.now();
        onStart();
      };
      this.recorder.onerror = (e: any) => {
        console.log('Recorder encounters error:' + e.message);
        failed();
      };
      this.recorder.start();
      // Set record to <audio> when recording will be finished
      // this.data = [];
      this.recorder.addEventListener('dataavailable', (e: any) => {
        this.blob = e.data;
        // this.data?.push(e.data);

      });
    }).catch((err) => {
      failed()
    });

  }

  stopRecording(callback: (blob: any, arrayBuffer: any) => void, onFailed: (reason: number) => void) {

    const q2 = this;
    if (this.recorder) {
      this.recorder.onstop = (ev: any) => {

        const blob = this.blob!;
        var fileReader = new FileReader();
        fileReader.onload = function(event) {
          const arrayBufferNew = event.target!.result;
          const uint8ArrayNew = new Uint8Array(arrayBufferNew as any);
          // const arrayBuffer = q2.data;
          if(q2.startTime){

            const now = Date.now();
            if(now - q2.startTime < 1000){
              onFailed(1);
              return;
            }
          }
          callback(blob, uint8ArrayNew);

        };
        fileReader.readAsArrayBuffer(blob);

      };
    }
    this.recorder?.stop();
    // Remove “recording” icon from browser tab
    this.recorder?.stream.getTracks().forEach((i: any) => i.stop());
  }

  public decodeOgg(arrayBuffer: Uint8Array, callback: (blob: Blob) => void) {
    const desiredSampleRate = 48000;
    const decoder = new OggOpusDecoderWebWorker();
    decoder.ready.then(() => {
      decoder.decodeFile(arrayBuffer).then((v) => {
          const {channelData, samplesDecoded, sampleRate} = v;
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

          const src = audioCtx.createBufferSource();
          const audioBuffer = audioCtx.createBuffer(channelData.length, channelData[0].length, desiredSampleRate);

          for (let i = 0; i < channelData.length; i++) {
            const onChannelData = channelData[i];
            audioBuffer.getChannelData(i).set(onChannelData);
          }
          const toWav = require('audiobuffer-to-wav');
          const wav = toWav(audioBuffer);
          const dataBlob = new Blob([new DataView(wav)], {type: 'audio/wav'});
          callback(dataBlob);
        }
      );
    });
  }


}
