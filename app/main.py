import asyncio
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import llm_config
from app.routers.api import router as api_router
from app.services.llm_client import LLMClient
from app.services.prompt_builder import PromptBuilder

BASE_DIR = Path(__file__).parent.parent

if llm_config.debug:
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s %(message)s",
        datefmt="%H:%M:%S",
    )

logger = logging.getLogger("talkwise.config")

prompt_builder = PromptBuilder(BASE_DIR / "prompts")
llm_client = LLMClient(llm_config)

app = FastAPI(title="TalkWise 话霉", version="1.0.0", docs_url="/docs")

app.include_router(api_router, prefix="/api")

app.mount("/", StaticFiles(directory=BASE_DIR / "static", html=True), name="static")


@app.on_event("startup")
async def _watch_config():
    async def _loop():
        last_mtime = llm_config._config_path.stat().st_mtime
        while True:
            await asyncio.sleep(2)
            try:
                mtime = llm_config._config_path.stat().st_mtime
            except FileNotFoundError:
                continue
            if mtime != last_mtime:
                last_mtime = mtime
                changed = llm_config.reload()
                if changed:
                    llm_client.update_config(llm_config)

    asyncio.create_task(_loop())
