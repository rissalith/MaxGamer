"""
图像处理模块
提供专业的绿幕抠图和图像切割功能
"""
import io
import base64
from typing import List, Tuple
import numpy as np
from PIL import Image
import cv2


class ImageProcessor:
    """图像处理器类"""
    
    @staticmethod
    def decode_base64_image(base64_str: str) -> np.ndarray:
        """
        解码base64图像
        
        Args:
            base64_str: base64编码的图像字符串（可能包含data:image前缀）
            
        Returns:
            numpy数组格式的图像（BGR格式）
        """
        # 移除data:image前缀
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        # 解码base64
        image_data = base64.b64decode(base64_str)
        
        # 转换为PIL Image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # 转换为numpy数组
        if pil_image.mode == 'RGBA':
            image_array = np.array(pil_image)
            # RGBA转BGR（OpenCV格式）
            bgr_image = cv2.cvtColor(image_array, cv2.COLOR_RGBA2BGR)
        elif pil_image.mode == 'RGB':
            image_array = np.array(pil_image)
            # RGB转BGR
            bgr_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        else:
            # 其他格式先转RGB再转BGR
            pil_image = pil_image.convert('RGB')
            image_array = np.array(pil_image)
            bgr_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return bgr_image
    
    @staticmethod
    def encode_image_to_base64(image: np.ndarray, format: str = 'PNG') -> str:
        """
        将图像编码为base64字符串
        
        Args:
            image: numpy数组格式的图像（BGRA格式，带alpha通道）
            format: 输出格式（PNG或JPEG）
            
        Returns:
            base64编码的图像字符串（包含data:image前缀）
        """
        # 转换为PIL Image
        if image.shape[2] == 4:  # BGRA
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA))
        elif image.shape[2] == 3:  # BGR
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        else:
            raise ValueError(f"不支持的图像通道数: {image.shape[2]}")
        
        # 保存到字节流
        buffer = io.BytesIO()
        pil_image.save(buffer, format=format)
        buffer.seek(0)
        
        # 编码为base64
        base64_str = base64.b64encode(buffer.read()).decode('utf-8')
        
        # 添加data:image前缀
        mime_type = f'image/{format.lower()}'
        return f'data:{mime_type};base64,{base64_str}'
    
    @staticmethod
    def slice_image(image: np.ndarray, rows: int, cols: int) -> List[np.ndarray]:
        """
        将图像切割成多个帧
        
        Args:
            image: 输入图像（BGR格式）
            rows: 行数
            cols: 列数
            
        Returns:
            切割后的帧列表
        """
        height, width = image.shape[:2]
        frame_height = height // rows
        frame_width = width // cols
        
        frames = []
        for row in range(rows):
            for col in range(cols):
                y_start = row * frame_height
                y_end = (row + 1) * frame_height
                x_start = col * frame_width
                x_end = (col + 1) * frame_width
                
                frame = image[y_start:y_end, x_start:x_end].copy()
                frames.append(frame)
        
        return frames
    
    @staticmethod
    def remove_green_background(image: np.ndarray, tolerance: int = 50) -> np.ndarray:
        """
        使用专业算法去除绿幕背景
        
        Args:
            image: 输入图像（BGR格式）
            tolerance: 容差值（0-255），值越大去除范围越广
            
        Returns:
            带alpha通道的图像（BGRA格式）
        """
        # 转换到HSV色彩空间（更适合颜色识别）
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # 定义绿色的HSV范围 - 更严格的绿色检测
        # 绿色在HSV中的色调(H)范围大约是35-85
        # 提高饱和度和明度的下限，只去除鲜艳的绿色背景
        lower_green = np.array([35, 80, 80])  # 提高S和V的下限
        upper_green = np.array([85, 255, 255])
        
        # 根据tolerance调整范围 - 降低容差的影响
        tolerance_factor = tolerance / 100.0  # 降低归一化因子
        h_range = int(8 * tolerance_factor)  # 减小色调范围
        s_range = int(30 * tolerance_factor)  # 减小饱和度范围
        v_range = int(30 * tolerance_factor)  # 减小明度范围
        
        lower_green[0] = max(35 - h_range, 0)
        lower_green[1] = max(80 - s_range, 40)  # 保持最小饱和度
        lower_green[2] = max(80 - v_range, 40)  # 保持最小明度
        
        upper_green[0] = min(85 + h_range, 180)
        upper_green[1] = 255
        upper_green[2] = 255
        
        # 创建绿色掩码
        mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # 更温和的形态学操作，保留细节
        kernel_small = np.ones((2, 2), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small, iterations=1)
        
        # 使用更小的核进行闭运算，避免过度填充
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_small, iterations=1)
        
        # 轻微的边缘羽化，保持细节
        mask = cv2.GaussianBlur(mask, (3, 3), 0)
        
        # 创建alpha通道
        alpha = cv2.bitwise_not(mask)
        
        # 将BGR图像转换为BGRA
        bgra = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
        bgra[:, :, 3] = alpha
        
        return bgra
    
    @staticmethod
    def remove_background_by_color(image: np.ndarray, bg_color: Tuple[int, int, int], 
                                   tolerance: int = 30) -> np.ndarray:
        """
        根据指定颜色去除背景
        
        Args:
            image: 输入图像（BGR格式）
            bg_color: 背景颜色（B, G, R）
            tolerance: 容差值
            
        Returns:
            带alpha通道的图像（BGRA格式）
        """
        # 创建颜色范围
        lower = np.array([max(0, c - tolerance) for c in bg_color])
        upper = np.array([min(255, c + tolerance) for c in bg_color])
        
        # 创建掩码
        mask = cv2.inRange(image, lower, upper)
        
        # 形态学操作
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        # 边缘羽化
        mask = cv2.GaussianBlur(mask, (5, 5), 0)
        
        # 创建alpha通道
        alpha = cv2.bitwise_not(mask)
        
        # 转换为BGRA
        bgra = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
        bgra[:, :, 3] = alpha
        
        return bgra
    
    @classmethod
    def process_sprite_sheet(cls, base64_image: str, rows: int, cols: int, 
                            tolerance: int = 50, mode: str = 'green') -> List[str]:
        """
        处理精灵图：切割并去除背景
        
        Args:
            base64_image: base64编码的图像
            rows: 行数
            cols: 列数
            tolerance: 容差值
            mode: 处理模式（'green'=绿幕抠图, 'auto'=自动检测背景色）
            
        Returns:
            处理后的帧列表（base64格式）
        """
        # 解码图像
        image = cls.decode_base64_image(base64_image)
        
        # 切割图像
        frames = cls.slice_image(image, rows, cols)
        
        # 处理每一帧
        processed_frames = []
        for frame in frames:
            if mode == 'green':
                # 绿幕抠图
                processed = cls.remove_green_background(frame, tolerance)
            elif mode == 'auto':
                # 自动检测背景色（使用左上角像素）
                bg_color = tuple(frame[0, 0].tolist())
                processed = cls.remove_background_by_color(frame, bg_color, tolerance)
            else:
                # 不处理，只添加alpha通道
                processed = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
            
            # 编码为base64
            base64_frame = cls.encode_image_to_base64(processed)
            processed_frames.append(base64_frame)
        
        return processed_frames