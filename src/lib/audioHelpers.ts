import { MutableRefObject } from 'react';

const MIN_DECIBELS = -30;

const handleData = (event: BlobEvent, chunksRef: MutableRefObject<Blob[]>) => {
	if (event.data.size > 0) {
		console.log(`Data chunk received: ${event.data.size} bytes`);
		chunksRef.current.push(event.data); // Directly modify the ref
	} else {
		console.log('Received empty data chunk');
	}
};

export const checkAudioLevel = (
	stream: MediaStream,
	detectSound: (
		analyser: AnalyserNode,
		bufferLength: number,
		domainData: Uint8Array
	) => void
) => {
	console.log('Checking audio level');
	const audioContext = new AudioContext();
	const audioStreamSource = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	analyser.maxDecibels = -10;
	analyser.minDecibels = MIN_DECIBELS;
	audioStreamSource.connect(analyser);

	const bufferLength = analyser.frequencyBinCount;
	const domainData = new Uint8Array(bufferLength);

	setInterval(() => {
		detectSound(analyser, bufferLength, domainData);
	}, 40);
};

export const handleStream = (
	stream: MediaStream,
	detectSound: (
		analyser: AnalyserNode,
		bufferLength: number,
		domainData: Uint8Array
	) => void,
	chunksRef: MutableRefObject<Blob[]>,
	mediaRec: MutableRefObject<MediaRecorder | null>,
	handleStop: () => void
) => {
	console.log('Stream Obtained');

	mediaRec.current = new MediaRecorder(stream);

	mediaRec.current.addEventListener('dataavailable', (e) => {
		handleData(e, chunksRef);
	});

	mediaRec.current.addEventListener('stop', () => {
		handleStop();
	});

	checkAudioLevel(stream, detectSound);
};
