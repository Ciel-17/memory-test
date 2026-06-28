# memory-test

基于 [LangChain.js](https://js.langchain.com/) 的 AI Agent **对话记忆（Memory）** 策略演示项目。涵盖基础历史存储、截断、总结与向量检索四种常见方案，帮助理解长对话场景下的上下文管理。

## 功能概览

| 策略 | 说明 | 文件 |
|------|------|------|
| 内存历史 | 使用 `InMemoryChatMessageHistory` 在进程内保存对话 | `src/test/history-test.mjs` |
| 文件持久化 | 使用 `FileSystemChatMessageHistory` 将对话写入 JSON 文件 | `src/test/history-long-term-test.mjs` |
| 截断（Truncation） | 按消息数量或 Token 数量裁剪历史 | `src/memory/truncation-memory.mjs` |
| 总结（Summarization） | 超出阈值后调用 LLM 压缩旧消息，保留最近内容 | `src/memory/summarization-memory.mjs` |
| 总结（Token 版） | 基于 Token 阈值触发总结 | `src/memory/summarization-memory2.mjs` |
| 检索（Retrieval） | 使用 Milvus 向量库做语义检索，实现 RAG 流程 | `src/memory/retrieval-memory.mjs` |

## 项目结构

```
memory-test/
├── src/
│   ├── test/                          # 基础历史存储演示
│   │   ├── history-test.mjs           # 内存历史
│   │   ├── history-long-term-test.mjs # 文件持久化（新建会话）
│   │   └── history-long-term-test2.mjs# 从文件恢复会话并继续对话
│   └── memory/                        # 记忆策略演示
│       ├── truncation-memory.mjs      # 截断策略
│       ├── summarization-memory.mjs   # 总结策略（按消息数）
│       ├── summarization-memory2.mjs  # 总结策略（按 Token 数）
│       ├── insert-conversations.mjs   # 初始化 Milvus 并插入示例数据
│       └── retrieval-memory.mjs       # 向量检索 + RAG
├── package.json
└── .env                               # 环境变量（需自行创建）
```

## 环境要求

- Node.js >= 18
- [pnpm](https://pnpm.io/)（推荐）或 npm
- 兼容 OpenAI API 的 LLM 服务（如 OpenAI、通义千问等）
- 运行检索策略时需本地或远程 [Milvus](https://milvus.io/) 实例

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# OpenAI 兼容 API（截断 / 总结 / 检索策略）
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4o-mini
EMBEDDINGS_MODEL_NAME=text-embedding-3-small

# 通义千问（基础历史演示）
QIANWEN_API_KEY=your_qianwen_api_key
QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QIANWEN_MODEL_NAME=qwen-plus

# Milvus（检索策略）
MILVUS_ADDRESS=localhost:19530
```

### 3. 运行示例

**基础历史存储（需配置通义千问）：**

```bash
node src/test/history-test.mjs
node src/test/history-long-term-test.mjs
node src/test/history-long-term-test2.mjs   # 需先运行 long-term-test
```

**截断策略（无需 LLM，纯本地逻辑）：**

```bash
node src/memory/truncation-memory.mjs
```

**总结策略（需配置 OpenAI 兼容 API）：**

```bash
node src/memory/summarization-memory.mjs    # 按消息数量触发
node src/memory/summarization-memory2.mjs   # 按 Token 数量触发
```

**检索策略（需 Milvus + Embedding 模型）：**

```bash
# 1. 启动 Milvus 后，初始化集合并插入示例数据
node src/memory/insert-conversations.mjs

# 2. 运行 RAG 检索演示
node src/memory/retrieval-memory.mjs
```

## 策略详解

### 截断（Truncation）

当上下文窗口有限时，直接丢弃最早的消息：

- **按消息数量**：保留最近 N 条消息（`slice(-maxMessage)`）
- **按 Token 数量**：使用 `js-tiktoken` 计数，配合 LangChain 的 `trimMessages` API 保留最近内容

适合对历史精度要求不高、只需维持短期上下文的场景。

### 总结（Summarization）

当历史超过阈值时，将旧消息交给 LLM 生成摘要，仅保留最近若干条完整消息：

- `summarization-memory.mjs`：消息数 ≥ 6 时触发，保留最近 2 条
- `summarization-memory2.mjs`：Token 数 ≥ 200 时触发，保留最近约 80 Token 的消息

适合需要保留长期语义、又不想无限增长上下文的场景。

### 检索（Retrieval）

将每轮对话向量化后存入 Milvus，新问题时按语义相似度检索相关历史，再注入 Prompt 生成回答（RAG 流程）：

1. 向量检索相关历史对话
2. 将检索结果与用户问题组合为 Prompt
3. 调用 LLM 生成回复
4. 将本轮对话写入向量库

适合历史对话量大、需按语义召回特定信息的长期记忆场景。

## 依赖说明

| 包 | 用途 |
|----|------|
| `langchain` / `@langchain/core` | 消息类型、历史存储、trimMessages |
| `@langchain/openai` | ChatOpenAI、OpenAIEmbeddings |
| `@langchain/community` | FileSystemChatMessageHistory |
| `@zilliz/milvus2-sdk-node` | Milvus 向量数据库客户端 |
| `js-tiktoken` | Token 计数 |
| `dotenv` | 环境变量加载 |

## 注意事项

- `.env` 文件已被 `.gitignore` 忽略，请勿将 API Key 提交到版本库
- 文件历史演示会将对话保存至 `src/test/history/chat_history.json`，该目录同样被忽略
- 运行 `insert-conversations.mjs` 前请确保 Milvus 中不存在同名 `conversations` 集合，否则可能报错
- 检索策略的向量维度固定为 **1024**，需与 Embedding 模型的 `dimensions` 参数一致

## License

ISC
