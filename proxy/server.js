const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 4000;

// OpenRouter配置
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your-key-here';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// 免费/低价模型配置（Agent专用）
const AGENT_MODELS = {
    writing: {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B',
        cost: '$0',
        for: '写作虾 - 内容创作'
    },
    reasoning: {
        id: 'deepseek/deepseek-chat:free',
        name: 'DeepSeek-Chat',
        cost: '$0.14/M',
        for: 'PM虾/算法虾 - 分析推理'
    },
    coding: {
        id: 'deepseek/deepseek-coder:free',
        name: 'DeepSeek-Coder',
        cost: '$0.14/M',
        for: '全栈虾/运维虾 - 代码开发'
    },
    general: {
        id: 'google/gemma-2-9b-it:free',
        name: 'Gemma 2 9B',
        cost: '$0',
        for: '通用任务'
    }
};

app.use(cors());
app.use(express.json());
app.use(express.static('/tmp/openmodels/frontend/public'));

// 根路由
app.get('/', (req, res) => {
    res.json({
        name: 'OpenModels Proxy',
        version: '0.1.0',
        models: Object.keys(AGENT_MODELS),
        endpoints: ['/v1/chat/completions', '/v1/models', '/v1/recommend', '/health']
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// 列出模型
app.get('/v1/models', (req, res) => {
    res.json({
        object: 'list',
        data: Object.entries(AGENT_MODELS).map(([key, config]) => ({
            id: key,
            object: 'model',
            owned_by: config.name,
            cost: config.cost,
            recommended_for: config.for,
            actual_model_id: config.id
        }))
    });
});

// 智能推荐（核心差异化功能）
app.post('/v1/recommend', (req, res) => {
    const { scenario } = req.body;
    const lowerScenario = (scenario || '').toLowerCase();
    
    let recommendation;
    
    // 关键词匹配（后续可换成ML模型）
    if (/写|文章|博客|文档|文案/.test(lowerScenario)) {
        recommendation = {
            model: 'writing',
            ...AGENT_MODELS.writing,
            reason: '写作任务轻量，免费模型足够流畅'
        };
    } else if (/代码|编程|debug|api|函数/.test(lowerScenario)) {
        recommendation = {
            model: 'coding',
            ...AGENT_MODELS.coding,
            reason: 'DeepSeek-Coder代码能力第一梯队，中文编程友好'
        };
    } else if (/分析|规划|设计|策略|研究/.test(lowerScenario)) {
        recommendation = {
            model: 'reasoning',
            ...AGENT_MODELS.reasoning,
            reason: 'DeepSeek推理能力强，适合分析决策，价格便宜'
        };
    } else {
        recommendation = {
            model: 'general',
            ...AGENT_MODELS.general,
            reason: '通用场景，免费使用'
        };
    }
    
    res.json({
        scenario: scenario,
        recommendation: recommendation,
        all_options: AGENT_MODELS
    });
});

// 聊天补全（转发到OpenRouter）
app.post('/v1/chat/completions', async (req, res) => {
    const { model: modelType, messages, temperature = 0.7, max_tokens = 2000 } = req.body;
    
    // 映射到实际模型ID
    const config = AGENT_MODELS[modelType] || AGENT_MODELS.general;
    const actualModel = config.id;
    
    try {
        const response = await axios.post(
            `${OPENROUTER_BASE}/chat/completions`,
            {
                model: actualModel,
                messages,
                temperature,
                max_tokens,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://openmodels.ai',
                    'X-Title': 'OpenModels'
                },
                timeout: 60000
            }
        );
        
        // 添加OMX元数据
        const result = response.data;
        result.omx_metadata = {
            model_type: modelType,
            actual_model: actualModel,
            cost_tier: config.cost,
            recommended_for: config.for
        };
        
        res.json(result);
        
    } catch (error) {
        console.error('API调用失败:', error.message);
        
        // 降级到免费通用模型
        if (modelType !== 'general') {
            try {
                const fallback = await axios.post(
                    `${OPENROUTER_BASE}/chat/completions`,
                    {
                        model: AGENT_MODELS.general.id,
                        messages,
                        temperature,
                        max_tokens
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000
                    }
                );
                
                const result = fallback.data;
                result.omx_metadata = {
                    model_type: 'general (fallback)',
                    actual_model: AGENT_MODELS.general.id,
                    fallback: true
                };
                
                res.json(result);
                return;
            } catch (fallbackError) {
                console.error('降级也失败:', fallbackError.message);
            }
        }
        
        res.status(500).json({
            error: error.message,
            message: '模型调用失败，请检查API密钥或稍后重试'
        });
    }
});

// SPA fallback
app.use((req, res) => {
    res.sendFile('/tmp/openmodels/frontend/public/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 OpenModels Proxy 启动');
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/v1/chat/completions`);
    console.log('');
    console.log('Agent模型配置：');
    Object.entries(AGENT_MODELS).forEach(([key, config]) => {
        console.log(`  ${key}: ${config.name} (${config.cost}) - ${config.for}`);
    });
});
