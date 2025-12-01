"""
RAG检索服务
提供知识库检索和上下文构建功能
"""

from pathlib import Path
from functools import lru_cache
import hashlib

try:
    from sentence_transformers import SentenceTransformer
    import chromadb
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("警告: RAG依赖未安装，将使用传统方式加载知识库")
    print("安装方法: pip install chromadb sentence-transformers")


class RAGService:
    """RAG检索服务"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """单例模式"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """初始化RAG服务"""
        if self._initialized:
            return
        
        self.rag_available = RAG_AVAILABLE
        
        if not RAG_AVAILABLE:
            self._initialized = True
            return
        
        try:
            # 初始化向量模型
            print("初始化RAG服务...")
            self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            
            # 初始化ChromaDB
            backend_dir = Path(__file__).parent.parent
            db_path = backend_dir / 'chroma_db'
            
            self.client = chromadb.PersistentClient(path=str(db_path))
            
            # 获取集合
            try:
                self.collection = self.client.get_collection(name="max_knowledge")
                print(f"✓ RAG服务初始化完成，知识库包含 {self.collection.count()} 个块")
            except Exception as e:
                print(f"警告: 知识库未初始化 - {e}")
                print("请运行: python scripts/init_rag.py")
                self.collection = None
                self.rag_available = False
            
            self._initialized = True
            
        except Exception as e:
            print(f"RAG服务初始化失败: {e}")
            self.rag_available = False
            self._initialized = True
    
    @lru_cache(maxsize=100)
    def retrieve(self, query, top_k=3):
        """
        检索相关知识
        
        Args:
            query: 查询文本
            top_k: 返回数量
            
        Returns:
            相关知识列表
        """
        if not self.rag_available or self.collection is None:
            return []
        
        try:
            # 向量化查询
            query_embedding = self.model.encode(query)
            
            # 检索
            results = self.collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=top_k
            )
            
            # 格式化结果
            knowledge_chunks = []
            for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
                knowledge_chunks.append({
                    'content': doc,
                    'file': metadata.get('file', ''),
                    'section': metadata.get('section', ''),
                    'priority': metadata.get('priority', 3),
                    'tags': metadata.get('tags', '').split(',')
                })
            
            return knowledge_chunks
            
        except Exception as e:
            print(f"检索失败: {e}")
            return []
    
    def hybrid_retrieve(self, query, interaction_type, top_k=3):
        """
        混合检索：结合向量检索和规则过滤
        
        Args:
            query: 查询文本
            interaction_type: 交互类型（intro/like/gift/comment）
            top_k: 返回数量
            
        Returns:
            相关知识列表
        """
        if not self.rag_available or self.collection is None:
            return []
        
        try:
            # 1. 向量检索（多检索一些，用于后续过滤）
            query_embedding = self.model.encode(query)
            
            results = self.collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=top_k * 3  # 检索3倍数量用于过滤
            )
            
            # 2. 规则过滤
            filtered_results = []
            
            for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
                tags = metadata.get('tags', '').split(',')
                file_name = metadata.get('file', '')
                
                # 根据交互类型过滤
                should_include = False
                
                if interaction_type == 'intro':
                    # 介绍场景：优先平台知识和世界观
                    if any(tag in tags for tag in ['平台', 'MaxGamer', 'SaaS', '世界观']):
                        should_include = True
                    elif 'platform_knowledge' in file_name or 'worldview' in file_name:
                        should_include = True
                
                elif interaction_type in ['like', 'gift', 'comment']:
                    # 互动场景：优先互动指南和性格设定
                    if any(tag in tags for tag in ['互动', '场景', '回复', '性格']):
                        should_include = True
                    elif 'login_guide' in file_name or 'character_personality' in file_name:
                        should_include = True
                
                # 故事元素（可选）
                if any(tag in tags for tag in ['故事', '情绪熵', '观察者']):
                    # 降低优先级，但仍然包含
                    metadata['priority'] = int(metadata.get('priority', 3)) + 1
                    should_include = True
                
                if should_include:
                    filtered_results.append({
                        'content': doc,
                        'file': metadata.get('file', ''),
                        'section': metadata.get('section', ''),
                        'priority': int(metadata.get('priority', 3)),
                        'tags': tags
                    })
            
            # 3. 重排序（按优先级）
            filtered_results.sort(key=lambda x: x['priority'])
            
            # 4. 返回top_k个结果
            return filtered_results[:top_k]
            
        except Exception as e:
            print(f"混合检索失败: {e}")
            return []
    
    def build_context(self, query, interaction_type):
        """
        构建LLM上下文
        
        Args:
            query: 查询文本
            interaction_type: 交互类型
            
        Returns:
            system_prompt: 系统提示词
        """
        # 1. 基础角色设定（总是包含）
        base_prompt = self._load_base_prompt()
        
        # 2. 检索相关知识
        if self.rag_available and self.collection is not None:
            relevant_knowledge = self.hybrid_retrieve(query, interaction_type, top_k=3)
            
            if relevant_knowledge:
                # 构建知识上下文
                context_parts = []
                for chunk in relevant_knowledge:
                    context_parts.append(f"## {chunk['section']}\n\n{chunk['content']}")
                
                context = "\n\n---\n\n".join(context_parts)
                
                system_prompt = f"""{base_prompt}

