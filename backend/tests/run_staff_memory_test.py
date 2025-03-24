#!/usr/bin/env python3
"""Runner script for staff memory test."""

import asyncio
import sys
from backend.tests.test_staff_memory import test_staff_memory

print("=== Staff Memory Test ===")
result = asyncio.run(test_staff_memory())
sys.exit(0 if result else 1) 