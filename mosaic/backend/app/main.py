"""
Main FastAPI application for Algorise Workflows.
Handles workflow management and Clerk webhook integration.
"""

import logging

from app.api import routes_root
from app.api import routes_webhooks
from app.core.config import supabase
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="mosAIc API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mosaic-azure.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_root.router)
app.include_router(routes_webhooks.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
