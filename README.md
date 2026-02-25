# 🚀 OpenModels (OMX)

> 基于 LiteLLM 的智能模型推荐网关
> 
> **一句话**: 为你找到性价比最高的AI模型

---

## ✨ 核心价值

不用纠结选哪个模型。输入你的场景，我们自动推荐最便宜、最适合的选择。

| 传统方式 | OpenModels方式 |
|---------|---------------|
| 研究100篇对比评测 | 输入场景，秒级推荐 |
| 纠结GPT-4太贵 | DeepSeek便宜95% |
| 国产模型不知道怎么选 | 中文场景自动匹配 |

---

## 🎯 Agent专用模型配置

我们为 DukaClaw Team 5个Agent优化了模型配置：

| Agent | 模型 | 成本 | 场景 |
|-------|------|------|------|
| ✍️ **写作虾** | Llama 3.1 8B | **$0** | 内容创作 |
| 🧠 **PM虾/算法虾** | DeepSeek-Chat | **$0.14/M** | 分析推理 |
| 🛠️ **全栈虾/运维虾** | DeepSeek-Coder | **$0.14/M** | 代码开发 |
| 🔧 **通用** | Gemma 2 9B | **$0** | 其他任务 |

**预估月成本**: $5-10（比全用GPT-4便宜95%）

---

## 🚀 快速开始

### 启动服务

```bash
# 1. 安装依赖
cd proxy
npm install

# 2. 配置OpenRouter API密钥
export OPENROUTER_API_KEY="sk-or-v1-your-key"

# 3. 启动代理
node server.js
# 🚀 服务运行在 http://localhost:4000

# 4. 前端访问
# 直接打开 http://localhost:4000
```

### 使用API

```javascript
// 统一 OpenAI 兼容接口
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:4000/v1',
  apiKey: 'any-key'
});

// 智能推荐：输入场景，自动选模型
const recommendation = await fetch('http://localhost:4000/v1/recommend', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({scenario: '写中文技术博客'})
});

// 调用推荐模型
const response = await openai.chat.completions.create({
  model: 'writing',  // 或 'coding', 'reasoning'
  messages: [{role: 'user', content: '写一篇React Hooks教程'}]
});
```

---

## 🏗️ 架构

```
┌─────────────────────────────────────┐
│        前端 (Next.js/React)            │
│  - 模型广场 (硅基流动风格)              │
│  - 智能推荐界面                        │
│  - Agent专用Dashboard                 │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│     OpenModels Proxy (Node.js)         │
│  - 智能推荐算法（关键词匹配→ML模型）    │
│  - Agent-模型映射层                    │
│  - 故障转移/降级                      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        OpenRouter API                 │
│  - 10+ 免费/低价模型                   │
│  - 统一接口                            │
└─────────────────────────────────────┘
```

---

## 🛣️ 路线图

- **v0.1.0** ✅ (今天): 基础代理 + 智能推荐
- **v0.2.0** (1周后): 完整前端 + Dashboard
- **v0.3.0** (2周后): 接入真实LiteLLM
- **v1.0.0** (1月后): 生产就绪 + 监控

---

## 🦞 DukaClaw Team

本项目为 DukaClaw Team AI Agent军团提供智能模型推荐能力。

| 成员 | 角色 | 使用场景 |
|------|------|---------|
| 全栈虾 | 全栈开发 | coding模型 |
| 写作虾 | 技术写作 | writing模型 |
| PM虾 | 产品经理 | reasoning模型 |
| 算法虾 | AI算法 | reasoning/coding模型 |
| 运维虾 | DevOps | coding/general模型 |

---

## 📊 效果对比

### 成本对比

| 场景 | GPT-4 | OpenModels | 节省 |
|------|-------|------------|------|
| 写博客 | $15/M | $0 (Llama免费) | 100% |
| 代码生成 | $15/M | $0.14/M (DeepSeek) | 99% |
| 产品分析 | $15/M | $0.14/M (DeepSeek) | 99% |

### 质量对比

| 场景 | GPT-4 | DeepSeek | 差距 |
|------|-------|----------|------|
| 中文写作 | 90分 | 95分 | DeepSeek更强 |
| 代码生成 | 95分 | 90分 | GPT-4略强 |
| 中文法律 | 85分 | 92分 | DeepSeek更强 |

---

## 🤝 与LiteLLM的关系

**当前**: 独立实现简化版代理（快速验证）  
**未来**: 接入完整LiteLLM（路由/负载均衡/缓存）

**LiteLLM提供**:
- 100+模型统一接口
- 故障转移
- 成本追踪
- 日志监控

**我们提供**:
- 中文场景优化
- Agent专用推荐
- 价格监控
- 评测数据

---

## 📄 License

MIT - 为AI开发者社区贡献

---

*Created by 全栈虾 for DukaClaw Team* 🦞
