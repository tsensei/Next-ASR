'use client';

import React, { useState, useEffect } from 'react';
import SpeechRecognition, {
	useSpeechRecognition,
} from 'react-speech-recognition';
import listeningAnimation from '../Components/listening.json';
import Lottie from 'lottie-react';
import { FaMicrophone } from 'react-icons/fa';
import { Cross1Icon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
export default function Tester() {
	const navigator = useNavigate();
	const {
		transcript,
		listening,
		resetTranscript,
		browserSupportsSpeechRecognition,
		isMicrophoneAvailable,
	} = useSpeechRecognition();

	const startListen = () => {
		if (!browserSupportsSpeechRecognition) {
			alert('Your browser does not support audio input');
			return;
		}
		resetTranscript();
		SpeechRecognition.startListening({ continuous: true, language: 'en-US' }); //hi-IN
	};
	const endListen = () => {
		SpeechRecognition.stopListening();
		console.log('Transcript : ', transcript);
	};
	useEffect(() => {
		startListen();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		if (transcript != '') {
			alert('ChangingPage');
		}
	}, [transcript]);

	return (
		<div className="flex flex-col items-center ">
			{/**AUDIO */}
			{listening && (
				<div className="fixed bottom-16 right-8 flex my-2">
					<div className="relative p-4 flex flex-col items-center justify-center bg-white max-w-[300px] border border-gray-200 rounded-lg shadow-md h dark:bg-gray-800 dark:border-gray-700 ">
						<button
							onClick={() => {
								resetTranscript();
								SpeechRecognition.stopListening();
							}}
							className={`absolute  top-2 right-2 bg-white hover:bg-gray-200 cursor-pointer rounded-md border border-gray-200 shadow-lg p-1 text-xl`}
						>
							<Cross1Icon width={12} height={12} />
						</button>
						<Lottie
							animationData={listeningAnimation}
							loop={true}
							className="w-[150px]"
						/>
						<p className="text-center mt-4">{transcript}</p>
					</div>
				</div>
			)}
			{!listening && (
				<button
					type="button"
					onClick={() => startListen()}
					className="fixed bottom-4 right-4  mx-1 text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-4 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					<FaMicrophone />
				</button>
			)}
			{listening && (
				<button
					type="button"
					onClick={() => endListen()}
					className="fixed bottom-4 right-4  mx-1 text-white  bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-4 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
				>
					<FaMicrophone />
				</button>
			)}
		</div>
	);
}
