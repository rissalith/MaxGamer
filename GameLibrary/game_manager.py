"""
游戏管理器 - 后端
负责游戏的注册、加载和API路由管理
支持按平台分类的目录结构
"""

import os
import sys
import json
import importlib.util
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from flask import Blueprint, jsonify, request


class GameManager:
    """游戏管理器 - 支持平台分类"""

    def __init__(self, game_library_path: str = 'GameLibrary'):
        self.game_library_path = Path(game_library_path)
        self.registry_path = self.game_library_path / 'game-registry.json'
        self.registry: Dict = {}
        self.platforms: Dict = {}  # 平台信息
        self.games: Dict = {}  # 游戏配置 {game_id: config}
        self.platform_games: Dict = {}  # 按平台分类的游戏 {platform: {game_id: config}}
        self.game_blueprints: Dict = {}

    def init(self, app=None):
        """初始化游戏管理器"""
        try:
            # 确保目录存在
            self.game_library_path.mkdir(parents=True, exist_ok=True)

            # 加载游戏注册表
            self.load_registry()

            # 扫描并加载所有游戏（按平台）
            self.scan_games_by_platform()

            # 如果提供了app，注册游戏的后端API
            if app:
                self.register_game_apis(app)

            total_games = sum(len(games) for games in self.platform_games.values())
            print(f'[GameManager] 初始化成功，已加载 {total_games} 个游戏')
            return True
        except Exception as e:
            print(f'[GameManager] 初始化失败: {e}')
            return False

    def load_registry(self):
        """加载游戏注册表"""
        try:
            if self.registry_path.exists():
                with open(self.registry_path, 'r', encoding='utf-8') as f:
                    self.registry = json.load(f)
                    # 加载平台信息
                    self.platforms = self.registry.get('platforms', {})
            else:
                # 创建默认注册表
                self.registry = {
                    'version': '2.0.0',
                    'lastUpdated': datetime.utcnow().isoformat() + 'Z',
                    'platforms': {},
                    'games': []
                }
                self.save_registry()

            print(f'[GameManager] 游戏注册表加载成功')
        except Exception as e:
            print(f'[GameManager] 加载游戏注册表失败: {e}')
            self.registry = {'version': '2.0.0', 'platforms': {}, 'games': []}

    def save_registry(self):
        """保存游戏注册表"""
        try:
            self.registry['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
            with open(self.registry_path, 'w', encoding='utf-8') as f:
                json.dump(self.registry, f, indent=2, ensure_ascii=False)
            print(f'[GameManager] 游戏注册表保存成功')
        except Exception as e:
            print(f'[GameManager] 保存游戏注册表失败: {e}')

    def scan_games_by_platform(self):
        """按平台扫描游戏目录"""
        # 已知的平台目录名
        known_platforms = {'douyin', 'tiktok', 'twitch'}

        # 遍历 GameLibrary 根目录下的平台目录
        for platform_dir in self.game_library_path.iterdir():
            if platform_dir.is_dir() and platform_dir.name in known_platforms:
                platform_id = platform_dir.name
                self.platform_games[platform_id] = {}

                # 遍历该平台下的游戏
                for game_dir in platform_dir.iterdir():
                    if game_dir.is_dir():
                        game_config_path = game_dir / 'game.json'
                        if game_config_path.exists():
                            try:
                                game_config = self.load_game_config_from_path(game_config_path)
                                if game_config:
                                    game_id = game_config.get('id', game_dir.name)
                                    # 添加平台信息
                                    game_config['platform'] = platform_id
                                    game_config['_path'] = str(game_dir)

                                    # 存储到平台游戏列表
                                    self.platform_games[platform_id][game_id] = game_config

                                    # 同时存储到全局游戏列表（使用平台前缀）
                                    full_game_id = f"{platform_id}/{game_id}"
                                    self.games[full_game_id] = game_config

                                    # 尝试加载游戏后端模块
                                    self.load_game_backend_from_path(game_dir, full_game_id, game_config)

                                    print(f'[GameManager] 发现游戏: {game_config.get("name", game_id)} ({platform_id}/{game_id})')
                            except Exception as e:
                                print(f'[GameManager] 加载游戏失败 {platform_id}/{game_dir.name}: {e}')

    def load_game_config_from_path(self, config_path: Path) -> Optional[Dict]:
        """从路径加载游戏配置"""
        try:
            if not config_path.exists():
                return None

            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            return config
        except Exception as e:
            print(f'[GameManager] 加载游戏配置失败 {config_path}: {e}')
            return None

    def load_game_config(self, game_id: str) -> Optional[Dict]:
        """加载游戏配置（兼容旧接口）"""
        # 尝试从全局游戏列表获取
        if game_id in self.games:
            return self.games[game_id]

        # 尝试在各平台中查找
        for platform_id, games in self.platform_games.items():
            if game_id in games:
                return games[game_id]

        return None

    def load_game_backend_from_path(self, game_dir: Path, game_id: str, game_config: Dict):
        """从路径加载游戏后端模块"""
        try:
            backend_path = game_dir / 'backend'
            if not backend_path.exists():
                return

            # 检查是否有api.py文件
            api_file = backend_path / 'api.py'
            if not api_file.exists():
                return

            # 动态导入游戏后端模块
            module_name = f'game_{game_id.replace("/", "_")}_backend'
            spec = importlib.util.spec_from_file_location(module_name, api_file)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                sys.modules[spec.name] = module
                spec.loader.exec_module(module)

                # 获取蓝图
                if hasattr(module, 'get_blueprint'):
                    blueprint = module.get_blueprint()
                    self.game_blueprints[game_id] = blueprint
                    print(f'[GameManager] 加载游戏后端: {game_id}')
                elif hasattr(module, 'fortune_bp'):
                    # 兼容旧的命名方式
                    self.game_blueprints[game_id] = module.fortune_bp
                    print(f'[GameManager] 加载游戏后端: {game_id}')
        except Exception as e:
            print(f'[GameManager] 加载游戏后端失败 {game_id}: {e}')

    def load_game_backend(self, game_id: str, game_config: Dict):
        """加载游戏后端模块（兼容旧接口）"""
        if '_path' in game_config:
            self.load_game_backend_from_path(Path(game_config['_path']), game_id, game_config)

    def register_game_apis(self, app):
        """注册所有游戏的API到Flask应用"""
        for game_id, blueprint in self.game_blueprints.items():
            try:
                # 跳过旧版 fortune-game 的蓝图注册（不带平台后缀），因为 MaxGamer app.py 已经提供了 /api/fortune/* 路由
                # 但要注册带平台后缀的版本 (fortune-game-douyin, fortune-game-tiktok, fortune-game-twitch)
                if game_id == 'fortune-game':
                    print(f'[GameManager] 跳过游戏API注册（由MaxGamer提供）: {game_id}')
                    continue

                app.register_blueprint(blueprint)
                print(f'[GameManager] 注册游戏API: {game_id}')
            except Exception as e:
                print(f'[GameManager] 注册游戏API失败 {game_id}: {e}')

    def get_platforms(self) -> Dict:
        """获取所有平台信息"""
        return self.platforms

    def get_games_by_platform(self, platform_id: str) -> List[Dict]:
        """获取指定平台的所有游戏"""
        games = self.platform_games.get(platform_id, {})
        result = []

        # 从注册表获取游戏的额外信息
        registry_games = {g['id']: g for g in self.registry.get('games', [])}

        for game_id, game_config in games.items():
            # 合并注册表信息
            registry_info = registry_games.get(game_id, {})
            platform_info = registry_info.get('platforms', {}).get(platform_id, {})

            game_data = {
                **game_config,
                'enabled': platform_info.get('enabled', True),
                'status': platform_info.get('status', 'published')
            }
            result.append(game_data)

        return result

    def get_all_games(self) -> List[Dict]:
        """获取所有游戏"""
        result = []
        for platform_id, games in self.platform_games.items():
            for game_id, game_config in games.items():
                result.append({
                    **game_config,
                    'platform': platform_id,
                    'fullId': f'{platform_id}/{game_id}'
                })
        return result

    def get_game(self, game_id: str, platform_id: str = None) -> Optional[Dict]:
        """获取指定游戏"""
        if platform_id:
            games = self.platform_games.get(platform_id, {})
            return games.get(game_id)

        # 如果没有指定平台，在所有平台中查找
        for p_id, games in self.platform_games.items():
            if game_id in games:
                return games[game_id]

        return None

    def create_api_blueprint(self) -> Blueprint:
        """创建游戏管理API蓝图"""
        bp = Blueprint('game_manager', __name__, url_prefix='/api/games')

        @bp.route('/platforms', methods=['GET'])
        def get_platforms():
            """获取所有平台列表"""
            try:
                return jsonify({
                    'success': True,
                    'platforms': self.platforms,
                    'count': len(self.platforms)
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': str(e)
                }), 500

        @bp.route('/platforms/<platform_id>/games', methods=['GET'])
        def get_platform_games(platform_id):
            """获取指定平台的游戏列表"""
            try:
                games = self.get_games_by_platform(platform_id)
                return jsonify({
                    'success': True,
                    'platform': platform_id,
                    'games': games,
                    'count': len(games)
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': str(e)
                }), 500

        @bp.route('', methods=['GET'])
        def get_games():
            """获取所有游戏列表"""
            try:
                platform_id = request.args.get('platform')
                if platform_id:
                    games = self.get_games_by_platform(platform_id)
                else:
                    games = self.get_all_games()
                return jsonify({
                    'success': True,
                    'games': games,
                    'count': len(games)
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': str(e)
                }), 500

        @bp.route('/<platform_id>/<game_id>', methods=['GET'])
        def get_game(platform_id, game_id):
            """获取指定游戏信息"""
            try:
                game = self.get_game(game_id, platform_id)
                if game:
                    return jsonify({
                        'success': True,
                        'game': game
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': '游戏不存在或已禁用'
                    }), 404
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': str(e)
                }), 500

        return bp


# 创建全局游戏管理器实例 - 使用此文件所在目录作为 GameLibrary 路径
game_manager = GameManager(str(Path(__file__).parent))
