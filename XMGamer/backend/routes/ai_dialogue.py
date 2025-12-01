"""
AI对话API路由
用于登录页的AI对话功能
支持RAG（检索增强生成）
"""

from flask import Blueprint, request, jsonify
import os
import requests
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

# 加载.env文件
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# 导入RAG服务（FAISS版本）
try:
    from services.rag_service_faiss import rag_service
    RAG_ENABLED = True
    print("[OK] RAG服务（FAISS版本）已加载")
except ImportError as e:
    RAG_ENABLED = False
    print(f"[WARNING] RAG服务导入失败，将使用传统方式: {e}")

ai_dialogue_bp = Blueprint('ai_dialogue', __name__)

# 从环境变量获取配置
VECTORAPI_KEY = os.getenv('VECTORAPI_KEY')
VECTORAPI_BASE_URL = os.getenv('VECTORAPI_BASE_URL', 'https://api.vectorengine.ai/v1')
VECTORAPI_MODEL = os.getenv('VECTORAPI_MODEL', 'gemini-2.0-flash-exp')


def load_character_knowledge(character_name='max', scenario='full'):
    """
    从知识库加载角色知识
    
    Args:
        character_name: 角色名称，默认为'max'
        scenario: 加载场景，可选值：
                 - 'full': 加载所有知识文件（默认）
                 - 'intro': 加载基础+平台介绍
                 - 'interaction': 加载基础+互动指南
        
    Returns:
        str: 角色知识库内容
    """
    try:
        knowledge_dir = Path(__file__).parent.parent / 'knowledge_base' / character_name
        
        # 基础知识文件（总是加载）
        base_files = [
            'character.md',              # 总览
            'character_personality.md'   # 个性
        ]
        
        # 场景特定知识文件
        scenario_files = {
            'intro': ['platform_knowledge.md', 'worldview.md'],
            'interaction': ['login_guide.md'],
            'story': ['story_world.md'],  # 故事模式
            'full': ['platform_knowledge.md', 'worldview.md', 'login_guide.md', 'story_world.md']
        }
        
        # 确定要加载的文件列表
        files_to_load = base_files + scenario_files.get(scenario, scenario_files['full'])
        
        # 加载所有知识文件
        knowledge_parts = []
        for filename in files_to_load:
            file_path = knowledge_dir / filename
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    knowledge_parts.append(f.read())
        
        if knowledge_parts:
            return '\n\n---\n\n'.join(knowledge_parts)
        else:
            raise FileNotFoundError("未找到任何知识库文件")
            
    except FileNotFoundError:
        # 如果找不到知识库文件，返回默认提示词
        return """你是MaxGamer平台的AI助手Max，一个友好、热情、专业的虚拟助理。
请用简短、有趣的方式与用户互动。"""
    except Exception as e:
        print(f"加载知识库失败: {e}")
        return """你是MaxGamer平台的AI助手Max，一个友好、热情、专业的虚拟助理。
请用简短、有趣的方式与用户互动。"""


# 加载Max角色的完整知识库作为系统提示词（传统方式的备用）
SYSTEM_PROMPT = load_character_knowledge('max', 'full')

# 检查RAG服务状态
if RAG_ENABLED:
    rag_stats = rag_service.get_stats()
    if rag_stats['available']:
        print(f"[OK] RAG服务已启用，知识库包含 {rag_stats['total_chunks']} 个块")
    else:
        print(f"[WARNING] RAG服务不可用: {rag_stats.get('reason', 'Unknown')}")
        RAG_ENABLED = False


