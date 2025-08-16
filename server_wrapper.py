#!/usr/bin/env python3
import os
import subprocess
import sys

# Start uvicorn with proper configuration
if __name__ == "__main__":
    cmd = [
        "uvicorn", 
        "main:app", 
        "--host", "0.0.0.0", 
        "--port", "5000",
        "--reload"
    ]
    subprocess.run(cmd)