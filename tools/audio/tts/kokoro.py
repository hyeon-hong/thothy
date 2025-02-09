from kokoro import KPipeline
import soundfile as sf
import os


def generate_kokoro_audio(
    text: str,
    voice: str = 'af_heart',
    speed: float = 1.0
) -> None:
    """Generate audio using Kokoro TTS.

    Args:
        text: Text to synthesize
        voice: Voice ID to use
        speed: Speaking speed multiplier
    """
    pipeline = KPipeline(lang_code='a')
    generator = pipeline(text, voice=voice, speed=speed)

    for i, (gs, ps, audio) in enumerate(generator):
        # i => index
        print(i)
        # gs => graphemes/text
        print(gs)
        # ps => phonemes
        print(ps)

    # Create outputs directory if it doesn't exist
    if not os.path.exists('outputs'):
        os.makedirs('outputs')

    # save each audio file
    sf.write(f'outputs/{i}.wav', audio, 24000)


if __name__ == '__main__':
    generate_kokoro_audio(
        "KOKORO TTS is a text-to-speech model developed primarily by "
        "Japanese researchers at the University of Tsukuba.")
