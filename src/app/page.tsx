'use client';

import { handleStream } from '@/lib/audioHelpers';
import { useEffect, useRef, useState } from 'react';

const Page = () => {
	const mediaRec = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]); // Using ref instead of state for chunks
	const count = useRef<number>(0);
	const isRecording = useRef<boolean>(false);
	const [isRecordingState, setIsRecordingState] = useState<boolean>(false); // State to mirror the ref
	const [shouldStartCountdown, setShouldStartCountdown] =
		useState<boolean>(false);
	const [text, setText] = useState<string>('');

	const updateRecordingState = (newState: boolean) => {
		isRecording.current = newState;
		setIsRecordingState(newState); // Update state whenever you update the ref
	};

	const handleStop = async () => {
		console.log('Recording stopped, finalizing file...');
		const currentChunks = chunksRef.current;
		if (currentChunks.length === 0) {
			console.log('No data chunks to compile into a file.');
		} else {
			const blob = new Blob(currentChunks, { type: 'audio/webm;codecs=opus' });
			console.log(`Blob created with size: ${blob.size} bytes`);
			chunksRef.current = []; // Reset the ref
			const audioFile = new File([blob], `file${Date.now()}.webm`);
			console.log('Audio file created:', audioFile);

			const formData = new FormData();
			formData.append('audio', blob, 'audio.webm');

			const llmResponse = await fetch(`/api/transcribe`, {
				method: 'POST',
				body: formData,
			});

			const parsedLLMResponse = await llmResponse.json();

			console.log('Parsed LLM Response', parsedLLMResponse);

			setText(parsedLLMResponse.transcribed_text);
		}
	};

	const detectSound = (
		analyser: AnalyserNode,
		bufferLength: number,
		domainData: Uint8Array
	) => {
		let soundDetected: boolean = false;

		analyser.getByteFrequencyData(domainData);

		for (let i = 0; i < bufferLength; i++) {
			if (domainData[i] > 0) {
				soundDetected = true;
				break;
			}
		}

		console.log('Sound detected: ', soundDetected);

		if (soundDetected) {
			if (!isRecording.current) {
				setShouldStartCountdown(false);
				updateRecordingState(true);
				mediaRec.current?.start();
				console.log('Recording started');
			}
		} else {
			if (isRecording.current) {
				if (!shouldStartCountdown) {
					console.log('Silence detected, starting countdown');
					setShouldStartCountdown(true);
				}
			}
		}
	};

	useEffect(() => {
		console.log('Component Mounted');

		if (navigator.mediaDevices) {
			navigator.mediaDevices
				.getUserMedia({ audio: true })
				.then((stream) => {
					handleStream(stream, detectSound, chunksRef, mediaRec, handleStop);
				})
				.catch((e) => {
					console.log('Error calling getUserMedia', e);
				});
		} else {
			console.log('Media devices not supported');
		}
	}, []);

	useEffect(() => {
		const timerId = setInterval(() => {
			if (shouldStartCountdown) {
				count.current += 100;
				// console.log('Count increased', count.current);

				if (count.current >= 1700) {
					setShouldStartCountdown(false);
					count.current = 0;
					updateRecordingState(false);
					mediaRec.current?.stop();
					console.log('Recording stopped after silence');
				}
			}
		}, 100);

		return () => clearInterval(timerId);
	}, [shouldStartCountdown]);

	return (
		<div>
			<p>{isRecordingState ? 'Recording...' : 'Not Recording'}</p>
			<p>{text}</p>
		</div>
	);
};

export default Page;
