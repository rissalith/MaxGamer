// 头像上传预览功能
class AvatarHandler {
    constructor() {
        this.avatarInput = document.getElementById('avatar-input');
        this.avatarPreview = document.getElementById('avatar-preview');
        this.init();
    }

    init() {
        if (this.avatarInput && this.avatarPreview) {
            this.avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        }
    }

    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.avatarPreview.src = event.target.result;
                this.avatarPreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        }
    }

    getUserAvatar() {
        const hasAvatar = this.avatarPreview && this.avatarPreview.classList.contains('show');
        return hasAvatar ? this.avatarPreview.src : '';
    }
}

// 导出为全局变量以便其他脚本使用
window.AvatarHandler = AvatarHandler;