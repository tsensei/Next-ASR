import { OpenAI, toFile } from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
	try {
		const formData = await request.formData();

		const audioFile = formData.get('audio');

		if (!audioFile || !(audioFile instanceof Blob)) {
			return Response.json(
				{ error: 'No audio file received' },
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const buffer = Buffer.from(await audioFile.arrayBuffer());

		const mp3File = await toFile(buffer, 'audio.webm');

		const queryTextResponse = await openai.audio.transcriptions.create({
			file: mp3File,
			model: 'whisper-1',
		});

		const input = queryTextResponse.text;

		console.log(input);

		return Response.json({
			transcribed_text: input,
		});
	} catch (error) {
		console.log(error);

		return Response.json({ error: 'Failed to transcribe' }, { status: 500 });
	}
}
