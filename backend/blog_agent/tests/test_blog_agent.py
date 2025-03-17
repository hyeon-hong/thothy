"""Test the blog agent functionality."""

import logging
import os
import asyncio
from dotenv import load_dotenv
from blog_graph.tools import post_blog

# Load environment variables
load_dotenv()

# Get user ID from environment
USER_ID = os.getenv("BLOG_AGENT_USER_ID")
logging.warning(f"USER_ID: {USER_ID}")
if not USER_ID:
    raise ValueError("BLOG_AGENT_USER_ID environment variable is not set")


async def test_create_blog():
    """Test creating a blog post with mock content."""
    try:
        # Mock blog content
        title = "Getting Started with Python: A Beginner's Guide"
        content = """
        <h1>Getting Started with Python: A Beginner's Guide</h1>

        <p>Python has become one of the most popular programming languages in 
        the world, and for good reason. Its simple syntax, readability, and vast 
        ecosystem of libraries make it an excellent choice for beginners and 
        experts alike.</p>

        <h2>Why Choose Python?</h2>
        <ul>
            <li>Easy to learn and read</li>
            <li>Large community and support</li>
            <li>Extensive library ecosystem</li>
            <li>Versatile applications (web, data science, AI, etc.)</li>
        </ul>

        <h2>Setting Up Your Environment</h2>
        <p>To get started with Python, you'll need to:</p>
        <ol>
            <li>Download Python from python.org</li>
            <li>Install a code editor (like VS Code or PyCharm)</li>
            <li>Set up your development environment</li>
        </ol>

        <h2>Your First Python Program</h2>
        <pre><code>
# This is your first Python program
print("Hello, World!")
        </code></pre>

        <p>Stay tuned for more Python tutorials and tips!</p>
        """

        # Create the blog post
        result = await post_blog(
            title=title,
            content=content,
            user_id=USER_ID
        )

        print("Successfully created blog post:")
        print(f"Title: {result['title']}")
        print(f"ID: {result['id']}")
        print(f"Created at: {result['created_at']}")

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_create_blog())
