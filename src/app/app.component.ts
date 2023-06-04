import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import {AudioRecordingServiceOgg} from './audio-recording.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('waveSurfer') waveSurferRef: ElementRef<HTMLDivElement> | undefined;
  @ViewChild('audio') audioRef: ElementRef<HTMLAudioElement> | undefined;
  title = 'my-app';

  recordedSoundUrl: (SafeUrl | undefined);

  constructor(
    private audioRecordingServiceOgg: AudioRecordingServiceOgg,
    private sanitizer: DomSanitizer) {
  }

  ngAfterViewInit(): void {
    this.initializeWaveSurfer();
  }

  isRecording = false;

  onRecBtn(e: Event) {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    if (this.isRecording) {
      return;
    }
    try {
      // if (this.currentTermClass?.term_code === 'OSEN1TEST1') {
      this.audioRecordingServiceOgg.startRecording(() => {
        this.isRecording = true;

      }, () => {
        console.error('Could not start recorder');
      });

    } catch (error) {
      alert(error);
    }
  }

  stopRecording() {
    if (!this.isRecording) {
      alert('return cause no voice is recording');
      return;
    }
    this.isRecording = false;
    // if (this.currentTermClass?.term_code === 'OSEN1TEST1') {
    this.audioRecordingServiceOgg.stopRecording((blob, arrayBuffer) => {
      this.audioRecordingServiceOgg.decodeOgg(arrayBuffer, (blob2) => {
        this.recordedSoundUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob2));
        setTimeout(() => {

          this.initializeWaveSurfer();
        },0)
      });
    }, (reason: number) => {
      if (reason == 1) {
        console.log('Recorded voice must be longer than 1 second');
      } else {
        console.error('Unable to save recorded sound');
      }
    });

  }

  waveSurfer: WaveSurfer | undefined;

  private initializeWaveSurfer() {
    if (!this.recordedSoundUrl) {
      return;
    }
    if (this.waveSurfer) {
      this.waveSurfer.destroy();
    }
    this.waveSurfer = WaveSurfer.create({
      container: this.waveSurferRef!.nativeElement,
      waveColor: 'green',
      height: 60,
      progressColor: 'purple',
      media: this.audioRef!.nativeElement,
    });
  }
}
