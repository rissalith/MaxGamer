/**
 * 拖拽工具类
 * 使用requestAnimationFrame实现Windows级别的流畅拖拽
 */
class Draggable {
    /**
     * 重置所有窗口位置到安全区域
     */
    static resetAllPositions() {
        // 清除所有可能保存的transform
        const panels = [
            document.getElementById('probability-panel'),
            document.getElementById('live-danmaku-panel'),
            document.getElementById('user-info-panel'),
            document.querySelector('.fortune-chat-container')
        ];
        
        panels.forEach(panel => {
            if (panel) {
                panel.style.transform = '';
                panel.style.left = '';
                panel.style.top = '';
            }
        });
        
        console.log('[拖拽工具] 已重置所有窗口位置');
    }
    
    /**
     * 使元素可拖拽
     * @param {HTMLElement} element - 要拖拽的元素
     * @param {HTMLElement} handle - 拖拽手柄（可选，默认为元素本身）
     */
    static makeDraggable(element, handle = null) {
        if (!element) return;
        
        const dragHandle = handle || element;
        let isDragging = false;
        let animationId = null;
        let currentX = 0, currentY = 0;
        let targetX = 0, targetY = 0;
        let startX = 0, startY = 0;
        
        // 获取元素当前的计算位置
        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);
        
        // 保存当前位置
        const initialLeft = rect.left;
        const initialTop = rect.top;
        
        // 确保元素有定位
        if (computedStyle.position === 'static') {
            element.style.position = 'absolute';
        }
        
        // 清除可能冲突的CSS定位属性，并设置初始transform
        element.style.top = '';
        element.style.left = '';
        element.style.right = '';
        element.style.bottom = '';
        
        // 设置初始位置为当前位置
        currentX = initialLeft;
        currentY = initialTop;
        targetX = initialLeft;
        targetY = initialTop;
        element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        
        // 优化渲染性能
        element.style.willChange = 'transform';
        element.style.backfaceVisibility = 'hidden';
        element.style.perspective = '1000px';
        
        // 添加拖拽手柄样式
        dragHandle.style.cursor = 'move';
        dragHandle.style.userSelect = 'none';
        dragHandle.style.webkitUserSelect = 'none';
        dragHandle.style.webkitTouchCallout = 'none';
        
        // 动画循环函数
        const animate = () => {
            if (!isDragging) return;
            
            // 使用线性插值实现平滑移动
            const dx = targetX - currentX;
            const dy = targetY - currentY;
            
            // 如果距离很小，直接设置为目标位置
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                currentX = targetX;
                currentY = targetY;
            } else {
                // 平滑过渡（调整系数可以改变流畅度，0.3表示30%的插值）
                currentX += dx * 0.3;
                currentY += dy * 0.3;
            }
            
            // 应用变换
            element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            
            // 继续动画
            animationId = requestAnimationFrame(animate);
        };
        
        // 鼠标按下
        const onPointerDown = (e) => {
            // 如果点击的是输入框、按钮等，不触发拖拽
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'SELECT' ||
                e.target.type === 'range') {
                return;
            }
            
            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                isDragging = true;
                
                const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                
                startX = clientX - currentX;
                startY = clientY - currentY;
                
                element.style.zIndex = 10001;
                element.style.transition = 'none'; // 禁用CSS过渡
                
                // 开始动画循环
                if (animationId) cancelAnimationFrame(animationId);
                animationId = requestAnimationFrame(animate);
                
                e.preventDefault();
            }
        };
        
        // 鼠标移动
        const onPointerMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            
            // 计算目标位置
            targetX = clientX - startX;
            targetY = clientY - startY;
            
            // 边界限制 - 保持窗口完全在视口内
            // 确保边界值合理，如果窗口比视口大，允许自由移动
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let minX = 0;
            let maxX = viewportWidth - elementWidth;
            let minY = 0;
            let maxY = viewportHeight - elementHeight;
            
            // 如果窗口比视口大，允许更自由的移动
            if (elementWidth > viewportWidth) {
                minX = -(elementWidth - viewportWidth);
                maxX = 0;
            }
            if (elementHeight > viewportHeight) {
                minY = -(elementHeight - viewportHeight);
                maxY = 0;
            }
            
            targetX = Math.max(minX, Math.min(targetX, maxX));
            targetY = Math.max(minY, Math.min(targetY, maxY));
        };
        
        // 鼠标释放
        const onPointerUp = () => {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = '';
                
                // 停止动画
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
                
                // 确保最终位置准确
                currentX = targetX;
                currentY = targetY;
                element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        };
        
        // 绑定事件
        dragHandle.addEventListener('mousedown', onPointerDown, { passive: false });
        dragHandle.addEventListener('touchstart', onPointerDown, { passive: false });
        document.addEventListener('mousemove', onPointerMove, { passive: false });
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);
        
        // 返回清理函数
        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            dragHandle.removeEventListener('mousedown', onPointerDown);
            dragHandle.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('touchmove', onPointerMove);
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchend', onPointerUp);
            element.style.willChange = '';
            element.style.backfaceVisibility = '';
            element.style.perspective = '';
        };
    }
}

// 导出为全局变量
window.Draggable = Draggable;