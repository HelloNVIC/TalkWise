import json
import logging
from pathlib import Path

logger = logging.getLogger("talkwise.config")


class ModelConfig:
    def __init__(self, data: dict):
        self.name: str = data["name"]
        self.priority: int = data["priority"]
        self.temperature: float = data["temperature"]
        self.max_tokens: int = data["max_tokens"]
        self.thinking: bool = data.get("thinking", False)
        self.description: str = data.get("description", "")

    def __eq__(self, other):
        return isinstance(other, ModelConfig) and self.__dict__ == other.__dict__


class LLMConfig:
    def __init__(self, config_path: Path):
        self._config_path = config_path
        self._load()

    def _load(self):
        with open(self._config_path, encoding="utf-8") as f:
            raw = json.load(f)
        self.api_key: str = raw["api_key"]
        self.base_url: str = raw["base_url"]
        self.debug: bool = raw.get("debug", False)
        self.models: list[ModelConfig] = sorted(
            [ModelConfig(m) for m in raw["models"]],
            key=lambda m: m.priority,
        )

    def reload(self) -> bool:
        old_api_key = self.api_key
        old_base_url = self.base_url
        old_models = self.models
        try:
            self._load()
        except Exception as e:
            logger.warning("配置热更新失败: %s", e)
            return False
        changed = (
            old_api_key != self.api_key
            or old_base_url != self.base_url
            or old_models != self.models
        )
        if changed:
            logger.info(
                "配置热更新成功 | base_url=%s | models=%s",
                self.base_url,
                ", ".join(m.name for m in self.models),
            )
        return changed


LLM_CONFIG_PATH = Path(__file__).parent.parent / "llm_config.json"
llm_config = LLMConfig(LLM_CONFIG_PATH)
