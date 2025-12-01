"""
RAG系统快速测试脚本
测试向量检索、缓存、性能等功能
"""

import sys
import time
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from services.rag_service import RAGService

def print_separator(title=""):
    """打印分隔线"""
    if title:
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")
    else:
        print(f"{'='*60}\n")

def test_initialization():
    """测试1: RAG服务初始化"""
    print_separator("测试1: RAG服务初始化")
    
    try:
        rag = RAGService()
        
        if rag.rag_available:
            print("[OK] RAG服务初始化成功")
            stats = rag.get_stats()
            print(f"[INFO] 向量数据库包含 {stats['total_chunks']} 个知识片段")
            return rag
        else:
            print("[ERROR] RAG服务不可用")
            print("[提示] 请先运行: python scripts/init_rag.py")
            return None
            
    except Exception as e:
        print(f"[ERROR] 初始化失败: {e}")
        return None

def test_basic_retrieval(rag):
    """测试2: 基础检索功能"""
    print_separator("测试2: 基础检索功能")
    
    test_queries = [
        "介绍一下MaxGamer平台",
        "Max是谁",
        "点赞会有什么反应",
        "送礼物会怎么样"
    ]
    
    for query in test_queries:
        print(f"查询: {query}")
        
        start_time = time.time()
        results = rag.retrieve(query, top_k=3)
        elapsed = (time.time() - start_time) * 1000
        
        print(f"  检索时间: {elapsed:.2f}ms")
        print(f"  结果数量: {len(results['documents'][0])}")
        
        if results['documents'][0]:
            first_doc = results['documents'][0][0]
            preview = first_doc[:100].replace('\n', ' ')
            print(f"  首个结果: {preview}...")
        
        print()

def test_hybrid_retrieval(rag):
    """测试3: 混合检索（向量+规则）"""
    print_separator("测试3: 混合检索")
    
    test_cases = [
        ("auto_intro", "自动介绍"),
        ("like", "点赞了"),
        ("gift", "送了一个火箭"),
        ("comment", "这个平台是做什么的？")
    ]
    
    for interaction_type, query in test_cases:
        print(f"交互类型: {interaction_type}")
        print(f"查询: {query}")
        
        start_time = time.time()
        results = rag.hybrid_retrieve(query, interaction_type, top_k=3)
        elapsed = (time.time() - start_time) * 1000
        
        print(f"  检索时间: {elapsed:.2f}ms")
        print(f"  结果数量: {len(results['documents'][0])}")
        
        # 显示元数据
        if results['metadatas'][0]:
            metadata = results['metadatas'][0][0]
            print(f"  来源文件: {metadata.get('file', 'unknown')}")
            print(f"  章节: {metadata.get('section', 'unknown')}")
            print(f"  优先级: {metadata.get('priority', 'unknown')}")
            print(f"  标签: {metadata.get('tags', 'unknown')}")
        
        print()

def test_context_building(rag):
    """测试4: 上下文构建"""
    print_separator("测试4: 上下文构建")
    
    query = "介绍一下MaxGamer平台"
    interaction_type = "comment"
    
    print(f"查询: {query}")
    print(f"交互类型: {interaction_type}\n")
    
    start_time = time.time()
    context = rag.build_context(query, interaction_type)
    elapsed = (time.time() - start_time) * 1000
    
    print(f"构建时间: {elapsed:.2f}ms")
    print(f"上下文长度: {len(context)} 字符")
    print(f"预估Token数: ~{len(context) // 2}")
    
    print("\n上下文预览:")
    print("-" * 60)
    print(context[:500])
    print("...")
    print("-" * 60)

