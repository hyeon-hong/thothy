import asyncio
import base64
import os
import uuid
import aiohttp
from langchain_google_genai import ChatGoogleGenerativeAI
from openai import OpenAI
from supabase import create_client, Client

from slide_graph.ppt_generator.models.query_and_prompt_models import (
    ImagePromptWithThemeAndAspectRatio,
)
from slide_graph.api.utils import get_resource

BUCKET_NAME = "slide-agent-images"


async def upload_image_to_supabase_store(image_path: str, presentation_id: str) -> str:
    """Upload image to Supabase storage and return the public URL"""
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            print("Supabase credentials not found")
            return image_path

        supabase: Client = create_client(supabase_url, supabase_key)

        # Extract filename from path
        filename = os.path.basename(image_path)

        # Create folder path with presentation_id
        storage_path = f"{presentation_id}/{filename}"

        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()

        # Upload to Supabase storage bucket
        result = supabase.storage.from_(BUCKET_NAME).upload(
            storage_path, image_data, {"content-type": "image/jpeg"}
        )

        if result.get("error"):
            print(f"Error uploading to Supabase: {result['error']}")
            return image_path

        # Get public URL
        public_url = supabase.storage.from_(
            BUCKET_NAME).get_public_url(storage_path)

        print(f"Image uploaded to Supabase: {public_url}")
        return public_url

    except Exception as e:
        print(f"Error uploading image to Supabase: {e}")
        return image_path


async def generate_image(
    input: ImagePromptWithThemeAndAspectRatio,
    output_directory: str,
    presentation_id: str,
) -> tuple[str, str]:  # Returns (local_path, supabase_url)
    image_prompt = f"{input.image_prompt}, {input.theme_prompt}"
    print(f"Request - Generating Image for {image_prompt}")

    try:
        image_gen_func = (
            generate_image_openai
            if os.getenv("LLM") == "openai"
            else generate_image_google
        )
        image_path = await image_gen_func(image_prompt, output_directory)
        if image_path and os.path.exists(image_path):
            # Upload image to Supabase storage
            supabase_url = await upload_image_to_supabase_store(image_path, presentation_id)
            return image_path, supabase_url  # Return both local path and Supabase URL
        raise Exception(f"Image not found at {image_path}")

    except Exception as e:
        print(f"Error generating image: {e}")
        placeholder_path = get_resource("assets/images/placeholder.jpg")
        return placeholder_path, placeholder_path  # Return same path for both if error


async def generate_image_openai(prompt: str, output_directory: str) -> str:
    client = OpenAI()
    result = await asyncio.to_thread(
        client.images.generate,
        model="dall-e-3",
        prompt=prompt,
        n=1,
        quality="standard",
        size="1024x1024",
    )
    image_url = result.data[0].url
    async with aiohttp.ClientSession() as session:
        async with session.get(image_url) as response:
            image_bytes = await response.read()
            image_path = os.path.join(
                output_directory, f"{str(uuid.uuid4())}.jpg")
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            return image_path


async def generate_image_google(prompt: str, output_directory: str) -> str:
    response = await ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-preview-image-generation"
    ).ainvoke([prompt], generation_config={"response_modalities": ["TEXT", "IMAGE"]})

    image_block = next(
        block
        for block in response.content
        if isinstance(block, dict) and block.get("image_url")
    )

    base64_image = image_block["image_url"].get("url").split(",")[-1]
    image_path = os.path.join(output_directory, f"{str(uuid.uuid4())}.jpg")
    with open(image_path, "wb") as f:
        f.write(base64.b64decode(base64_image))

    return image_path
