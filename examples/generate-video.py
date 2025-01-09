import base64
import os
import re

from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletion

from elevenlabs import play
from elevenlabs.client import ElevenLabs

load_dotenv()


def openai_generate_response(prompt: str):
    llm_provider = "OpenAI"
    model_name = os.getenv("OPENAI_MODEL_NAME")
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")

    client = OpenAI(api_key=api_key, base_url=base_url)

    response = client.chat.completions.create(
        model=model_name, messages=[{"role": "user", "content": prompt}]
    )

    if response:
        if isinstance(response, ChatCompletion):
            content = response.choices[0].message.content
        else:
            raise Exception(
                f'[{llm_provider}] returned an invalid response: "{
                    response}", please check your network '
                f"connection and try again."
            )
    else:
        raise Exception(
            f"[{llm_provider}] returned an empty response, please check your network connection and try again."
        )

    return content.replace("\n", "")


def generate_script(video_subject: str, paragraph_number: int, language: str):
    prompt = f"""
# Role: Video Script Generator

## Goals:
Generate a script for a video, depending on the subject of the video.

## Constrains:
1. the script is to be returned as a string with the specified number of paragraphs.
2. do not under any circumstance reference this prompt in your response.
3. get straight to the point, don't start with unnecessary things like, "welcome to this video".
4. you must not include any type of markdown or formatting in the script, never use a title.
5. only return the raw content of the script.
6. do not include "voiceover", "narrator" or similar indicators of what should be spoken at the beginning of each paragraph or line.
7. you must not mention the prompt, or anything about the script itself. also, never talk about the amount of paragraphs or lines. just write the script.
8. respond in the same language as the video subject.

# Initialization:
- video subject: {video_subject}
- number of paragraphs: {paragraph_number}
- language: {language}
""".strip()

    def format_response(response):
        # Clean the script
        # Remove asterisks, hashes
        response = response.replace("*", "")
        response = response.replace("#", "")

        # Remove markdown syntax
        response = re.sub(r"\[.*\]", "", response)
        response = re.sub(r"\(.*\)", "", response)

        # Split the script into paragraphs
        paragraphs = response.split("\n\n")

        # Select the specified number of paragraphs
        # selected_paragraphs = paragraphs[:paragraph_number]

        # Join the selected paragraphs into a single string
        return "\n\n".join(paragraphs)

    response = openai_generate_response(prompt=prompt)
    final_script = format_response(response)

    return final_script.strip()


def generate_video_search_terms(video_subject: str, video_script: str, amount: int = 5):
    prompt = f"""
# Role: Video Search Terms Generator

## Goals:
Generate {amount} search terms for stock videos, depending on the subject of a video.

## Constrains:
1. the search terms are to be returned as a json-array of strings.
2. each search term should consist of 1-3 words, always add the main subject of the video.
3. you must only return the json-array of strings. you must not return anything else. you must not return the script.
4. the search terms must be related to the subject of the video.
5. reply with english search terms only.

## Output Example:
["search term 1", "search term 2", "search term 3","search term 4","search term 5"]

## Context:
### Video Subject
{video_subject}

### Video Script
{video_script}

Please note that you must use English for generating video search terms; Chinese is not accepted.
""".strip()
    response = openai_generate_response(prompt)
    return response


def generate_audio(video_script: str, voice_name: str, voice_rate: int):
    api_key = os.getenv("ELEVENLABS_API_KEY")

    client = ElevenLabs(api_key=api_key)

    result = client.text_to_speech.convert_with_timestamps(
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        output_format="mp3_44100_128",
        text=video_script,
        model_id="eleven_multilingual_v2",
    )

    audio_bytes = base64.b64decode(result["audio_base64"])
    # print(f"alignment: {result['alignment']}")
    play(audio_bytes)

    audio_file_path = os.path.join(os.getcwd(), "audio.mp3")
    with open(audio_file_path, mode='wb') as audio_file:
        audio_file.write(audio_bytes)
    return audio_file_path


def generate_subtitle(script: str):
    return "Hello World"


def search_and_download_videos(video_search_terms: list[str]):
    return ["Hello World"]


def generate_video(downloaded_videos: list[str], audio: str, subtitle: str):
    return "Hello World"


def start(video_subject: str, paragraph_number: int, language: str, voice_name: str, voice_rate: int, video_search_term_amount: int):
    # 1. Generate a script
    video_script = generate_script(video_subject, paragraph_number, language)
    print(f"video_script: {video_script}")

    # 2. Generate video search terms
    video_search_terms = generate_video_search_terms(
        video_subject, video_script, video_search_term_amount
    )
    print(f"video_search_terms: {video_search_terms}")

    # 3. Generate audio
    audio = generate_audio(video_script, voice_name, voice_rate)

    # 4. Generate subtitle
    subtitle = generate_subtitle(video_script)

    # 5. Search and download videos
    downloaded_videos = search_and_download_videos(video_search_terms)

    # 6. Generate video
    video = generate_video(downloaded_videos, audio, subtitle)

    return video


if __name__ == "__main__":
    start(
        video_subject="Funny Cats",
        paragraph_number=1,
        language="english",
        voice_name="zh-CN-XiaoyiNeural-Female",
        voice_rate=1.0,
        video_search_term_amount=5,
    )
