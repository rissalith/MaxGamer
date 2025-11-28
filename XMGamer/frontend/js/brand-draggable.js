/**
 * 品牌区域文字拖拽功能
 * 只移动文字，底框保持固定
 */

class BrandDraggable {
    constructor() {
        this.titleElement = null;
        this.subtitleElement = null;
        this.isDragging = false;
        this.currentElement = null;
        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    init() {
        this.titleElement = document.querySelector('.brand-title');
        this.subtitleElement = document.querySelector('.brand-subtitle');

        if (this.titleElement) {
            this.makeDraggable(this.titleElement);
        }

        if (this.subtitleElement) {
            this.makeDraggable(this.subtitleElement);
        }
    }

    makeDraggable(element) {
        element.addEventListener('mousedown', (e) => this.onMouseDown(e, element));
        element.addEventListener('touchstart', (e) => this.onTouchStart(e, element), { passive: false });
    }

    onMouseDown(e, element) {
        e.preventDefault();
        this.startDrag(e.clientX, e.clientY, element);

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onTouchStart(e, element) {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY, element);

        document.addEventListener('touchmove', this.onTouchMove, { passive: false });
        document.addEventListener('touchend', this.onTouchEnd);
    }

    startDrag(clientX, clientY, element) {
        this.isDragging = true;
        this.currentElement = element;

        // 获取当前transform值
        const style = window.getComputedStyle(element);
        const matrix = new DOMMatrix(style.transform);
        
        this.offsetX = matrix.m41;
        this.offsetY = matrix.m42;
        this.startX = clientX;
        this.startY = clientY;

        element.style.cursor = 'grabbing';
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

        this.currentElement.style.transform = `translate(${newX}px, ${newY}px)`;
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
        if (this.currentElement) {
            this.currentElement.style.cursor = 'move';
        }
        this.isDragging = false;
        this.currentElement = null;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const brandDraggable = new BrandDraggable();
    brandDraggable.init();
    
    // 将实例挂载到window，方便调试
    window.brandDraggable = brandDraggable;
});