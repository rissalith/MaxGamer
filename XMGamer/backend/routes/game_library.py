"""
游戏库管理 API
处理游戏上传、解析、管理等操作
"""

from flask import Blueprint, request, jsonify, g, current_app
from datetime import datetime
import sys
import os
import json
import zipfile
import shutil
import uuid
import re

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, Game, User
from utils.jwt_helper import verify_access_token

# 创建蓝图
game_library_bp = Blueprint('game_library', __name__, url_prefix='/api/game-library')

# 配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
GAMES_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'frontend', 'games')
TEMP_FOLDER = os.path.join(UPLOAD_FOLDER, 'temp')
ALLOWED_EXTENSIONS = {'zip'}

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GAMES_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)


def require_admin(f):
    """管理员权限装饰器"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': '未授权'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_access_token(token)
        if not payload:
            return jsonify({'success': False, 'error': '令牌无效'}), 401
        
        # 检查管理员权限
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == payload['user_id']).first()
            if not user or user.role != 'admin':
                return jsonify({'success': False, 'error': '需要管理员权限'}), 403
            
            g.current_user_id = payload['user_id']
            g.current_user = user
            return f(*args, **kwargs)
        finally:
            db.close()
    
    return decorated_function


def require_creator_or_admin(f):
    """创作者或管理员权限装饰器 - 创作者只能管理自己的游戏，管理员可以管理所有游戏"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': '未授权'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_access_token(token)
        if not payload:
            return jsonify({'success': False, 'error': '令牌无效'}), 401
        
        # 检查用户权限
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == payload['user_id']).first()
            if not user or user.role not in ['admin', 'creator']:
                return jsonify({'success': False, 'error': '需要创作者或管理员权限'}), 403
            
            g.current_user_id = payload['user_id']
            g.current_user = user
            g.is_admin = user.role == 'admin'
            g.is_creator = user.role == 'creator'
            return f(*args, **kwargs)
        finally:
            db.close()
    
    return decorated_function


