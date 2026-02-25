#!/usr/bin/env python3
"""
OpenModels Proxy - 简化版模型网关
基于LiteLLM理念，但超轻量实现
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
from functools import lru_cache

app = Flask(__name__)
CORS(app)

# OpenRouter API配置（免费模型）
OPENROUTER_API_KEY = "sk-or-v1-your-key-here"  # 需要用户自己配置
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

# 免费/低价模型配置
FREE_MODELS = {
    # 写作虾用 - 轻量级
    "writing": {
        "id": "meta-llama/llama-3.1-8b-instruct:free",
        "name": "Llama 3.1 8B",
        "cost": "$0",
        "for": "写作虾"
    },
    # PM虾/算法虾用 - 推理强
    "reasoning": {
        "id": "deepseek/deepseek-chat:free",
        "name": "DeepSeek-Chat",
        "cost": "$0.14/M",
        "for": "PM虾/算法虾"
    },
    # 全栈虾/运维虾用 - 代码专用
    "coding": {
        "id": "deepseek/deepseek-coder:free", 
        "name": "DeepSeek-Coder",
        "cost": "$0.14/M",
        "for": "全栈虾/运维虾"
    },
    # 通用备用
    "general": {
        "id": "google/gemma-2-9b-it:free",
        "name": "Gemma 2 9B",
        "cost": "$0",
        "for": "通用任务"
    }
}

@app.route('/')
def index():
    return jsonify({
        "name": "OpenModels Proxy",
        "version": "0.1.0",
        "models": list(FREE_MODELS.keys()),
        "endpoints": ["/v1/chat/completions", "/v1/models", "/health"]
    })

@app.route('/health')
def health():
    return jsonify({"status": "ok", "timestamp": time.time()})

@app.route('/v1/models')
def list_models():
    """列出可用模型"""
    return jsonify({
        "object": "list",
        "data": [
            {
                "id": key,
                "object": "model",
                "owned_by": config["name"],
                "cost": config["cost"],
                "recommended_for": config["for"]
            }
            for key, config in FREE_MODELS.items()
        ]
    })

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """统一的聊天补全接口"""
    data = request.json
    
    # 获取用户选择的模型类型
    model_type = data.get('model', 'general')
    
    # 映射到实际模型ID
    if model_type in FREE_MODELS:
        actual_model = FREE_MODELS[model_type]["id"]
    else:
        actual_model = model_type  # 直接使用OpenRouter模型ID
    
    # 转发到OpenRouter
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://openmodels.ai",
            "X-Title": "OpenModels"
        }
        
        payload = {
            "model": actual_model,
            "messages": data.get('messages', []),
            "temperature": data.get('temperature', 0.7),
            "max_tokens": data.get('max_tokens', 2000),
            "stream": False
        }
        
        response = requests.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            # 添加我们的元数据
            result['omx_metadata'] = {
                'model_type': model_type,
                'actual_model': actual_model,
                'cost_tier': FREE_MODELS.get(model_type, {}).get('cost', 'unknown')
            }
            return jsonify(result)
        else:
            # 降级到免费备用模型
            fallback_model = FREE_MODELS['general']['id']
            payload['model'] = fallback_model
            response = requests.post(
                f"{OPENROUTER_BASE}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            result = response.json()
            result['omx_metadata'] = {
                'model_type': 'general (fallback)',
                'actual_model': fallback_model,
                'fallback': True
            }
            return jsonify(result)
            
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "模型调用失败，请检查API密钥或稍后重试"
        }), 500

# 模型推荐API（我们的差异化功能）
@app.route('/v1/recommend', methods=['POST'])
def recommend_model():
    """根据场景推荐模型 - 这就是我们的差异化！"""
    data = request.json
    scenario = data.get('scenario', '').lower()
    
    # 简单的关键词匹配（后续可换成ML模型）
    if any(word in scenario for word in ['写', '文章', '博客', '文档']):
        recommendation = {
            "model": "writing",
            "name": "Llama 3.1 8B",
            "reason": "写作任务轻量，免费模型足够",
            "cost": "$0"
        }
    elif any(word in scenario for word in ['代码', '编程', 'debug', 'api']):
        recommendation = {
            "model": "coding", 
            "name": "DeepSeek-Coder",
            "reason": "代码专用模型，中文+代码双强，性价比最高",
            "cost": "$0.14/M"
        }
    elif any(word in scenario for word in ['分析', '规划', '设计', '策略']):
        recommendation = {
            "model": "reasoning",
            "name": "DeepSeek-Chat",
            "reason": "推理能力强，适合分析决策，价格便宜",
            "cost": "$0.14/M"
        }
    else:
        recommendation = {
            "model": "general",
            "name": "Gemma 2 9B",
            "reason": "通用场景，免费使用",
            "cost": "$0"
        }
    
    return jsonify({
        "scenario": scenario,
        "recommendation": recommendation,
        "all_options": FREE_MODELS
    })

if __name__ == '__main__':
    print("🚀 OpenModels Proxy 启动")
    print("📍 http://localhost:4000")
    print("📍 API: http://localhost:4000/v1/chat/completions")
    app.run(host='0.0.0.0', port=4000, debug=False)
