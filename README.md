<div align="center">

<img src="static/logo.svg" width="120" />

# 🍄 话霉 TalkWise

**职场话术翻译器 —— 让真心话变成场面话，让 BOSS 潜台词无处遁形**

[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[🚀 快速开始](#-快速开始) · [✨ 功能特性](#-功能特性) · [🎨 翻译风格](#-翻译风格) · [⚙️ 配置说明](#️-llm-配置) · [🛡️ 多模型降级](#-多模型降级)

</div>

---

## 💡 这是什么？

职场如战场，说话是第一生产力 💪

- 想说"这需求太离谱了"但嘴上得说"这个方向很有挑战性"？🤔
- 老板说"你看着办"到底是让你办还是不让你办？😨
- 每次写周报都要把摸鱼包装成"赋能业务闭环"？🤯

**话霉 TalkWise** 就是你的职场话术翻译官 —— 一端输入真心话，一端输出场面话；一端输入 BOSS 原话，一端输出潜台词真相 🔓

---

## ✨ 功能特性

### 🎭 真心话 → 场面话

> 把你想说的直白吐槽，翻译成体面的职场表达

支持 **8 种翻译风格**，总有一款适合你的场景 👇

### 🔍 BOSS 潜台词解码

> 老板说的每句话，背后都有一层意思

直接粗暴，一针见血，用最接地气的大白话翻译 😎

### 📖 逐句解析

> 翻译结果每一句都可以点击，展开 AI 解释"为什么这样翻译"

不只是翻译，更是教学 —— 点多了你就学会了 🧠

### 💬 职场金句

> 页面空白不再是空白，随机滚动职场金句，每 10 秒换一条

35+ 条金句，每一条都让你拍案叫绝又细思极恐 😏

### 🎯 示例卡片

> 不知道说什么？点一下示例卡片直接填入输入框

每个 Tab 专属示例，即点即用，零门槛上手 🖱️

### 🔄 配置热更新

> 修改 `llm_config.json` 保存即生效，无需重启服务

后端终端自动提示配置变更 ⚡

### 🛡️ 多模型自动降级

> 主模型挂了？自动切下一个，所有模型都挂了才报错

连续失败 3 次的模型会被跳过，服务稳如老狗 🐕

### 🧠 思考过程可视化

> 模型的思考过程实时展示，看 AI 如何一步步推理

翻译前先看 Agent 思考，懂了才是真的懂 🤓

### ✅ 我懂了交互

> 翻译完点"我懂了"→ 自动复制 + 弹出"你又懂了？"

"我没懂"继续看，"win！"返回输入 —— 仪式感拉满 🎉

---

## 🎨 翻译风格

| 风格 | 一句话描述 | 适用场景 |
|:---:|:---|:---|
| 🌸 委婉得体 | 温婉含蓄，给足面子 | 跟领导提意见 |
| 📋 正式规范 | 公文风格，严谨专业 | 写邮件、写报告 |
| ✂️ 简洁精炼 | 言简意赅，一针见血 | 微信回复、站会发言 |
| 😄 幽默风趣 | 诙谐有趣，化解尴尬 | 破冰、活跃气氛 |
| 💻 IT黑话 | 互联网术语，对齐颗粒度 | 写周报、做汇报 |
| 🧠 高情商表达 | 四两拨千斤，滴水不漏 | 跨部门撕逼、向上管理 |
| 🗿 阴阳怪气 | 正话反说，明褒暗贬 | 不爽但不敢说的时候 |
| 🏛️ 官腔官调 | 体制内公文风，四平八稳 | 体制内汇报、公文撰写 |

---

## 🚀 快速开始

### 1️⃣ 克隆项目

```bash
git clone https://github.com/HelloNVIC/TalkWise.git
cd TalkWise
```

### 2️⃣ 创建虚拟环境 & 安装依赖

```bash
python -m venv venv

# Windows
source venv/Scripts/activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt
```

### 3️⃣ 配置 LLM

```bash
cp llm_config.example.json llm_config.json
```

编辑 `llm_config.json`，填入你的 API Key 和模型配置 🔑

### 4️⃣ 启动！

```bash
python talkwise.py
```

浏览器自动打开 http://localhost:8000 ，开搞 🎉

---

## ⚙️ LLM 配置

编辑 `llm_config.json`（已在 `.gitignore` 中，不会泄露密钥 🔒）：

```json
{
  "api_key": "你的API密钥",
  "base_url": "https://api.ckh-cn.site/v1",
  "debug": true,
  "models": [
    {
      "name": "GLM-5.1",
      "priority": 1,
      "temperature": 0.7,
      "max_tokens": 4096,
      "thinking": true,
      "description": "智谱GLM-5.1，推理能力强"
    }
  ]
}
```

### 全局配置

| 字段 | 说明 | 必填 |
|:---:|:---|:---:|
| `api_key` | API 密钥 | ✅ |
| `base_url` | OpenAI 兼容端点 | ✅ |
| `debug` | 调试模式，终端显示 LLM 交互日志 | ❌ |

### 模型配置

| 字段 | 说明 | 必填 |
|:---:|:---|:---:|
| `name` | 模型名称 | ✅ |
| `priority` | 优先级（数字越小越优先） | ✅ |
| `temperature` | 温度参数 | ✅ |
| `max_tokens` | 最大 token 数 | ✅ |
| `thinking` | 启用思考模式（reasoning_content） | ❌ |
| `description` | 模型描述 | ❌ |

---

## 🛡️ 多模型降级

配置的模型列表按 `priority` 排序，当主模型请求失败时自动降级到下一个模型，连续失败 3 次的模型会被跳过 🚫

**思考过程检测策略**：

| 模型类型 | 思考过程返回方式 |
|:---:|:---|
| `thinking: true` | 通过 `reasoning_content` 字段独立返回 ✅ |
| `thinking: false` | 混在 `content` 中，用 `<think>` / `</think>` 或 `<thought>` / `</thought>` 标签包裹 |

---

## 🏗️ 技术架构

| 层 | 技术 |
|:---:|:---|
| 🖥️ 前端 | 原生 HTML / CSS / JS，移动端优先 |
| ⚙️ 后端 | FastAPI + OpenAI SDK（兼容任意 OpenAI 格式 API） |
| 🤖 LLM | 多模型热切换，按优先级自动降级 |
| 📦 配置 | YAML 提示词 + JSON 模型配置，支持热更新 |

---

## 📁 项目结构

```
TalkWise/
├── app/
│   ├── main.py              # 🚀 FastAPI 应用入口 & 配置热更新
│   ├── config.py            # ⚙️ LLM 配置加载 & 热更新
│   ├── models.py            # 📋 请求/响应模型
│   ├── routers/
│   │   └── api.py           # 🌐 API 路由
│   └── services/
│       ├── llm_client.py    # 🤖 LLM 客户端（流式 + 降级）
│       └── prompt_builder.py # 🎭 提示词构建器
├── prompts/
│   ├── translate.yaml       # 🎨 翻译风格提示词（8 种风格）
│   └── decode.yaml          # 🔍 潜台词解读提示词
├── static/
│   ├── index.html           # 🖥️ 主页面
│   ├── logo.svg             # 🍄 Logo（对话气泡蘑菇）
│   ├── css/style.css        # 💅 样式
│   └── js/app.js            # ⚡ 交互逻辑（金句/示例/翻译/弹窗）
├── llm_config.example.json  # 📝 配置示例
├── llm_config.json          # 🔑 LLM 配置（不提交）
├── talkwise.py              # 🏁 启动脚本
└── requirements.txt         # 📦 依赖
```

---

## 📄 API 文档

启动服务后访问 http://localhost:8000/docs 查看完整 API 文档 📖

---

## 🤝 参与贡献

PR 和 Issue 都欢迎！ 🙌

1. 🍴 Fork 本仓库
2. 🌿 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 💾 提交修改 (`git commit -m 'Add some amazing feature'`)
4. 📤 推送分支 (`git push origin feature/amazing-feature`)
5. 🔀 发起 Pull Request

---

## 📜 License

[MIT](LICENSE) © TalkWise

---

<div align="center">

**如果这个项目帮到了你，给个 ⭐ Star 呗！**

*职场不易，话霉陪你 🍄*

</div>
