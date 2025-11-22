import os
import re
import math
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests

# 导入图像处理模块
IMAGE_PROCESSING_AVAILABLE = False
ImageProcessor = None  # type: ignore

try:
    from image_processor import ImageProcessor  # type: ignore
    IMAGE_PROCESSING_AVAILABLE = True
except ImportError as e:
    print(f'警告: 图像处理模块不可用: {e}')
    print('请安装依赖: pip install Pillow numpy opencv-python')

# 加载环境变量
load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# 配置
PORT = int(os.getenv('PORT', 3000))
AI_IMAGE_API_KEY = os.getenv('AI_IMAGE_API_KEY')
PROXY_URL = os.getenv('PROXY_URL') or os.getenv('HTTP_PROXY') or os.getenv('HTTPS_PROXY')

# API 配置
API_BASE = 'https://api.vectorengine.ai'
DALLE_API_URL = f'{API_BASE}/v1/images/generations'
GEMINI_IMAGE_GEN_URL = f'{API_BASE}/v1beta/models/gemini-2.5-flash-image:generateContent'
GEMINI_IMAGE_EDIT_URL = f'{API_BASE}/v1beta/models/gemini-2.5-flash-image-preview:generateContent'
GEMINI_3_PRO_IMAGE_URL = f'{API_BASE}/v1beta/models/gemini-3-pro-image-preview:generateContent'

# 配置请求会话
session = requests.Session()
if PROXY_URL:
    session.proxies = {
        'http': PROXY_URL,
        'https': PROXY_URL
    }


def load_prompt_template(template_name: str = 'default') -> Optional[str]:
    """加载 prompt 模板文件"""
    try:
        prompts_dir = Path(__file__).parent.parent / 'prompts'
        template_path = prompts_dir / f'{template_name}.md'
        
        if not template_path.exists():
            print(f'模板文件不存在: {template_path}，使用默认模板')
            return None
        
        content = template_path.read_text(encoding='utf-8')
        
        # 解析 YAML 前置元数据
        yaml_match = re.match(r'^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$', content)
        
        if not yaml_match:
            print(f'模板格式错误: {template_path}')
            return None
        
        yaml_content = yaml_match.group(1)
        template_content = yaml_match.group(2).strip()
        
        # 简单解析 YAML（只提取 enabled 字段）
        enabled_match = re.search(r'enabled:\s*(true|false)', yaml_content)
        name_match = re.search(r'name:\s*(.+)', yaml_content)
        
        enabled = enabled_match.group(1) == 'true' if enabled_match else True
        name = name_match.group(1).strip() if name_match else template_name
        
        if not enabled:
            print(f'模板已禁用: {template_path}')
            return None
        
        print(f'✓ 加载模板: {name} ({template_name}.md)')
        return template_content
        
    except Exception as e:
        print(f'读取模板文件失败: {str(e)}')
        return None


def get_default_prompt_template() -> str:
    """获取默认 prompt 模板"""
    return '{prompt}'


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'message': 'FrameWorker 后端服务运行正常',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/info', methods=['GET'])
def api_info():
    """API 信息"""
    return jsonify({
        'name': 'FrameWorker API',
        'version': '1.0.0',
        'description': '图片切割和动画生成工具',
        'features': [
            '图片切割',
            '背景去除',
            'GIF 动画生成',
            'WebP 帧导出',
            'AI 图像生成'
        ],
        'endpoints': {
            'health': '/api/health',
            'info': '/api/info',
            'aiImageKey': '/api/ai-image-key'
        }
    })


@app.route('/api/ai-image-key', methods=['GET'])
def get_ai_image_key():
    """获取 AI 图像生成密钥"""
    if not AI_IMAGE_API_KEY:
        return jsonify({
            'error': 'API 密钥未配置',
            'message': '请在 .env 文件中配置 AI_IMAGE_API_KEY'
        }), 500
    
    return jsonify({
        'apiKey': AI_IMAGE_API_KEY,
        'configured': True
    })


