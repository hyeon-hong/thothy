from typing import Generator, Tuple
import numpy as np
from kokoro import KPipeline


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
    generate_kokoro_audio(
        "KOKORO TTS is a text-to-speech model developed primarily by "
        "Japanese researchers at the University of Tsukuba.")