def clean_response(text):
    """
    清理AI回复中的格式标签
    移除"思考："、"回复："等标签，只保留实际内容
    """
    import re
    
    # 移除常见的格式标签
    patterns = [
        r'【?思考[：:】].*?(?=【?回复|$)',  # 移除"思考："部分
        r'【?回复[：:】]\s*',                # 移除"回复："标签
        r'思考[：:]\s*.*?(?=回复[：:]|$)',   # 移除"思考:"部分
        r'回复[：:]\s*',                     # 移除"回复:"标签
        r'^\s*[-→>]\s*',                    # 移除开头的箭头
    ]
    
    cleaned = text
    for pattern in patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.DOTALL)
    
    # 清理多余的空白和换行
    cleaned = re.sub(r'\n+', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = cleaned.strip()
    
    return cleaned


@lru_cache(maxsize=100)
def get_cached_response(interaction_type, message_hash):
    """缓存AI响应以提高性能"""
    return None


@ai_dialogue_bp.route('/chat', methods=['POST'])
def chat():
    """
    AI对话接口
    
    请求体:
    {
        "interaction_type": "like|gift|comment|intro",
        "message": "用户消息（可选）",
        "context": {
            "platform": "XMGamer",
            "page": "login",
            "count": 当前交互次数（可选）
        }
    }
    
    响应:
    {
        "success": true,
        "message": "AI回复内容",
        "type": "interaction_type"
    }
    """
    try:
        # 检查API密钥
        if not VECTORAPI_KEY:
            return jsonify({
                'success': False,
                'error': 'API密钥未配置'
            }), 500
        
        # 获取请求数据
        data = request.get_json()
        interaction_type = data.get('interaction_type', 'intro')
        user_message = data.get('message', '')
        context = data.get('context', {})
        interaction_count = context.get('count', 1)  # 获取交互次数
        
        # 根据交互类型和次数构建更丰富的提示词
        import random
        
        # 为每种交互类型准备多样化的场景描述
        like_scenarios = [
            f"这是用户第{interaction_count}次给你点赞！",
            f"用户连续{interaction_count}次点赞了！",
            "用户刚刚给你点了个赞！",
            "收到一个新的赞！",
            "又有人给你点赞啦！"
        ]
        
        gift_scenarios = [
            f"这是用户送的第{interaction_count}个礼物！",
            f"用户已经送了{interaction_count}个礼物了！",
            "用户刚刚送了你一个礼物！",
            "收到新礼物啦！",
            "又有礼物送来了！"
        ]
        
        comment_scenarios = [
            f"这是第{interaction_count}次有人想评论互动！",
            f"已经有{interaction_count}个人想和你互动了！",
            "有人想要评论互动！",
            "新的互动请求！",
            "又有人想聊天了！"
        ]
        
        # 随机选择场景描述
        scenario_map = {
            'like': random.choice(like_scenarios),
            'gift': random.choice(gift_scenarios),
            'comment': random.choice(comment_scenarios)
        }
        
        # 构建更自由的提示词
        prompts = {
            'like': f'''{scenario_map.get('like', '用户给你点了赞！')}
作为一个22岁的探险者Max，用你自己的方式回应这个赞！
- 可以用游戏术语（buff、能量、战斗力、经验值、升级等）
- 可以表达兴奋、感谢、或者开玩笑
- 保持简短（1-2句话）
- 每次回复都要有新意，不要重复！
【重要】直接给出你的回复，不要包含任何标签！''',
            
            'gift': f'''{scenario_map.get('gift', '用户送了你礼物！')}
作为一个22岁的探险者Max，用你自己的方式回应这个礼物！
- 可以用游戏术语（掉装备、稀有道具、神装、宝箱、战利品等）
- 可以表达惊喜、感激、或者幽默
- 保持简短（1-2句话）
- 每次回复都要有新意，不要重复！
【重要】直接给出你的回复，不要包含任何标签！''',
            
            'comment': f'''{scenario_map.get('comment', '用户想要评论互动！')}
作为一个22岁的探险者Max，用你自己的方式邀请对方互动！
- 可以用游戏术语（组队、开黑、探索、副本、任务等）
- 可以表达热情、友好、或者调皮
- 保持简短（1-2句话）
- 每次回复都要有新意，不要重复！
【重要】直接给出你的回复，不要包含任何标签！''',
            
            'intro': '''简短介绍MaxGamer平台。
作为一个22岁的探险者Max，用你自己的方式介绍这个平台！
- 可以用游戏术语（新地图、刷副本、开怪、探险等）
- 保持简短有趣（1-2句话）
- 每次介绍的角度都可以不同！
【重要】直接给出你的回复，不要包含任何标签！'''
        }
        
        prompt = prompts.get(interaction_type, prompts['intro'])
        if user_message:
            prompt = f"{prompt}\n\n用户补充说：{user_message}"
        
        # 使用RAG构建上下文（如果可用）
        if RAG_ENABLED and rag_service.rag_available:
            # 构建查询
            query = f"{interaction_type}: {user_message}" if user_message else interaction_type
            system_prompt = rag_service.build_context(query, interaction_type)
        else:
            # 使用传统方式
            system_prompt = SYSTEM_PROMPT
        
        # 调用Vector Engine API
        headers = {
            'Authorization': f'Bearer {VECTORAPI_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': VECTORAPI_MODEL,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.9,  # 提高温度以增加多样性
            'max_tokens': 100,
            'top_p': 0.95  # 添加top_p采样以增加创造性
        }
        
        # 发送请求
        response = requests.post(
            f'{VECTORAPI_BASE_URL}/chat/completions',
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_message = result['choices'][0]['message']['content'].strip()
            
            # 清理可能出现的格式标签
            ai_message = clean_response(ai_message)
            
            return jsonify({
                'success': True,
                'message': ai_message,
                'type': interaction_type
            })
        else:
            return jsonify({
                'success': False,
                'error': f'API调用失败: {response.status_code}',
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'API请求超时'
        }), 504
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'网络请求失败: {str(e)}'
        }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'服务器错误: {str(e)}'
        }), 500


@ai_dialogue_bp.route('/health', methods=['GET'])
def health():
    """健康检查接口"""
    return jsonify({
        'success': True,
        'service': 'AI Dialogue',
        'status': 'running',
        'api_configured': bool(VECTORAPI_KEY)
    })