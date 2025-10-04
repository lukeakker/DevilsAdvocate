#!/usr/bin/env python3
"""
Utility script for running Django administrative tasks.

This file is provided as part of the hackathon skeleton. It exposes the
standard ``django-admin`` functionality when executed. See Django's
documentation for full details on how to use this file. When running
locally you can start the development server via ``python manage.py runserver``.

You generally won't need to modify this file.
"""
import os
import sys


def main() -> None:
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "devdebate.settings")
    try:
        from django.core.management import execute_from_command_line  # type: ignore
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available "
            "on your PYTHONPATH environment variable? Did you forget to activate "
            "a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()