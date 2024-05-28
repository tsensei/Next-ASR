import { OpenAI, toFile } from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create a function to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
	try {
		const formData = await request.formData();

		const audioFile = formData.get('audio');

		if (!audioFile || !(audioFile instanceof Blob)) {
			return new Response(JSON.stringify({ error: 'No audio file received' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const buffer = Buffer.from(await audioFile.arrayBuffer());

		// Convert buffer to stream
		const audioStream = Readable.from(buffer);

		// Create a temporary file path
		const tempOutputFile = path.join(
			__dirname,
			`outputFile-${Date.now()}.webm`
		);

		// Process the audio file with FFmpeg
		await new Promise<void>((resolve, reject) => {
			ffmpeg(audioStream)
				.audioFilters(
					'silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-40dB'
				)
				.output(tempOutputFile)
				.on('end', () => {
					resolve();
				})
				.on('error', (err) => {
					reject(err);
				})
				.run();
		});

		// Read the processed audio file
		const processedAudioBuffer = await fsPromises.readFile(tempOutputFile);

		// Create a File instance from the buffer
		const processedAudioFile = new File([processedAudioBuffer], 'audio.webm', {
			type: 'audio/webm',
		});

		const queryTextResponse = await openai.audio.transcriptions.create({
			file: processedAudioFile,
			model: 'whisper-1',
			language: 'en',
		});

		const input = queryTextResponse.text;

		console.log(input);

		// Clean up temporary file
		await fsPromises.unlink(tempOutputFile);

		return new Response(JSON.stringify({ transcribed_text: input }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.log(error);

		return new Response(JSON.stringify({ error: 'Failed to transcribe' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
