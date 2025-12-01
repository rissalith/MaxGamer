"""
知识库索引脚本 - FAISS版本
将Markdown知识库文件向量化并存储到FAISS索引中
"""

import sys
from pathlib import Path
import pickle
import re

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sentence_transformers import SentenceTransformer
    import faiss
    import numpy as np
except ImportError as e:
    print(f"[ERROR] 缺少依赖包: {e}")
    print("请运行: pip install -r requirements_rag.txt")
    sys.exit(1)


class KnowledgeBaseIndexer:
    """知识库索引器"""
    
    def __init__(self, knowledge_dir: Path, output_dir: Path):
        """
        初始化索引器
        
        Args:
            knowledge_dir: 知识库目录
            output_dir: 输出目录
        """
        self.knowledge_dir = knowledge_dir
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化向量模型
        print("加载向量模型: paraphrase-multilingual-MiniLM-L12-v2")
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print("[OK] 模型加载完成\n")
        
        # 存储所有文档和元数据
        self.documents = []
        self.metadata = []
    
    def chunk_markdown(self, content: str, file_name: str):
        """
        将Markdown内容按章节分块
        
        Args:
            content: Markdown内容
            file_name: 文件名
            
        Returns:
            chunks: 分块列表
        """
        chunks = []
        lines = content.split('\n')
        
        current_section = "简介"
        current_content = []
        
        for line in lines:
            # 检测二级标题
            if line.startswith('## '):
                # 保存上一个章节
                if current_content:
                    chunk_text = '\n'.join(current_content).strip()
                    if chunk_text:
                        chunks.append({
                            'section': current_section,
                            'content': chunk_text,
                            'file': file_name
                        })
                
                # 开始新章节
                current_section = line.replace('## ', '').strip()
                current_content = []
            else:
                current_content.append(line)
        
        # 保存最后一个章节
        if current_content:
            chunk_text = '\n'.join(current_content).strip()
            if chunk_text:
                chunks.append({
                    'section': current_section,
                    'content': chunk_text,
                    'file': file_name
                })
        
        return chunks
    
    def extract_tags(self, content: str):
        """
        从内容中提取标签
        
        Args:
            content: 文本内容
            
        Returns:
            tags: 标签列表
        """
        tags = []
        
        # 关键词映射
        keyword_map = {
            '平台': ['MaxGamer', '平台', '应用商店', 'SaaS'],
            'MaxGamer': ['MaxGamer'],
            'SaaS': ['SaaS', 'B2B2C', '商业模式'],
            '世界观': ['世界观', '故事', '背景'],
            '互动': ['互动', '交互', '点赞', '礼物', '评论'],
            '场景': ['场景', '情境'],
            '回复': ['回复', '对话', '台词'],
            '性格': ['性格', '特征', '风格'],
            '故事': ['故事', 'Max的失落世界'],
            '情绪熵': ['情绪熵', '观察者效应'],
            '观察者': ['观察者', '第四面墙']
        }
        
        content_lower = content.lower()
        
        for tag, keywords in keyword_map.items():
            for keyword in keywords:
                if keyword.lower() in content_lower:
                    if tag not in tags:
                        tags.append(tag)
                    break
        
        return tags
    
    def determine_priority(self, file_name: str, section: str):
        """
        确定优先级
        
        Args:
            file_name: 文件名
            section: 章节名
            
        Returns:
            priority: 优先级（1-5，1最高）
        """
        # 核心角色设定
        if 'character.md' in file_name and any(k in section for k in ['基本信息', '快速参考', '核心']):
            return 1
        
        # 重要特征
        if any(k in file_name for k in ['character_personality', 'worldview']):
            return 2
        
        # 平台知识和交互指南
        if any(k in file_name for k in ['platform_knowledge', 'login_guide']):
            return 3
        
        # 故事背景
        if 'story_world' in file_name:
            return 4
        
        # 其他
        return 5
    
    def index_file(self, file_path: Path):
        """
        索引单个文件
        
        Args:
            file_path: 文件路径
        """
        print(f"处理: {file_path.name}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 分块
            chunks = self.chunk_markdown(content, file_path.name)
            
            for chunk in chunks:
                # 提取标签
                tags = self.extract_tags(chunk['content'])
                
                # 确定优先级
                priority = self.determine_priority(chunk['file'], chunk['section'])
                
                # 添加到列表
                self.documents.append(chunk['content'])
                self.metadata.append({
                    'file': chunk['file'],
                    'section': chunk['section'],
                    'priority': priority,
                    'tags': ','.join(tags),
                    'content': chunk['content']
                })
            
            print(f"  [OK] 索引了 {len(chunks)} 个块\n")
            
        except Exception as e:
            print(f"  [ERROR] 处理失败: {e}\n")
    
    def build_index(self):
        """构建FAISS索引"""
        if not self.documents:
            print("[ERROR] 没有文档可索引")
            return False
        
        print("构建FAISS索引...")
        
        try:
            # 向量化所有文档
            print("  向量化文档...")
            embeddings = self.model.encode(self.documents, show_progress_bar=True)
            embeddings = np.array(embeddings).astype('float32')
            
            # 创建FAISS索引
            dimension = embeddings.shape[1]
            index = faiss.IndexFlatL2(dimension)  # L2距离
            index.add(embeddings)
            
            # 保存索引 - 使用pickle避免中文路径问题
            index_file = self.output_dir / 'faiss_index.pkl'
            with open(index_file, 'wb') as f:
                # 将索引序列化为字节
                index_bytes = faiss.serialize_index(index)
                pickle.dump(index_bytes, f)
            print(f"  [OK] 索引已保存: {index_file}")
            
            # 保存元数据
            metadata_file = self.output_dir / 'metadata.pkl'
            with open(metadata_file, 'wb') as f:
                pickle.dump(self.metadata, f)
            print(f"  [OK] 元数据已保存: {metadata_file}")
            
            return True
            
        except Exception as e:
            print(f"  [ERROR] 构建索引失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def index_all(self):
        """索引所有Markdown文件"""
        print("="*60)
        print("MaxGamer Knowledge Base Indexer (FAISS)")
        print("="*60)
        print()
        
        # 扫描知识库目录
        print(f"扫描知识库目录: {self.knowledge_dir}")
        md_files = list(self.knowledge_dir.glob('*.md'))
        print(f"找到 {len(md_files)} 个Markdown文件\n")
        
        if not md_files:
            print("[ERROR] 没有找到Markdown文件")
            return False
        
        # 索引每个文件
        for md_file in md_files:
            self.index_file(md_file)
        
        # 构建索引
        if not self.build_index():
            return False
        
        print()
        print("="*60)
        print("索引完成")
        print("="*60)
        print()
        print(f"总块数: {len(self.documents)}")
        print(f"向量数据库: {self.output_dir}/")
        print()
        
        # 测试检索
        self.test_retrieval()
        
        return True
    
    def test_retrieval(self):
        """测试检索功能"""
        print("测试检索...")
        
        try:
            # 加载索引
            index_file = self.output_dir / 'faiss_index.pkl'
            with open(index_file, 'rb') as f:
                index_bytes = pickle.load(f)
                index = faiss.deserialize_index(index_bytes)
            
            # 测试查询
            test_query = "介绍MaxGamer平台"
            print(f"查询: {test_query}")
            
            query_embedding = self.model.encode([test_query])
            query_embedding = np.array(query_embedding).astype('float32')
            
            distances, indices = index.search(query_embedding, 3)
            
            print(f"检索到 {len(indices[0])} 个结果")
            for i, idx in enumerate(indices[0]):
                if idx < len(self.metadata):
                    meta = self.metadata[idx]
                    print(f"  {i+1}. {meta['file']} - {meta['section']}")
            
            print()
            print("[OK] RAG系统已就绪!")
            
        except Exception as e:
            print(f"[ERROR] 测试失败: {e}")


def main():
    """主函数"""
    # 设置路径
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    knowledge_dir = backend_dir / 'knowledge_base' / 'max'
    output_dir = backend_dir / 'vector_db'
    
    # 创建索引器
    indexer = KnowledgeBaseIndexer(knowledge_dir, output_dir)
    
    # 执行索引
    success = indexer.index_all()
    
    if success:
        print("下一步:")
        print("  1. 启动后端服务: python app.py")
        print("  2. 访问登录页测试AI对话功能")
        print("  3. 查看RAG状态: curl http://localhost:5000/api/ai-dialogue/status")
    else:
        print("索引失败，请检查错误信息")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[INFO] 索引被用户中断")
    except Exception as e:
        print(f"\n[ERROR] 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)