import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY")
    pinecone_index_name: str = os.getenv("PINECONE_INDEX_NAME")
    pinecone_namespace: str = os.getenv("PINECONE_NAMESPACE")
    # model: str = "accounts/fireworks/models/firefunction-v2"
    model: str = "gpt-4o-mini"


SETTINGS = Settings()
