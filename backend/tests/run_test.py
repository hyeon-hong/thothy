#!/usr/bin/env python3
"""Main test runner for backend agents."""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to Python path to fix imports
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

# Disable LangSmith tracing for tests
os.environ["LANGCHAIN_TRACING_V2"] = "false"
os.environ["LANGCHAIN_PROJECT"] = ""
os.environ["LANGCHAIN_API_KEY"] = ""


async def run_staff_memory_test():
    """Run the staff memory test."""
    from backend.tests.test_staff_memory import test_staff_memory
    return await test_staff_memory()


async def run_basic_memory_test():
    """Run the simplified basic memory test."""
    from backend.tests.test_basic_memory import test_basic_memory
    return await test_basic_memory()


if __name__ == "__main__":
    print("\n======================================")
    print("  Backend Agent Test Suite")
    print("======================================\n")
    
    # List of tests to run
    tests = [
        ("Basic Memory Test", run_basic_memory_test),
        # Uncomment below to run the full staff agent test
        # ("Staff Memory Test", run_staff_memory_test),
    ]
    
    # Run all tests
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n>> Running: {test_name}")
        print("-" * (len(test_name) + 12))
        
        try:
            test_passed = asyncio.run(test_func())
            if not test_passed:
                all_passed = False
        except Exception as e:
            print(f"\n❌ ERROR: Test raised an exception: {e}")
            all_passed = False
    
    # Final results
    print("\n======================================")
    if all_passed:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED!")
    print("======================================\n")
    
    sys.exit(0 if all_passed else 1) 