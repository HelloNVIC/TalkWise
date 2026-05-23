from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="真心话原文")
    style: str = Field(..., description="翻译风格")


class TranslateResponse(BaseModel):
    original: str
    style: str
    translated: str


class DecodeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="老板原话")


class DecodeResponse(BaseModel):
    original: str
    decoded: str


class ExplainRequest(BaseModel):
    original: str = Field(..., min_length=1, max_length=2000, description="用户原文")
    translated: str = Field(..., min_length=1, max_length=2000, description="翻译结果中的句子")
    style: str = Field("", description="翻译风格（可选，用于场面话解释）")


class ExplainResponse(BaseModel):
    sentence: str
    explanation: str


class StyleInfo(BaseModel):
    key: str
    name: str
    description: str
