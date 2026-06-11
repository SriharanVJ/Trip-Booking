"""Prisma client integration for FastAPI backend"""

import os
import subprocess
import sys
from pathlib import Path

# Add the parent directory to Python path to import from root
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Import Prisma Client
from prisma import Prisma, Client

# Global Prisma client instance
prisma_client: Client = None


async def get_prisma() -> Client:
    """Get or create Prisma client instance"""
    global prisma_client

    if prisma_client is None:
        prisma_client = Prisma()
        await prisma_client.connect()

    return prisma_client


async def close_prisma():
    """Close Prisma client connection"""
    global prisma_client

    if prisma_client is not None:
        await prisma_client.disconnect()
        prisma_client = None
