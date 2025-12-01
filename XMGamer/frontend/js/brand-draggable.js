/**
 * 品牌区域文字拖拽功能
 * 文字容器独立于底框，可以自由拖拽
 */

class BrandDraggable {
    constructor() {
        this.textContainer = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    init() {
        this.textContainer = document.querySelector('.brand-text-container');

        if (this.textContainer) {
            this.makeDraggable(this.textContainer);
        }
    }

    makeDraggable(element) {
        element.addEventListener('mousedown', (e) => this.onMouseDown(e));
        element.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    }

    onMouseDown(e) {
        e.preventDefault();
        this.startDrag(e.clientX, e.clientY);

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY);

        document.addEventListener('touchmove', this.onTouchMove, { passive: false });
        document.addEventListener('touchend', this.onTouchEnd);
    }

    startDrag(clientX, clientY) {
        this.isDragging = true;

        // 清除transition，确保拖拽流畅
        this.textContainer.style.transition = 'none';

        // 获取当前transform值
        const style = window.getComputedStyle(this.textContainer);
        const matrix = new DOMMatrix(style.transform);
        
        this.offsetX = matrix.m41;
        this.offsetY = matrix.m42;
        this.startX = clientX;
        this.startY = clientY;

        this.textContainer.style.cursor = 'grabbing';
    }

    onMouseMove = (e) => {
        if (!this.isDragging) return;
        e.preventDefault();
        this.drag(e.clientX, e.clientY);
    }

    onTouchMove = (e) => {
        if (!this.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.drag(touch.clientX, touch.clientY);
    }

    drag(clientX, clientY) {
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;

        const newX = this.offsetX + deltaX;
        const newY = this.offsetY + deltaY;

        // 直接对文字容器应用transform
        this.textContainer.style.transform = `translate(${newX}px, ${newY}px)`;
    }

    onMouseUp = () => {
        this.endDrag();
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    onTouchEnd = () => {
        this.endDrag();
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    endDrag() {
        if (this.textContainer) {
            this.textContainer.style.cursor = 'move';
            
            // 添加过渡动画
            this.textContainer.style.transition = 'transform 0.3s ease-out';
            
            // 重置位置到原点
            this.textContainer.style.transform = 'translate(0px, 0px)';
            
            // 动画完成后移除transition
            setTimeout(() => {
                if (this.textContainer) {
                    this.textContainer.style.transition = '';
                }
            }, 300);
        }
        
        this.isDragging = false;
    }
}

// 立即初始化（因为脚本是动态加载的，DOM已经准备好了）
const brandDraggable = new BrandDraggable();
brandDraggable.init();

// 将实例挂载到window，方便调试
window.brandDraggable = brandDraggable;