## 相关知识参考

{context}

请根据以上角色设定和相关知识，以Max的身份回复用户。保持简短（1-2句话），使用适当的emoji。
"""
            else:
                system_prompt = base_prompt
        else:
            # RAG不可用，使用传统方式
            system_prompt = self._load_full_knowledge()
        
        return system_prompt
    
    def _load_base_prompt(self):
        """加载基础角色设定"""
        try:
            backend_dir = Path(__file__).parent.parent
            character_file = backend_dir / 'knowledge_base' / 'max' / 'character.md'
            
            with open(character_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # 只取前面的快速参考部分
                lines = content.split('\n')
                base_lines = []
                for line in lines:
                    base_lines.append(line)
                    if '## 💬 快速回复模板' in line:
                        # 读取到快速回复模板后再读50行
                        base_lines.extend(lines[len(base_lines):len(base_lines)+50])
                        break
                
                return '\n'.join(base_lines)
        except Exception as e:
            print(f"加载基础提示词失败: {e}")
            return "你是Max，MaxGamer平台的AI助手。"
    
    def _load_full_knowledge(self):
        """加载完整知识库（传统方式）"""
        try:
            backend_dir = Path(__file__).parent.parent
            knowledge_dir = backend_dir / 'knowledge_base' / 'max'
            
            files = [
                'character.md',
                'character_personality.md',
                'platform_knowledge.md',
                'login_guide.md'
            ]
            
            knowledge_parts = []
            for file_name in files:
                file_path = knowledge_dir / file_name
                if file_path.exists():
                    with open(file_path, 'r', encoding='utf-8') as f:
                        knowledge_parts.append(f.read())
            
            return '\n\n---\n\n'.join(knowledge_parts)
            
        except Exception as e:
            print(f"加载完整知识库失败: {e}")
            return "你是Max，MaxGamer平台的AI助手。"
    
    def get_stats(self):
        """获取RAG服务统计信息"""
        if not self.rag_available or self.collection is None:
            return {
                'available': False,
                'reason': 'RAG服务未初始化或依赖未安装'
            }
        
        try:
            count = self.collection.count()
            return {
                'available': True,
                'total_chunks': count,
                'cache_size': self.retrieve.cache_info().currsize,
                'cache_hits': self.retrieve.cache_info().hits,
                'cache_misses': self.retrieve.cache_info().misses
            }
        except Exception as e:
            return {
                'available': False,
                'error': str(e)
            }


# 创建全局实例
rag_service = RAGService()