@app.route('/api/generate-sprite-animation', methods=['POST'])
def generate_sprite_animation():
    """AI 生成精灵图动画"""
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        frame_count = data.get('frameCount', 16)
        model = data.get('model', 'gemini-2.5-image')
        tolerance = data.get('tolerance', 50)  # 背景移除容差
        loop_consistency = data.get('loopConsistency', True)  # 首尾帧一致性
        
        if not prompt:
            return jsonify({
                'error': '缺少必要参数',
                'message': '请提供 prompt 参数'
            }), 400
        
        if not AI_IMAGE_API_KEY:
            return jsonify({
                'error': 'API 密钥未配置',
                'message': '请在 .env 文件中配置 AI_IMAGE_API_KEY'
            }), 500
        
        if not IMAGE_PROCESSING_AVAILABLE:
            return jsonify({
                'error': '图像处理功能不可用',
                'message': '请安装依赖: pip install Pillow numpy opencv-python'
            }), 500
        
        # 计算精灵图的行列数
        cols = math.ceil(math.sqrt(frame_count))
        rows = math.ceil(frame_count / cols)
        
        # 加载 prompt 模板
        template_name = os.getenv('PROMPT_TEMPLATE_NAME', 'default')
        prompt_template = load_prompt_template(template_name)
        
        if not prompt_template:
            prompt_template = get_default_prompt_template()
            print('使用内置默认模板')
        
        # 替换占位符
        loop_consistency_text = ''
        if loop_consistency:
            loop_consistency_text = '''- **关键要求：首尾帧必须完全一致**
  * 第一帧（左上角第一个格子）和最后一帧（右下角最后一个格子）必须是完全相同的画面
  * 这两帧应该展示动作循环的起始/结束状态
  * 确保动画可以无缝循环播放'''
        
        enhanced_prompt = prompt_template\
            .replace('{rows}', str(rows))\
            .replace('{cols}', str(cols))\
            .replace('{frameCount}', str(frame_count))\
            .replace('{prompt}', prompt)\
            .replace('{loopConsistency}', loop_consistency_text)
        
        # 配置请求头
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {AI_IMAGE_API_KEY}'
        }
        
        image_url = None
        
        if model == 'dalle':
            # 使用 DALL-E 3
            response = session.post(
                DALLE_API_URL,
                json={
                    'model': 'dall-e-3',
                    'prompt': enhanced_prompt,
                    'n': 1,
                    'size': '1024x1024',
                    'quality': 'standard',
                    'response_format': 'url'
                },
                headers=headers,
                timeout=120
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('data') and len(result['data']) > 0:
                image_url = result['data'][0]['url']
            else:
                raise Exception('DALL-E API 返回数据格式错误')
                
        elif model == 'gemini-2.5-image-preview':
            # 使用 Gemini 2.5 Flash Image Preview
            response = session.post(
                GEMINI_IMAGE_EDIT_URL,
                json={
                    'contents': [{
                        'parts': [{
                            'text': enhanced_prompt
                        }]
                    }],
                    'generationConfig': {
                        'responseModalities': ['IMAGE']
                    }
                },
                headers=headers,
                timeout=120
            )
            response.raise_for_status()
            
        elif model == 'gemini-3-pro-image-preview':
            # 使用 Gemini 3 Pro Image Preview
            response = session.post(
                GEMINI_3_PRO_IMAGE_URL,
                json={
                    'contents': [{
                        'parts': [{
                            'text': enhanced_prompt
                        }]
                    }],
                    'generationConfig': {
                        'responseModalities': ['IMAGE']
                    }
                },
                headers=headers,
                timeout=120
            )
            response.raise_for_status()
            
        else:
            # 使用 Gemini 2.5 Flash Image（默认）
            response = session.post(
                GEMINI_IMAGE_GEN_URL,
                json={
                    'contents': [{
                        'parts': [{
                            'text': enhanced_prompt
                        }]
                    }],
                    'generationConfig': {
                        'responseModalities': ['IMAGE']
                    }
                },
                headers=headers,
                timeout=120
            )
            response.raise_for_status()
        
        # 解析 Gemini API 响应
        if model != 'dalle':
            result = response.json()
            if (result.get('candidates') and 
                len(result['candidates']) > 0 and
                result['candidates'][0].get('content') and
                result['candidates'][0]['content'].get('parts') and
                len(result['candidates'][0]['content']['parts']) > 0):
                
                part = result['candidates'][0]['content']['parts'][0]
                
                if part.get('inlineData') and part['inlineData'].get('data'):
                    base64_data = part['inlineData']['data']
                    mime_type = part['inlineData'].get('mimeType', 'image/png')
                    image_url = f'data:{mime_type};base64,{base64_data}'
                elif part.get('inline_data') and part['inline_data'].get('data'):
                    base64_data = part['inline_data']['data']
                    mime_type = part['inline_data'].get('mime_type', 'image/png')
                    image_url = f'data:{mime_type};base64,{base64_data}'
                else:
                    raise Exception('Gemini API 返回的图片数据格式错误：缺少 inlineData')
            else:
                raise Exception('Gemini API 返回数据格式错误：响应结构不完整')
        
        if not image_url:
            raise Exception('未能生成图片URL')
        
        # 打印实际发送的prompt到控制台
        print('\n' + '='*80)
        print('📝 实际发送给AI的Prompt:')
        print('-'*80)
        print(enhanced_prompt)
        print('='*80 + '\n')
        
        # 立即进行背景移除处理
        print('🔄 正在进行背景移除处理...')
        processed_frames = ImageProcessor.process_sprite_sheet(  # type: ignore
            base64_image=image_url,
            rows=rows,
            cols=cols,
            tolerance=tolerance,
            mode='green'
        )
        print(f'✅ 背景移除完成，处理了 {len(processed_frames)} 帧')
        
        # 重新组合处理后的帧为精灵图
        import numpy as np
        from PIL import Image
        import io
        import base64
        
        # 解码第一帧获取尺寸
        first_frame_data = processed_frames[0].split(',')[1]
        first_frame_bytes = base64.b64decode(first_frame_data)
        first_frame_img = Image.open(io.BytesIO(first_frame_bytes))
        frame_width, frame_height = first_frame_img.size
        
        # 创建新的精灵图画布（RGBA模式支持透明）
        sprite_width = frame_width * cols
        sprite_height = frame_height * rows
        sprite_sheet = Image.new('RGBA', (sprite_width, sprite_height), (0, 0, 0, 0))
        
        # 将所有帧拼接到精灵图上
        for idx, frame_base64 in enumerate(processed_frames):
            frame_data = frame_base64.split(',')[1]
            frame_bytes = base64.b64decode(frame_data)
            frame_img = Image.open(io.BytesIO(frame_bytes))
            
            row = idx // cols
            col = idx % cols
            x = col * frame_width
            y = row * frame_height
            
            sprite_sheet.paste(frame_img, (x, y), frame_img)
        
        # 将精灵图转换为base64
        buffer = io.BytesIO()
        sprite_sheet.save(buffer, format='PNG')
        buffer.seek(0)
        sprite_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        processed_sprite_url = f'data:image/png;base64,{sprite_base64}'
        
        # 调试：确认返回的数据
        print(f'✅ 准备返回数据:')
        print(f'   - imageUrl: {processed_sprite_url[:50]}...')
        print(f'   - rawImageUrl: {image_url[:50]}...')
        print(f'   - frames数量: {len(processed_frames)}')
        print(f'   - rows: {rows}, cols: {cols}')
        
        return jsonify({
            'success': True,
            'imageUrl': processed_sprite_url,  # 返回去背景后的精灵图
            'rawImageUrl': image_url,  # 保留原始未处理的图片URL
            'frames': processed_frames,  # 返回所有去背景后的帧
            'rows': rows,
            'cols': cols,
            'frameCount': frame_count,
            'prompt': prompt,
            'enhancedPrompt': enhanced_prompt,
            'model': model,
            'message': '精灵图生成并背景移除成功！'
        })
        
    except requests.exceptions.RequestException as e:
        error_message = 'AI 图像生成失败'
        error_details = str(e)
        
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                error_details = error_data.get('error', {}).get('message', e.response.text)
            except:
                error_details = e.response.text or str(e)
        
        return jsonify({
            'error': error_message,
            'message': error_details,
            'details': None,
            'statusCode': e.response.status_code if hasattr(e, 'response') and e.response else None
        }), 500
        
    except Exception as e:
        return jsonify({
            'error': 'AI 图像生成失败',
            'message': str(e),
            'details': None,
            'statusCode': None
        }), 500


@app.route('/api/process-image', methods=['POST'])
def process_image():
    """
    处理图像：切割并去除背景
    """
    if not IMAGE_PROCESSING_AVAILABLE:
        return jsonify({
            'error': '图像处理功能不可用',
            'message': '请安装依赖: pip install Pillow numpy opencv-python'
        }), 500
    
    try:
        data = request.get_json()
        
        # 获取参数
        base64_image = data.get('image')
        rows = data.get('rows', 1)
        cols = data.get('cols', 1)
        tolerance = data.get('tolerance', 50)
        mode = data.get('mode', 'green')  # 'green' 或 'auto'
        
        if not base64_image:
            return jsonify({
                'error': '缺少必要参数',
                'message': '请提供 image 参数'
            }), 400
        
        if rows < 1 or cols < 1:
            return jsonify({
                'error': '参数错误',
                'message': '行数和列数必须大于 0'
            }), 400
        
        # 处理图像
        processed_frames = ImageProcessor.process_sprite_sheet(  # type: ignore
            base64_image=base64_image,
            rows=rows,
            cols=cols,
            tolerance=tolerance,
            mode=mode
        )
        
        return jsonify({
            'success': True,
            'frames': processed_frames,
            'count': len(processed_frames),
            'rows': rows,
            'cols': cols,
            'message': f'成功处理 {len(processed_frames)} 帧图像'
        })
        
    except Exception as e:
        return jsonify({
            'error': '图像处理失败',
            'message': str(e)
        }), 500


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """服务前端静态文件"""
    static_folder = app.static_folder or '../frontend'
    if path and Path(static_folder, path).exists():
        return send_from_directory(static_folder, path)
    return send_from_directory(static_folder, 'index.html')


@app.errorhandler(500)
def internal_error(error):
    """错误处理"""
    return jsonify({
        'error': '服务器内部错误',
        'message': str(error)
    }), 500


if __name__ == '__main__':
    import sys
    import io
    
    # 设置标准输出为UTF-8编码（Windows兼容性）
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print(f'✓ FrameWorker Python 后端启动在端口 {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)