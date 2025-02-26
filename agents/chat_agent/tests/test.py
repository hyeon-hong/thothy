# Get database URL
from psycopg import Connection
import os

from dotenv import load_dotenv
from langgraph.store.postgres import PostgresStore

load_dotenv()
db_url = os.getenv('SUPABASE_URL')
if not db_url:
    raise ValueError("SUPABASE_URL environment variable is not set")

print(f"db_url: {db_url}")
conn = Connection.connect(db_url, autocommit=True)
print(f"conn: {conn}")
store = PostgresStore(
    conn,
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
        "fields": ["test-memory"],
    }
)
print(f"store: {store}")
store.setup()

namespace = ("memories", "test-user-123", "triples")
store.put(namespace, "test-memory-1", {"data": "test1"})
store.put(namespace, "test-memory-2", {"data": "test2"})

result = store.get(namespace, "test-memory-1")
print(f"result: {result}")

results = store.search(
    namespace,
    query="test1",
    limit=5
)
print(f"results: {results}")