def allowed_file(filename):
    """检查文件扩展名"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_manifest(manifest):
    """验证 manifest.json 格式"""
    required_fields = ['id', 'version', 'name', 'actions']
    errors = []
    
    for field in required_fields:
        if field not in manifest:
            errors.append(f"缺少必填字段: {field}")
    
    # 验证 id 格式 (包名格式)
    if 'id' in manifest:
        if not re.match(r'^[a-z][a-z0-9\-\.]+$', manifest['id']):
            errors.append("id 格式无效，应为小写字母开头的包名格式 (如: com.example.game)")
    
    # 验证 actions 格式
    if 'actions' in manifest:
        if not isinstance(manifest['actions'], list):
            errors.append("actions 必须是数组")
        else:
            for i, action in enumerate(manifest['actions']):
                if 'code' not in action:
                    errors.append(f"actions[{i}] 缺少 code 字段")
                if 'label' not in action:
                    errors.append(f"actions[{i}] 缺少 label 字段")
    
    return errors


def clean_extracted_files(extract_path):
    """清理解压后的垃圾文件"""
    # 删除 macOS 元数据
    macosx_path = os.path.join(extract_path, '__MACOSX')
    if os.path.exists(macosx_path):
        shutil.rmtree(macosx_path)
    
    # 删除 .DS_Store 文件
    for root, dirs, files in os.walk(extract_path):
        for file in files:
            if file == '.DS_Store':
                os.remove(os.path.join(root, file))


@game_library_bp.route('/upload', methods=['POST'])
@require_creator_or_admin
def upload_game():
    """
    上传游戏 ZIP 包
    
    POST /api/game-library/upload
    Content-Type: multipart/form-data
    - file: ZIP 文件
    
    返回解析结果，不直接入库
    """
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': '未找到文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': '未选择文件'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': '只支持 ZIP 文件'}), 400
        
        # 生成临时ID
        temp_id = str(uuid.uuid4())[:8]
        temp_path = os.path.join(TEMP_FOLDER, temp_id)
        os.makedirs(temp_path, exist_ok=True)
        
        # 保存 ZIP 文件
        zip_path = os.path.join(temp_path, 'game.zip')
        file.save(zip_path)
        
        # 解压文件
        extract_path = os.path.join(temp_path, 'extracted')
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
        except zipfile.BadZipFile:
            shutil.rmtree(temp_path)
            return jsonify({'success': False, 'error': 'ZIP 文件损坏'}), 400
        
        # 清理垃圾文件
        clean_extracted_files(extract_path)
        
        # 查找 manifest.json (可能在子目录中)
        manifest_path = None
        game_root = extract_path
        
        # 直接在根目录查找
        if os.path.exists(os.path.join(extract_path, 'manifest.json')):
            manifest_path = os.path.join(extract_path, 'manifest.json')
        else:
            # 在第一层子目录查找
            for item in os.listdir(extract_path):
                item_path = os.path.join(extract_path, item)
                if os.path.isdir(item_path):
                    manifest_check = os.path.join(item_path, 'manifest.json')
                    if os.path.exists(manifest_check):
                        manifest_path = manifest_check
                        game_root = item_path
                        break
        
        if not manifest_path:
            shutil.rmtree(temp_path)
            return jsonify({
                'success': False, 
                'error': '未找到 manifest.json 文件',
                'hint': '请确保 ZIP 包根目录或第一层子目录包含 manifest.json'
            }), 400
        
        # 读取并验证 manifest
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
        except json.JSONDecodeError as e:
            shutil.rmtree(temp_path)
            return jsonify({
                'success': False, 
                'error': f'manifest.json 格式错误: {str(e)}'
            }), 400
        
        # 验证 manifest
        validation_errors = validate_manifest(manifest)
        if validation_errors:
            shutil.rmtree(temp_path)
            return jsonify({
                'success': False, 
                'error': 'manifest.json 验证失败',
                'validation_errors': validation_errors
            }), 400
        
        # 检查入口文件
        index_path = os.path.join(game_root, 'index.html')
        if not os.path.exists(index_path):
            shutil.rmtree(temp_path)
            return jsonify({
                'success': False, 
                'error': '未找到 index.html 入口文件'
            }), 400
        
        # 提取资源信息
        icon_url = None
        cover_url = None
        
        # 查找图标
        icon_candidates = ['icon.png', 'icon.jpg', 'assets/icon.png', 'assets/icon.jpg']
        for icon_file in icon_candidates:
            icon_check = os.path.join(game_root, icon_file)
            if os.path.exists(icon_check):
                icon_url = icon_file
                break
        
        # 查找封面
        cover_candidates = ['cover.png', 'cover.jpg', 'assets/cover.png', 'assets/cover.jpg']
        for cover_file in cover_candidates:
            cover_check = os.path.join(game_root, cover_file)
            if os.path.exists(cover_check):
                cover_url = cover_file
                break
        
        # 检查是否已存在该游戏
        db = get_db_session()
        try:
            existing_game = db.query(Game).filter(Game.id == manifest['id']).first()
            is_update = existing_game is not None
        finally:
            db.close()
        
        # 返回解析结果
        result = {
            'success': True,
            'temp_id': temp_id,
            'is_update': is_update,
            'manifest': manifest,
            'parsed': {
                'id': manifest['id'],
                'version': manifest.get('version', '1.0.0'),
                'name': manifest.get('name', ''),
                'engine': manifest.get('engine', 'HTML5'),
                'tech_specs': manifest.get('tech_specs', {
                    'width': 1920,
                    'height': 1080,
                    'transparent': False
                }),
                'actions': manifest.get('actions', []),
                'actions_count': len(manifest.get('actions', [])),
                'icon_found': icon_url is not None,
                'icon_path': icon_url,
                'cover_found': cover_url is not None,
                'cover_path': cover_url,
            }
        }
        
        if is_update:
            result['existing'] = {
                'name_display': existing_game.name_display,
                'price': existing_game.price,
                'status': existing_game.status,
                'version': existing_game.version
            }
        
        return jsonify(result)
        
    except Exception as e:
        print(f'上传游戏错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@game_library_bp.route('/publish', methods=['POST'])
@require_creator_or_admin
def publish_game():
    """
    确认发布游戏
    
    POST /api/game-library/publish
    Body: {
        temp_id: "abc123",
        name_display: "自定义名称",
        price: 500,
        duration_days: 30,
        tags: ["互动", "抽奖"],
        status: "published"  // 或 "draft"
    }
    """
    try:
        data = request.get_json()
        temp_id = data.get('temp_id')
        
        if not temp_id:
            return jsonify({'success': False, 'error': '缺少 temp_id'}), 400
        
        # 验证临时文件夹存在
        temp_path = os.path.join(TEMP_FOLDER, temp_id)
        if not os.path.exists(temp_path):
            return jsonify({'success': False, 'error': '上传会话已过期，请重新上传'}), 400
        
        # 读取 manifest
        extract_path = os.path.join(temp_path, 'extracted')
        manifest_path = None
        game_root = extract_path
        
        if os.path.exists(os.path.join(extract_path, 'manifest.json')):
            manifest_path = os.path.join(extract_path, 'manifest.json')
        else:
            for item in os.listdir(extract_path):
                item_path = os.path.join(extract_path, item)
                if os.path.isdir(item_path):
                    manifest_check = os.path.join(item_path, 'manifest.json')
                    if os.path.exists(manifest_check):
                        manifest_path = manifest_check
                        game_root = item_path
                        break
        
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        game_id = manifest['id']
        version = manifest.get('version', '1.0.0')
        
        # 目标目录
        target_dir = os.path.join(GAMES_FOLDER, game_id)
        
        # 如果目录存在，先备份
        if os.path.exists(target_dir):
            backup_dir = os.path.join(GAMES_FOLDER, f'{game_id}_backup_{int(datetime.now().timestamp())}')
            shutil.move(target_dir, backup_dir)
        
        # 复制游戏文件到目标目录
        shutil.copytree(game_root, target_dir)
        
        # 生成资源 URL
        base_url = f'/games/{game_id}'
        index_url = f'{base_url}/index.html'
        
        # 查找图标和封面
        icon_url = None
        cover_url = None
        icon_candidates = ['icon.png', 'icon.jpg', 'assets/icon.png', 'assets/icon.jpg']
        for icon_file in icon_candidates:
            if os.path.exists(os.path.join(target_dir, icon_file)):
                icon_url = f'{base_url}/{icon_file}'
                break
        
        cover_candidates = ['cover.png', 'cover.jpg', 'assets/cover.png', 'assets/cover.jpg']
        for cover_file in cover_candidates:
            if os.path.exists(os.path.join(target_dir, cover_file)):
                cover_url = f'{base_url}/{cover_file}'
                break
        
        # 入库
        db = get_db_session()
        try:
            existing_game = db.query(Game).filter(Game.id == game_id).first()
            
            if existing_game:
                # 检查权限：创作者只能更新自己的游戏
                if g.is_creator and existing_game.creator_id != g.current_user_id:
                    return jsonify({'success': False, 'error': '您没有权限更新此游戏'}), 403
                
                # 更新模式 - 保留运营数据
                existing_game.version = version
                existing_game.engine = manifest.get('engine', 'HTML5')
                existing_game.name = manifest.get('name', existing_game.name)
                existing_game.index_url = index_url
                existing_game.icon_url = icon_url or existing_game.icon_url
                existing_game.cover_url = cover_url or existing_game.cover_url
                existing_game.actions_schema = json.dumps(manifest.get('actions', []))
                existing_game.tech_config = json.dumps(manifest.get('tech_specs', {}))
                
                # 如果提供了新的运营数据，更新
                if data.get('name_display'):
                    existing_game.name_display = data['name_display']
                if data.get('price') is not None:
                    existing_game.price = data['price']
                if data.get('duration_days') is not None:
                    existing_game.duration_days = data['duration_days']
                if data.get('tags'):
                    existing_game.tags = json.dumps(data['tags'])
                if data.get('status'):
                    existing_game.status = data['status']
                
                existing_game.updated_at = datetime.utcnow()
                game = existing_game
                is_new = False
            else:
                # 新增模式 - 设置创作者ID
                game = Game(
                    id=game_id,
                    version=version,
                    engine=manifest.get('engine', 'HTML5'),
                    creator_id=g.current_user_id,  # 关联当前用户为创作者
                    name=manifest.get('name', game_id),
                    name_display=data.get('name_display', manifest.get('name', game_id)),
                    description=manifest.get('description', ''),
                    price=data.get('price', 0),
                    duration_days=data.get('duration_days', 30),
                    status=data.get('status', 'draft'),
                    tags=json.dumps(data.get('tags', [])),
                    index_url=index_url,
                    icon_url=icon_url,
                    cover_url=cover_url,
                    actions_schema=json.dumps(manifest.get('actions', [])),
                    tech_config=json.dumps(manifest.get('tech_specs', {}))
                )
                db.add(game)
                is_new = True
            
            db.commit()
            
            result_game = game.to_dict()
        finally:
            db.close()
        
        # 清理临时文件
        try:
            shutil.rmtree(temp_path)
        except:
            pass
        
        return jsonify({
            'success': True,
            'message': '游戏上架成功' if is_new else '游戏更新成功',
            'is_new': is_new,
            'game': result_game
        })
        
    except Exception as e:
        print(f'发布游戏错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@game_library_bp.route('/list', methods=['GET'])
@require_creator_or_admin
def list_games():
    """获取游戏列表 (管理端) - 创作者只能看到自己的游戏，管理员看到所有游戏"""
    try:
        status = request.args.get('status')  # 可选过滤
        
        db = get_db_session()
        try:
            query = db.query(Game)
            
            # 创作者只能看到自己创建的游戏
            if g.is_creator:
                query = query.filter(Game.creator_id == g.current_user_id)
            
            if status:
                query = query.filter(Game.status == status)
            
            games = query.order_by(Game.sort_order, Game.created_at.desc()).all()
            
            return jsonify({
                'success': True,
                'games': [game.to_dict() for game in games],
                'total': len(games)
            })
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取游戏列表错误: {e}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_library_bp.route('/<game_id>', methods=['GET'])
@require_creator_or_admin
def get_game(game_id):
    """获取游戏详情 (管理端) - 创作者只能查看自己的游戏"""
    try:
        db = get_db_session()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            
            if not game:
                return jsonify({'success': False, 'error': '游戏不存在'}), 404
            
            # 创作者只能查看自己的游戏
            if g.is_creator and game.creator_id != g.current_user_id:
                return jsonify({'success': False, 'error': '您没有权限查看此游戏'}), 403
            
            return jsonify({
                'success': True,
                'game': game.to_dict()
            })
        finally:
            db.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_library_bp.route('/<game_id>', methods=['PUT'])
@require_creator_or_admin
def update_game(game_id):
    """更新游戏运营数据 - 创作者只能更新自己的游戏"""
    try:
        data = request.get_json()
        
        db = get_db_session()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            
            if not game:
                return jsonify({'success': False, 'error': '游戏不存在'}), 404
            
            # 创作者只能更新自己的游戏
            if g.is_creator and game.creator_id != g.current_user_id:
                return jsonify({'success': False, 'error': '您没有权限更新此游戏'}), 403
            
            # 可更新的字段
            updatable_fields = ['name_display', 'description', 'price', 'duration_days', 
                               'status', 'category', 'tags', 'sort_order']
            
            for field in updatable_fields:
                if field in data:
                    if field == 'tags' and isinstance(data[field], list):
                        setattr(game, field, json.dumps(data[field]))
                    else:
                        setattr(game, field, data[field])
            
            game.updated_at = datetime.utcnow()
            db.commit()
            
            return jsonify({
                'success': True,
                'message': '更新成功',
                'game': game.to_dict()
            })
        finally:
            db.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_library_bp.route('/<game_id>', methods=['DELETE'])
@require_creator_or_admin
def delete_game(game_id):
    """删除游戏 - 创作者只能删除自己的游戏"""
    try:
        db = get_db_session()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            
            if not game:
                return jsonify({'success': False, 'error': '游戏不存在'}), 404
            
            # 创作者只能删除自己的游戏
            if g.is_creator and game.creator_id != g.current_user_id:
                return jsonify({'success': False, 'error': '您没有权限删除此游戏'}), 403
            
            # 删除游戏文件
            game_dir = os.path.join(GAMES_FOLDER, game_id)
            if os.path.exists(game_dir):
                shutil.rmtree(game_dir)
            
            # 删除数据库记录
            db.delete(game)
            db.commit()
            
            return jsonify({
                'success': True,
                'message': '删除成功'
            })
        finally:
            db.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_library_bp.route('/cancel-upload/<temp_id>', methods=['DELETE'])
@require_creator_or_admin
def cancel_upload(temp_id):
    """取消上传，清理临时文件"""
    try:
        temp_path = os.path.join(TEMP_FOLDER, temp_id)
        if os.path.exists(temp_path):
            shutil.rmtree(temp_path)
        
        return jsonify({'success': True, 'message': '已取消'})
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

