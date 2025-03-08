#!/usr/bin/env python3
"""
Monorepo management utility for Thothy projects.

This script provides utilities for managing projects in the Thothy monorepo:
- List all projects
- Install a specific project's dependencies
- Build a specific project
- Run tests for a specific project
- Create a new project
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List


# Root directory of the monorepo
REPO_ROOT = Path(__file__).parent.parent.absolute()
AGENTS_DIR = REPO_ROOT / "agents"


def get_all_projects() -> List[str]:
    """Return a list of all projects in the monorepo."""
    projects = []
    for path in AGENTS_DIR.iterdir():
        if path.is_dir() and (path / "pyproject.toml").exists():
            projects.append(path.name)
    return sorted(projects)


def install_project(project: str, dev: bool = False) -> int:
    """Install a project's dependencies."""
    if project == "all":
        print("Installing all projects...")
        projects = get_all_projects()
        for proj in projects:
            result = install_project(proj, dev)
            if result != 0:
                return result
        return 0
        
    project_dir = AGENTS_DIR / project
    if not (project_dir / "pyproject.toml").exists():
        print(f"Project '{project}' not found or missing pyproject.toml")
        return 1
    
    print(f"Installing {project}...")
    cmd = [sys.executable, "-m", "pip", "install", "-e", "."]
    if dev:
        cmd[-1] = ".[dev]"
    
    return subprocess.call(cmd, cwd=project_dir)


def build_project(project: str) -> int:
    """Build a project."""
    project_dir = AGENTS_DIR / project
    if not (project_dir / "pyproject.toml").exists():
        print(f"Project '{project}' not found or missing pyproject.toml")
        return 1
    
    print(f"Building {project}...")
    try:
        cmd = [sys.executable, "-m", "pip", "install", "build"]
        subprocess.check_call(cmd, stdout=subprocess.PIPE)
    except subprocess.CalledProcessError:
        print("Failed to install build package")
        return 1
    
    return subprocess.call([sys.executable, "-m", "build"], cwd=project_dir)


def test_project(project: str) -> int:
    """Run tests for a project."""
    project_dir = AGENTS_DIR / project
    if not (project_dir / "pyproject.toml").exists():
        print(f"Project '{project}' not found or missing pyproject.toml")
        return 1
    
    print(f"Testing {project}...")
    try:
        cmd = [sys.executable, "-m", "pip", "install", "pytest"]
        subprocess.check_call(cmd, stdout=subprocess.PIPE)
    except subprocess.CalledProcessError:
        print("Failed to install pytest package")
        return 1
    
    return subprocess.call([sys.executable, "-m", "pytest"], cwd=project_dir)


def create_project(project: str) -> int:
    """Create a new project in the monorepo."""
    project_dir = AGENTS_DIR / project
    
    if project_dir.exists():
        print(f"Project directory '{project}' already exists")
        return 1
    
    print(f"Creating new project: {project}")
    project_dir.mkdir(parents=True)
    src_dir = project_dir / "src" / project.replace("-", "_")
    src_dir.mkdir(parents=True)
    
    # Create __init__.py
    init_msg = f'"""Main package for {project}."""'
    init_content = f'{init_msg}\n\n__version__ = "0.0.1"\n'
    with open(src_dir / "__init__.py", "w") as f:
        f.write(init_content)
    
    # Create py.typed
    with open(src_dir / "py.typed", "w") as f:
        pass
    
    # Create pyproject.toml
    with open(project_dir / "pyproject.toml", "w") as f:
        package_name = project.replace("-", "_")
        f.write(f"""[project]
name = "{project}"
version = "0.0.1"
description = "A new project in the Thothy monorepo."
authors = [
    {{ name = "Thothy", email = "ai.thothy@gmail.com" }},
]
license = {{ text = "Apache-2.0" }}
requires-python = ">=3.12"
dependencies = [
    # Add project-specific dependencies here
]

[project.optional-dependencies]
dev = ["mypy>=1.11.1", "ruff>=0.6.1", "pytest-asyncio"]

[build-system]
requires = ["setuptools>=73.0.0", "wheel"]
build-backend = "setuptools.build_meta"

[tool.setuptools]
packages = ["{package_name}"]
package-dir = {{ "{package_name}" = "src/{package_name}" }}

[tool.setuptools.package-data]
"*" = ["py.typed"]
""")
    
    # Create README
    readme_content = f"# {project}\n\nA new project in the Thothy monorepo.\n"
    with open(project_dir / "README.md", "w") as f:
        f.write(readme_content)
    
    # Create tests directory
    tests_dir = project_dir / "tests"
    tests_dir.mkdir()
    with open(tests_dir / "__init__.py", "w") as f:
        pass
    
    pkg_name = project.replace("-", "_")
    test_content = f"""import pytest

def test_import():
    import {pkg_name}
    assert {pkg_name}.__version__ == "0.0.1"
"""
    test_file = tests_dir / f"test_{pkg_name}.py"
    with open(test_file, "w") as f:
        f.write(test_content)
    
    print(f"Project '{project}' created successfully")
    return 0


def main() -> int:
    """Main entry point."""
    desc = "Thothy Monorepo Management Tool"
    parser = argparse.ArgumentParser(description=desc)
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # List command
    subparsers.add_parser("list", help="List all projects")
    
    # Install command
    install_parser = subparsers.add_parser("install", help="Install a project")
    install_parser.add_argument(
        "project", 
        help="Project name to install (use 'all' to install all projects)"
    )
    install_parser.add_argument(
        "--dev", action="store_true", help="Install development dependencies"
    )
    
    # Build command
    build_parser = subparsers.add_parser("build", help="Build a project")
    build_parser.add_argument("project", help="Project name to build")
    
    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests for a project")
    test_parser.add_argument("project", help="Project name to test")
    
    # Create command
    create_parser = subparsers.add_parser(
        "create", help="Create a new project"
    )
    create_parser.add_argument("project", help="Project name to create")
    
    args = parser.parse_args()
    
    if args.command == "list":
        projects = get_all_projects()
        print("Projects in the monorepo:")
        for project in projects:
            print(f"  - {project}")
        return 0
    elif args.command == "install":
        return install_project(args.project, args.dev)
    elif args.command == "build":
        return build_project(args.project)
    elif args.command == "test":
        return test_project(args.project)
    elif args.command == "create":
        return create_project(args.project)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main()) 