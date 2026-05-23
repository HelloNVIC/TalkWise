import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.models import (
    DecodeRequest, DecodeResponse,
    ExplainRequest, ExplainResponse,
    StyleInfo, TranslateRequest, TranslateResponse,
)
from app.services.llm_client import LLMClient, LLMError
from app.services.prompt_builder import PromptBuilder

router = APIRouter()


def get_prompt_builder() -> PromptBuilder:
    from app.main import prompt_builder
    return prompt_builder


def get_llm_client() -> LLMClient:
    from app.main import llm_client
    return llm_client


@router.get("/styles", response_model=list[StyleInfo])
async def get_styles(pb: PromptBuilder = Depends(get_prompt_builder)):
    return pb.get_available_styles()


async def _stream_translate(req: TranslateRequest, pb: PromptBuilder, llm: LLMClient):
    try:
        system, user = pb.get_translate_prompt(req.style, req.text)
    except ValueError as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        return

    yield f"data: {json.dumps({'type': 'meta', 'original': req.text, 'style': req.style})}\n\n"

    try:
        async for event in llm.chat_stream(system, user):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    except LLMError as e:
        yield f"data: {json.dumps({'type': 'error', 'message': e.message})}\n\n"


async def _stream_decode(req: DecodeRequest, pb: PromptBuilder, llm: LLMClient):
    try:
        system, user = pb.get_decode_prompt(req.text)
    except ValueError as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        return

    yield f"data: {json.dumps({'type': 'meta', 'original': req.text})}\n\n"

    try:
        async for event in llm.chat_stream(system, user):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    except LLMError as e:
        yield f"data: {json.dumps({'type': 'error', 'message': e.message})}\n\n"


async def _stream_explain(req: ExplainRequest, llm: LLMClient):
    system = (
        "你是一位职场语言分析专家。用户会给你一段翻译结果中的某个句子，"
        "以及对应的原文和翻译风格。请你用一两句话简洁解释这句话为什么这样翻译，"
        "点出关键词的转换逻辑即可，不要展开分析。"
    )
    if req.style:
        user = (
            f"原文：{req.original}\n"
            f"翻译风格：{req.style}\n"
            f"翻译结果中的句子：{req.translated}\n\n"
            f"用一两句话解释为什么这样翻译。"
        )
    else:
        user = (
            f"老板原话：{req.original}\n"
            f"潜台词翻译中的句子：{req.translated}\n\n"
            f"用一两句话解释潜台词逻辑。"
        )

    yield f"data: {json.dumps({'type': 'meta', 'sentence': req.translated})}\n\n"

    try:
        async for event in llm.chat_stream(system, user):
            # For explain, skip thinking chunks in SSE output
            if event["type"] == "thinking":
                continue
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    except LLMError as e:
        yield f"data: {json.dumps({'type': 'error', 'message': e.message})}\n\n"


@router.post("/translate")
async def translate(
    req: TranslateRequest,
    pb: PromptBuilder = Depends(get_prompt_builder),
    llm: LLMClient = Depends(get_llm_client),
):
    return StreamingResponse(
        _stream_translate(req, pb, llm),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/decode")
async def decode(
    req: DecodeRequest,
    pb: PromptBuilder = Depends(get_prompt_builder),
    llm: LLMClient = Depends(get_llm_client),
):
    return StreamingResponse(
        _stream_decode(req, pb, llm),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/explain")
async def explain(
    req: ExplainRequest,
    llm: LLMClient = Depends(get_llm_client),
):
    return StreamingResponse(
        _stream_explain(req, llm),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
