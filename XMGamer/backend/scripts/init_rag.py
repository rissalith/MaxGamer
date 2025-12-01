"""
RAG知识库初始化脚本
用于将Markdown知识文件向量化并存储到ChromaDB
"""

import os
import sys
from pathlib import Path
import re

# 添加父目录到路径
sys.path.append(str(Path(__file__).parent.parent))

try:
    from sentence_transformers import SentenceTransformer
    import chromadb
except ImportError:
    print("错误：缺少必要的依赖包")
    print("请运行: pip install chromadb sentence-transformers")
    sys.exit(1)


class KnowledgeBaseIndexer:
    """知识库索引器"""
    
    def __init__(self, knowledge_dir, db_path="./chroma_db"):
        """
        初始化索引器
        
        Args:
            knowledge_dir: 知识库目录路径
            db_path: ChromaDB数据库路径
        """
        self.knowledge_dir = Path(knowledge_dir)
        self.db_path = db_path
        
        # 初始化向量模型
        print("加载向量模型...")
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print("✓ 模型加载完成")
        
        # 初始化ChromaDB
        print("初始化ChromaDB...")
        self.client = chromadb.PersistentClient(path=db_path)
        
        # 创建或获取集合
        self.collection = self.client.get_or_create_collection(
            name="max_knowledge",
            metadata={"description": "Max角色知识库"}
        )
        print("✓ ChromaDB初始化完成")
    
    def chunk_markdown(self, content, file_name):
        """
        将Markdown内容分块
        
        Args:
            content: Markdown文本内容
            file_name: 文件名
            
        Returns:
            chunks: 分块列表
        """
        chunks = []
        lines = content.split('\n')
        
        current_chunk = ""
        current_title = ""
        current_level = 0
        
        for line in lines:
            # 检测标题
            if line.startswith('#'):
                # 保存上一个块
                if current_chunk.strip():
                    chunks.append({
                        'title': current_title,
                        'content': current_chunk.strip(),
                        'level': current_level,
                        'file': file_name
                    })
                
                # 开始新块
                level = len(line) - len(line.lstrip('#'))
                current_level = level
                current_title = line.strip('#').strip()
                current_chunk = line + '\n'
            else:
                current_chunk += line + '\n'
        
        # 保存最后一个块
        if current_chunk.strip():
            chunks.append({
                'title': current_title,
                'content': current_chunk.strip(),
                'level': current_level,
                'file': file_name
            })
        
        return chunks
    
    def extract_tags(self, content, file_name):
        """
        从内容中提取标签
        
        Args:
            content: 文本内容
            file_name: 文件名
            
        Returns:
            tags: 标签列表
        """
        tags = []
        
        # 根据文件名添加标签
        file_tags = {
            'platform_knowledge': ['平台', 'MaxGamer', 'SaaS', 'B2B2C'],
            'worldview': ['世界观', '价值观', '商业模式'],
            'character_personality': ['性格', '语言风格', '行为准则'],
            'login_guide': ['登录', '互动', '场景', '回复'],
            'story_world': ['故事', 'Max\'s Lost World', '情绪熵', '观察者']
        }
        
        for key, tag_list in file_tags.items():
            if key in file_name:
                tags.extend(tag_list)
        
        # 从内容中提取关键词
        keywords = ['AI', 'MaxGamer', '直播', '互动', '主播', '观众', 
                   '情绪熵', 'EMask', 'Lili', '欢愉世界', '失落世界']
        
        for keyword in keywords:
            if keyword in content:
                tags.append(keyword)
        
        return list(set(tags))  # 去重
    
    def determine_priority(self, chunk):
        """
        确定块的优先级
        
        Args:
            chunk: 文本块
            
        Returns:
            priority: 优先级（1-5，1最高）
        """
        # 根据标题级别和内容确定优先级
        if chunk['level'] == 1:
            return 1
        elif chunk['level'] == 2:
            return 2
        elif '核心' in chunk['title'] or '重要' in chunk['title']:
            return 2
        elif '示例' in chunk['title'] or '参考' in chunk['title']:
            return 4
        else:
            return 3
    
    def index_file(self, file_path):
        """
        索引单个文件
        
        Args:
            file_path: 文件路径
        """
        file_name = file_path.stem
        print(f"\n处理文件: {file_name}.md")
        
        # 读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 分块
        chunks = self.chunk_markdown(content, file_name)
        print(f"  分块数量: {len(chunks)}")
        
        # 处理每个块
        for i, chunk in enumerate(chunks):
            # 提取标签
            tags = self.extract_tags(chunk['content'], file_name)
            
            # 确定优先级
            priority = self.determine_priority(chunk)
            
            # 生成向量
            embedding = self.model.encode(chunk['content'])
            
            # 构建元数据
            metadata = {
                'character': 'max',
                'file': file_name,
                'section': chunk['title'],
                'level': chunk['level'],
                'priority': priority,
                'tags': ','.join(tags)  # ChromaDB不支持列表，用逗号分隔
            }
            
            # 生成唯一ID
            chunk_id = f"{file_name}_{i}_{chunk['title'][:20]}"
            
            # 存储到ChromaDB
            try:
                self.collection.add(
                    embeddings=[embedding.tolist()],
                    documents=[chunk['content']],
                    metadatas=[metadata],
                    ids=[chunk_id]
                )
            except Exception as e:
                print(f"  警告: 块 {i} 存储失败: {e}")
        
        print(f"  ✓ 完成")
    
    def index_all(self):
        """索引所有知识文件"""
        print("\n" + "="*50)
        print("开始索引知识库")
        print("="*50)
        
        # 获取max目录下的所有md文件
        max_dir = self.knowledge_dir / 'max'
        md_files = list(max_dir.glob('*.md'))
        
        print(f"\n找到 {len(md_files)} 个知识文件")
        
        # 索引每个文件
        for file_path in md_files:
            self.index_file(file_path)
        
        # 显示统计信息
        count = self.collection.count()
        print("\n" + "="*50)
        print(f"索引完成！共索引 {count} 个知识块")
        print("="*50)
    
    def test_retrieval(self, query="MaxGamer是什么？", top_k=3):
        """
        测试检索功能
        
        Args:
            query: 测试查询
            top_k: 返回数量
        """
        print("\n" + "="*50)
        print("测试检索功能")
        print("="*50)
        print(f"\n查询: {query}")
        
        # 向量化查询
        query_embedding = self.model.encode(query)
        
        # 检索
        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k
        )
        
        # 显示结果
        print(f"\n找到 {len(results['documents'][0])} 个相关结果:\n")
        
        for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
            print(f"结果 {i+1}:")
            print(f"  文件: {metadata['file']}")
            print(f"  章节: {metadata['section']}")
            print(f"  优先级: {metadata['priority']}")
            print(f"  标签: {metadata['tags']}")
            print(f"  内容预览: {doc[:100]}...")
            print()


def main():
    """主函数"""
    # 获取知识库目录
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    knowledge_dir = backend_dir / 'knowledge_base'
    db_path = backend_dir / 'chroma_db'
    
    print("\n" + "="*50)
    print("MaxGamer RAG知识库初始化")
    print("="*50)
    print(f"\n知识库目录: {knowledge_dir}")
    print(f"数据库路径: {db_path}")
    
    # 创建索引器
    indexer = KnowledgeBaseIndexer(knowledge_dir, str(db_path))
    
    # 索引所有文件
    indexer.index_all()
    
    # 测试检索
    indexer.test_retrieval("MaxGamer是什么？")
    indexer.test_retrieval("Max的性格特点")
    indexer.test_retrieval("情绪熵是什么")
    
    print("\n✓ 初始化完成！")
    print("\n提示: 数据库已保存到", db_path)
    print("可以通过 ai_dialogue.py 使用RAG检索功能")


if __name__ == '__main__':
    main()