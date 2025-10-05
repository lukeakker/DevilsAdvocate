#!/usr/bin/env python3
"""Quick script to check if environment variables are configured."""
import os
from dotenv import load_dotenv

load_dotenv()

print("🔍 Checking environment variables...\n")

# Check ELEVENLABS_API_KEY
elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
if elevenlabs_key:
    print(f"✅ ELEVENLABS_API_KEY is set (length: {len(elevenlabs_key)})")
    print(f"   First 10 chars: {elevenlabs_key[:10]}...")
else:
    print("❌ ELEVENLABS_API_KEY is NOT set")

# Check OPENAI_API_KEY
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key:
    print(f"✅ OPENAI_API_KEY is set (length: {len(openai_key)})")
    print(f"   First 10 chars: {openai_key[:10]}...")
else:
    print("❌ OPENAI_API_KEY is NOT set")

# Check other relevant vars
print(f"\n📋 Other settings:")
print(f"   ELEVENLABS_MODEL: {os.getenv('ELEVENLABS_MODEL', 'eleven_monolingual_v1')}")
print(f"   OPENAI_MODEL: {os.getenv('OPENAI_MODEL', 'gpt-4o')}")
print(f"   DJANGO_SECRET_KEY: {'Set' if os.getenv('DJANGO_SECRET_KEY') else 'Not set (using default)'}")
