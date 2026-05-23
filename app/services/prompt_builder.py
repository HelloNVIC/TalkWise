from pathlib import Path

import yaml


class PromptBuilder:
    def __init__(self, prompts_dir: Path):
        self._translate_config = self._load_yaml(prompts_dir / "translate.yaml")
        self._decode_config = self._load_yaml(prompts_dir / "decode.yaml")
        self._styles = self._translate_config["styles"]

    @staticmethod
    def _load_yaml(path: Path) -> dict:
        with open(path, encoding="utf-8") as f:
            return yaml.safe_load(f)

    def get_translate_prompt(self, style: str, user_input: str) -> tuple[str, str]:
        if style not in self._styles:
            raise ValueError(f"未知翻译风格: {style}")
        style_config = self._styles[style]
        return (
            style_config["system"],
            self._translate_config["user_template"].format(
                style_name=style_config["name"],
                user_input=user_input,
            ),
        )

    def get_decode_prompt(self, user_input: str) -> tuple[str, str]:
        return (
            self._decode_config["system"],
            self._decode_config["user_template"].format(user_input=user_input),
        )

    def get_available_styles(self) -> list[dict]:
        return [
            {"key": k, "name": v["name"], "description": v["description"]}
            for k, v in self._styles.items()
        ]
