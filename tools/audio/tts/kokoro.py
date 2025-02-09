from typing import Generator, Tuple
import numpy as np
from kokoro import KPipeline
import soundfile as sf
import os


def generate_kokoro_audio(
    text: str,
    voice: str = 'af_heart',
    speed: float = 1.0
) -> Generator[Tuple[str, str, np.ndarray], None, None]:
    """Generate audio using Kokoro TTS.

    Args:
        text: Text to synthesize
        voice: Voice ID to use
        speed: Speaking speed multiplier
    """
    pipeline = KPipeline(lang_code='a')
    generator = pipeline(text, voice=voice, speed=speed)

    return generator


if __name__ == '__main__':
    generator = generate_kokoro_audio(
        "KOKORO TTS is a text-to-speech model developed primarily by "
        "Japanese researchers at the University of Tsukuba.")

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
