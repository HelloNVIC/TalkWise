import logging
import re
from typing import AsyncIterator

from openai import AsyncOpenAI

from app.config import LLMConfig, ModelConfig

logger = logging.getLogger("talkwise.llm")

# ANSI color codes for terminal debug output
C_RESET = "\033[0m"
C_RED = "\033[31m"
C_GREEN = "\033[32m"
C_YELLOW = "\033[33m"
C_BLUE = "\033[34m"
C_MAGENTA = "\033[35m"
C_CYAN = "\033[36m"
C_DIM = "\033[2m"


class LLMError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def _debug_log(config: LLMConfig, label: str, message: str, color: str = C_CYAN):
    if config.debug:
        logger.info(f"{color}{label}{C_RESET} {message}")


class LLMClient:
    def __init__(self, config: LLMConfig):
        self._config = config
        self._client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.base_url.rstrip("/"),
        )
        self._fail_counts: dict[str, int] = {m.name: 0 for m in config.models}
        self._current_index = 0

    def update_config(self, config: LLMConfig):
        self._config = config
        self._client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.base_url.rstrip("/"),
        )
        self._fail_counts = {m.name: 0 for m in config.models}
        self._current_index = 0

    @property
    def current_model(self) -> ModelConfig:
        return self._config.models[self._current_index]

    def _next_model(self) -> ModelConfig | None:
        for i in range(len(self._config.models)):
            idx = (self._current_index + 1 + i) % len(self._config.models)
            model = self._config.models[idx]
            if self._fail_counts[model.name] < 3:
                self._current_index = idx
                return model
        return None

    def _record_success(self, name: str):
        self._fail_counts[name] = 0

    def _record_failure(self, name: str):
        self._fail_counts[name] += 1

    async def chat_stream(
        self, system_prompt: str, user_prompt: str
    ) -> AsyncIterator[dict]:
        """Stream output with automatic model fallback.

        Yields dicts with type:
          - {"type": "thinking", "content": "..."}  — thinking/reasoning chunk
          - {"type": "content", "content": "..."}   — final answer chunk
          - {"type": "model", "name": "..."}        — model info
          - {"type": "error", "message": "..."}     — error
          - {"type": "done"}                        — stream complete

        Thinking detection strategy (by model):
          GLM-5.1 / Kimi-K2.6 / DeepSeek-V4-Flash:
            reasoning comes via delta.reasoning_content (separate field)
          MiniMax-M2.7:
            reasoning is mixed inside delta.content, wrapped in ځ...лина tags
          Fallback:
            detect ځ / <thought> / <!--think--> tags in content
        """
        tried = set()
        model = self.current_model

        while model and model.name not in tried:
            tried.add(model.name)
            yield {"type": "model", "name": model.name}

            _debug_log(self._config, "[REQUEST]",
                       f"model={model.name} | priority={model.priority} | "
                       f"temperature={model.temperature} | thinking={model.thinking}",
                       C_BLUE)
            _debug_log(self._config, "[SYSTEM]", system_prompt[:500], C_MAGENTA)
            _debug_log(self._config, "[USER]", user_prompt[:500], C_GREEN)

            try:
                # Enable thinking for models that support it
                create_kwargs = {
                    "model": model.name,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": model.temperature,
                    "max_tokens": model.max_tokens,
                    "stream": True,
                }
                if model.thinking:
                    create_kwargs["extra_body"] = {
                        "thinking": {"type": "enabled", "budget_tokens": 4096}
                    }

                stream = await self._client.chat.completions.create(**create_kwargs)

                in_thinking_tags = False
                full_thinking = ""
                full_content = ""

                async for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta

                    # 1. Separate reasoning_content field (GLM-5.1, Kimi-K2.6, DeepSeek-V4-Flash)
                    reasoning = getattr(delta, "reasoning_content", None)
                    if reasoning:
                        full_thinking += reasoning
                        yield {"type": "thinking", "content": reasoning}
                        continue

                    content = delta.content or ""
                    if not content:
                        continue

                    # 2. Detect thinking tags in content (MiniMax-M2.7 and fallback)
                    #    <think>...</think> pattern
                    if not in_thinking_tags:
                        if "<think>" in content or "<thought>" in content:
                            in_thinking_tags = True

                    if in_thinking_tags:
                        full_thinking += content
                        yield {"type": "thinking", "content": content}
                        # Detect closing tag
                        if "</think>" in content or "</thought>" in content:
                            in_thinking_tags = False
                        continue

                    # 3. Regular content
                    full_content += content
                    yield {"type": "content", "content": content}

                yield {"type": "done"}

                _debug_log(self._config, "[RESPONSE]",
                           f"model={model.name} | content_len={len(full_content)} | "
                           f"thinking_len={len(full_thinking)}",
                           C_YELLOW)
                if full_content:
                    _debug_log(self._config, "[CONTENT]", full_content[:500], C_GREEN)
                if full_thinking:
                    _debug_log(self._config, "[THINKING]", full_thinking[:300], C_DIM)

                self._record_success(model.name)
                return

            except LLMError:
                raise
            except Exception as e:
                self._record_failure(model.name)
                _debug_log(self._config, "[ERROR]",
                           f"model={model.name} | {type(e).__name__}: {e}", C_RED)
                model = self._next_model()
                if model:
                    _debug_log(self._config, "[FALLBACK]",
                               f"降级到模型: {model.name}", C_YELLOW)
                continue

        yield {"type": "error", "message": "所有模型均不可用，请稍后再试"}

    async def chat(self, system_prompt: str, user_prompt: str) -> str:
        """Non-streaming fallback, collects full response."""
        chunks = []
        async for event in self.chat_stream(system_prompt, user_prompt):
            if event["type"] == "content":
                chunks.append(event["content"])
            elif event["type"] == "error":
                raise LLMError(event["message"])
        return "".join(chunks)