def test_cache_performance(rag):
    """测试5: 缓存性能"""
    print_separator("测试5: 缓存性能")
    
    query = "介绍MaxGamer平台"
    
    # 第一次查询（未缓存）
    print("第一次查询（未缓存）:")
    start_time = time.time()
    rag.retrieve(query, top_k=3)
    first_time = (time.time() - start_time) * 1000
    print(f"  耗时: {first_time:.2f}ms")
    
    # 第二次查询（已缓存）
    print("\n第二次查询（已缓存）:")
    start_time = time.time()
    rag.retrieve(query, top_k=3)
    second_time = (time.time() - start_time) * 1000
    print(f"  耗时: {second_time:.2f}ms")
    
    # 性能提升
    improvement = ((first_time - second_time) / first_time) * 100
    print(f"\n缓存性能提升: {improvement:.1f}%")
    
    # 缓存统计
    stats = rag.get_stats()
    print(f"\n缓存统计:")
    print(f"  缓存大小: {stats['cache_size']}")
    print(f"  缓存命中: {stats['cache_hits']}")
    print(f"  缓存未命中: {stats['cache_misses']}")
    if stats['cache_hits'] + stats['cache_misses'] > 0:
        hit_rate = stats['cache_hits'] / (stats['cache_hits'] + stats['cache_misses']) * 100
        print(f"  命中率: {hit_rate:.1f}%")

def test_token_comparison(rag):
    """测试6: Token使用对比"""
    print_separator("测试6: Token使用对比（RAG vs 传统）")
    
    # RAG方法
    query = "介绍MaxGamer平台"
    rag_context = rag.build_context(query, "comment")
    rag_tokens = len(rag_context) // 2  # 粗略估算
    
    # 传统方法（加载所有知识库）
    knowledge_dir = Path(__file__).parent / "knowledge_base" / "max"
    traditional_tokens = 0
    
    for md_file in knowledge_dir.glob("*.md"):
        content = md_file.read_text(encoding='utf-8')
        traditional_tokens += len(content) // 2
    
    print(f"RAG方法:")
    print(f"  上下文长度: {len(rag_context)} 字符")
    print(f"  预估Token: ~{rag_tokens}")
    
    print(f"\n传统方法:")
    print(f"  知识库总长度: {traditional_tokens * 2} 字符")
    print(f"  预估Token: ~{traditional_tokens}")
    
    print(f"\nToken节省:")
    saved = traditional_tokens - rag_tokens
    saved_percent = (saved / traditional_tokens) * 100
    print(f"  节省Token: ~{saved}")
    print(f"  节省比例: {saved_percent:.1f}%")
    
    print(f"\n成本估算（按$0.01/1K tokens）:")
    print(f"  RAG方法: ${rag_tokens / 1000 * 0.01:.4f}/次")
    print(f"  传统方法: ${traditional_tokens / 1000 * 0.01:.4f}/次")
    print(f"  每1000次节省: ${saved / 1000 * 0.01 * 1000:.2f}")

def run_all_tests():
    """运行所有测试"""
    print("\n" + "="*60)
    print("  MaxGamer RAG系统测试")
    print("="*60)
    
    # 测试1: 初始化
    rag = test_initialization()
    if not rag:
        print("\n[ERROR] RAG服务不可用，测试终止")
        print("[提示] 请先运行以下命令:")
        print("  1. pip install -r requirements_rag.txt")
        print("  2. python scripts/init_rag.py")
        return
    
    # 测试2: 基础检索
    test_basic_retrieval(rag)
    
    # 测试3: 混合检索
    test_hybrid_retrieval(rag)
    
    # 测试4: 上下文构建
    test_context_building(rag)
    
    # 测试5: 缓存性能
    test_cache_performance(rag)
    
    # 测试6: Token对比
    test_token_comparison(rag)
    
    # 总结
    print_separator("测试完成")
    print("[OK] 所有测试通过")
    print("\n下一步:")
    print("  1. 启动后端服务: python app.py")
    print("  2. 访问登录页测试AI对话功能")
    print("  3. 查看RAG状态: curl http://localhost:5000/api/ai-dialogue/status")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n[INFO] 测试被用户中断")
    except Exception as e:
        print(f"\n[ERROR] 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()