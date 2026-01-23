---
title: Odoo OWL二进制字段组件Prompt模板
sidebar_label: Odoo OWL二进制字段组件Prompt模板
keywords:
  - AI
  - GenAI
tags: [GenAI]
unlisted: true
---

# Odoo OWL 二进制字段组件 Prompt 模板

> **适用类型**: Binary, Image, File, Many2many Binary  
> **复杂度**: ⭐⭐⭐⭐  
> **版本**: v1.0  
> **最后更新**: 2026-01-23

---

## 📖 使用说明

本模板专门用于生成**二进制字段组件**，这些字段具有以下共性：
- 文件上传和下载
- 图片预览和编辑
- 文件大小和类型验证
- Base64编码处理
- 拖拽上传支持

**适用场景：**
- Binary: 通用文件字段
- Image: 图片字段（带预览、裁剪）
- File: 文件字段（带文件名）
- Many2many Binary: 多文件上传

---

## 🎯 类型特定规范

### 必需的导入

```javascript
/** @odoo-module **/

// 1. OWL 核心
import { Component, useState, useRef } from "@odoo/owl";

// 2. 字段基础
import { standardFieldProps } from "@web/views/fields/standard_field_props";

// 3. 文件处理工具
import { 
    FileHandler, 
    useFileUpload 
} from "@web/views/fields/file_handler";

// 4. 服务
import { useService } from "@web/core/utils/hooks";

// 5. 工具函数
import { _lt } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { url } from "@web/core/utils/urls";
import { isBrowserFirefox, isMobileOS } from "@web/core/browser/feature_detection";
```

### Binary 数据结构

```javascript
// Binary 字段值为 Base64 编码的字符串
// 或 false/null 表示无文件

// 获取文件URL
get imageUrl() {
    if (!this.props.value) return null;
    
    const baseUrl = `/web/image/${this.props.record.resModel}/${this.props.record.resId}/${this.props.name}`;
    return url(baseUrl, { unique: this.props.record.data.write_date });
}

// 获取下载URL
get downloadUrl() {
    return url('/web/content', {
        model: this.props.record.resModel,
        id: this.props.record.resId,
        field: this.props.name,
        filename_field: this.props.fileNameField || 'name',
        download: true,
    });
}
```

### 文件上传处理

```javascript
setup() {
    this.notification = useService("notification");
    this.fileInputRef = useRef("fileInput");
    
    this.state = useState({
        isUploading: false,
        progress: 0,
        error: null,
    });
    
    // 文件上传Hook
    this.fileUpload = useFileUpload({
        fileInput: this.fileInputRef,
        onFileLoaded: this.onFileLoaded.bind(this),
        onLoadError: this.onLoadError.bind(this),
    });
}

async onFileLoaded(file) {
    // 验证文件
    if (!this.validateFile(file)) return;
    
    // 读取为Base64
    const base64 = await this.readFileAsBase64(file);
    
    // 更新字段值
    await this.props.update(base64);
    
    // 如果有文件名字段，同时更新
    if (this.props.fileNameField) {
        await this.props.record.update({
            [this.props.fileNameField]: file.name
        });
    }
}

readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除 "data:xxx;base64," 前缀
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

### 文件验证

```javascript
validateFile(file) {
    // 文件大小验证
    const maxSize = this.props.maxFileSize || 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        this.notification.add(
            _t(`File size exceeds ${maxSize / 1024 / 1024}MB`),
            { type: 'danger' }
        );
        return false;
    }
    
    // 文件类型验证
    if (this.props.acceptedFileTypes) {
        const types = this.props.acceptedFileTypes.split(',');
        const isValid = types.some(type => {
            return file.type.match(type.trim().replace('*', '.*'));
        });
        if (!isValid) {
            this.notification.add(
                _t('Invalid file type'),
                { type: 'danger' }
            );
            return false;
        }
    }
    
    return true;
}
```

---

## 📋 Prompt 模板

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请为我生成一个**二进制字段组件**。

## 组件信息

**组件名称**: 【如 ImageUploadField】
**技术名称**: 【如 image_upload_field】  
**字段类型**: [Binary / Image / File / Many2many Binary]
**显示名称**: 【如 "图片上传字段"】
**文件类型**: 【image / document / any】

## 功能需求

### 核心功能

#### Image 字段功能
1. 【功能1】: 【如 显示图片预览】
2. 【功能2】: 【如 拖拽或点击上传图片】
3. 【功能3】: 【如 支持裁剪和缩放】
4. 【功能4】: 【如 显示上传进度】
5. 【功能5】: 【如 支持删除图片】

#### File 字段功能
1. 【功能1】: 【如 显示文件名和大小】
2. 【功能2】: 【如 点击下载文件】
3. 【功能3】: 【如 支持替换文件】
4. 【功能4】: 【如 显示文件图标（基于类型）】

#### Binary 字段功能
1. 【功能1】: 【如 通用文件上传】
2. 【功能2】: 【如 自动检测文件类型】
3. 【功能3】: 【如 支持预览（图片/PDF）】

#### Many2many Binary 功能
1. 【功能1】: 【如 多文件上传】
2. 【功能2】: 【如 文件列表显示】
3. 【功能3】: 【如 单个删除或批量删除】
4. 【功能4】: 【如 拖拽排序文件】

### 文件验证

#### 文件类型限制
- 允许的类型: 【如 image/*  或  application/pdf,image/*】
- MIME类型检查: 【是/否】
- 扩展名检查: 【如 .jpg, .png, .pdf】

#### 文件大小限制
- 最小大小: 【如 10KB 或 无限制】
- 最大大小: 【如 5MB】
- 超过限制提示: 【如 "文件不能超过5MB"】

#### 图片尺寸限制（Image字段）
- 最小宽度: 【如 200px】
- 最小高度: 【如 200px】
- 最大宽度: 【如 2000px】
- 最大高度: 【如 2000px】
- 宽高比: 【如 16:9 或 无限制】

### 上传方式

#### 点击上传
- 按钮文字: 【如 "选择文件" / "上传图片"】
- 按钮样式: 【主按钮/次按钮/图标按钮】
- 文件选择器: 【系统默认】

#### 拖拽上传
- 拖拽区域: 【整个组件/指定区域】
- 拖拽提示: 【如 "拖拽文件到此处"】
- 拖拽样式: 【边框高亮/背景变色】

#### 粘贴上传（可选）
- 支持剪贴板: 【是/否】
- 粘贴快捷键: 【Ctrl+V】

### 预览功能

#### 图片预览
- 预览方式: 【内联显示/模态框/新窗口】
- 预览大小: 【缩略图/中等/全尺寸】
- 预览比例: 【保持比例/裁剪/拉伸】
- 占位图: 【默认图标/自定义图片】

#### 文件预览
- 支持的类型: 【PDF / Office文档 / 纯文本】
- 预览方式: 【内嵌查看器/下载后查看】

### 编辑功能（图片）

#### 裁剪工具
- 是否支持: 【是/否】
- 裁剪比例: 【自由/固定比例】
- 裁剪库: 【cropperjs / 其他】

#### 基础编辑
- 旋转: 【是/否】
- 翻转: 【是/否】
- 缩放: 【是/否】
- 滤镜: 【是/否】

### Props 配置

#### 标准Props（自动继承）
```javascript
// 通过 standardFieldProps 自动获得
- record: Object      // 当前记录
- name: String        // 字段名称
- type: String        // 字段类型（binary）
- readonly: Boolean   // 是否只读
- value: String       // Base64编码的文件数据
- update: Function   // 更新回调
```

#### 自定义Props
```javascript
- acceptedFileTypes: String    // 【如 "image/*,application/pdf"】
- maxFileSize: Number         // 【最大文件大小（字节）】
- minFileSize: Number         // 【最小文件大小（字节）】
- maxWidth: Number           // 【图片最大宽度（像素）】
- maxHeight: Number          // 【图片最大高度（像素）】
- aspectRatio: String        // 【宽高比，如 "16:9"】
- fileNameField: String      // 【文件名字段名】
- allowCrop: Boolean         // 【是否允许裁剪】
- allowRotate: Boolean       // 【是否允许旋转】
- showSize: Boolean          // 【是否显示文件大小】
- showDownload: Boolean      // 【是否显示下载按钮】
- showDelete: Boolean        // 【是否显示删除按钮】
- placeholder: String        // 【占位提示文本】
- previewWidth: Number       // 【预览宽度】
- previewHeight: Number      // 【预览高度】
- 【其他自定义选项】
```

#### Widget 使用示例

**Image 字段**:
```xml
<field name="image" 
       widget="image_upload_field"
       options="{
           'max_width': 1920,
           'max_height': 1080,
           'preview_width': 300,
           'allow_crop': true
       }"/>
```

**File 字段**:
```xml
<field name="attachment" 
       widget="file_upload_field"
       filename="attachment_name"
       options="{
           'accepted_file_types': 'application/pdf',
           'max_file_size': 5242880
       }"/>
```

**Many2many Binary**:
```xml
<field name="attachment_ids" 
       widget="many2many_binary_field"
       options="{
           'accepted_file_types': 'image/*,application/pdf',
           'allow_delete': true
       }"/>
```

### 交互逻辑

#### 空状态（无文件）
- 显示: 【上传区域、占位图标、提示文本】
- 拖拽区: 【虚线边框、提示文字】
- 点击: 【打开文件选择器】

#### 上传中
- 进度条: 【是否显示】
- 进度百分比: 【是否显示】
- 取消按钮: 【是否支持取消上传】
- 禁用交互: 【上传期间禁用其他操作】

#### 已上传（有文件）
- 预览显示: 【图片/图标+文件名】
- 操作按钮: 【查看/下载/替换/删除】
- Hover效果: 【显示操作按钮/遮罩层】

#### 只读模式
- 图片: 【只显示，可点击查看大图】
- 文件: 【显示文件名，可点击下载】
- 操作: 【隐藏编辑/删除按钮】

#### 错误状态
- 验证失败: 【显示错误信息】
- 上传失败: 【显示重试按钮】
- 加载失败: 【显示占位图】

### 样式需求

#### 上传区域
- 大小: 【宽度、高度】
- 边框: 【实线/虚线、颜色】
- 背景: 【颜色/渐变/图案】
- 圆角: 【是否圆角】

#### 预览样式
- 容器: 【边框、阴影、圆角】
- 图片: 【object-fit: cover/contain】
- 文件图标: 【大小、颜色】

#### 操作按钮
- 位置: 【底部/右上角/悬停显示】
- 样式: 【图标/文字/图标+文字】
- 布局: 【水平/垂直】

#### 响应式
- 桌面: 【完整功能】
- 平板: 【适度缩放】
- 手机: 【简化界面、触摸优化】

### 特殊功能（可选）
- [ ] 图片裁剪工具
- [ ] 图片压缩（前端）
- [ ] 多文件批量上传
- [ ] 拖拽排序
- [ ] 上传到CDN
- [ ] 图片水印
- [ ] EXIF信息读取
- [ ] 缩略图生成
- [ ] 【其他】

## 技术要求

### 文件生成

请生成以下文件：

#### 1. JS 组件文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class YourBinaryField extends Component {
    setup() {
        this.notification = useService("notification");
        this.fileInputRef = useRef("fileInput");
        
        this.state = useState({
            isUploading: false,
            progress: 0,
            error: null,
        });
    }
    
    // 获取预览URL
    get previewUrl() {
        if (!this.props.value) return null;
        return url(`/web/image/${this.props.record.resModel}/${this.props.record.resId}/${this.props.name}`);
    }
    
    // 获取下载URL
    get downloadUrl() {
        return url('/web/content', {
            model: this.props.record.resModel,
            id: this.props.record.resId,
            field: this.props.name,
            download: true,
        });
    }
    
    // 触发文件选择
    onClickUpload() {
        this.fileInputRef.el.click();
    }
    
    // 处理文件选择
    async onFileChange(ev) {
        const file = ev.target.files[0];
        if (!file) return;
        
        if (!this.validateFile(file)) return;
        
        this.state.isUploading = true;
        try {
            const base64 = await this.readFileAsBase64(file);
            await this.props.update(base64);
            
            // 如果有文件名字段
            if (this.props.fileNameField) {
                await this.props.record.update({
                    [this.props.fileNameField]: file.name
                });
            }
        } catch (error) {
            this.notification.add(error.message, { type: 'danger' });
        } finally {
            this.state.isUploading = false;
        }
    }
    
    // 文件验证
    validateFile(file) {
        // 大小验证
        if (this.props.maxFileSize && file.size > this.props.maxFileSize) {
            this.notification.add(
                `文件大小不能超过 ${this.formatFileSize(this.props.maxFileSize)}`,
                { type: 'danger' }
            );
            return false;
        }
        
        // 类型验证
        if (this.props.acceptedFileTypes) {
            const types = this.props.acceptedFileTypes.split(',');
            const isValid = types.some(type => {
                return file.type.match(type.trim().replace('*', '.*'));
            });
            if (!isValid) {
                this.notification.add('不支持的文件类型', { type: 'danger' });
                return false;
            }
        }
        
        return true;
    }
    
    // 读取文件为Base64
    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // 删除文件
    async onDelete() {
        await this.props.update(false);
        if (this.props.fileNameField) {
            await this.props.record.update({
                [this.props.fileNameField]: false
            });
        }
    }
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }
}
```

#### 2. XML 模板文件（Image）
**路径**: `static/src/fields/【技术名称】/【技术名称】.xml`

```xml
<t t-name="【模块】.ImageUploadField" owl="1">
    <div class="o_field_image">
        <!-- 文件输入（隐藏） -->
        <input type="file"
               t-ref="fileInput"
               t-att-accept="props.acceptedFileTypes"
               t-on-change="onFileChange"
               style="display: none;"/>
        
        <!-- 只读模式 -->
        <div t-if="props.readonly" class="o_readonly">
            <img t-if="props.value" 
                 t-att-src="previewUrl"
                 class="o_image_preview"
                 alt="Image"/>
            <span t-else="" class="text-muted">无图片</span>
        </div>
        
        <!-- 编辑模式 -->
        <div t-else="" class="o_editable">
            <!-- 无文件时 -->
            <div t-if="!props.value" 
                 class="o_upload_area"
                 t-on-click="onClickUpload">
                <i class="fa fa-cloud-upload fa-3x text-muted"/>
                <p class="text-muted">点击上传图片</p>
                <p class="small text-muted">或拖拽图片到此处</p>
            </div>
            
            <!-- 已有文件时 -->
            <div t-else="" class="o_image_container">
                <!-- 上传中 -->
                <div t-if="state.isUploading" class="o_uploading">
                    <div class="progress">
                        <div class="progress-bar" 
                             t-att-style="'width: ' + state.progress + '%'"/>
                    </div>
                </div>
                
                <!-- 预览 -->
                <img t-else=""
                     t-att-src="previewUrl"
                     class="o_image_preview"/>
                
                <!-- 操作按钮 -->
                <div class="o_image_actions">
                    <button type="button"
                            class="btn btn-sm btn-secondary"
                            t-on-click="onClickUpload"
                            title="替换">
                        <i class="fa fa-upload"/>
                    </button>
                    <button type="button"
                            class="btn btn-sm btn-danger"
                            t-on-click="onDelete"
                            title="删除">
                        <i class="fa fa-trash"/>
                    </button>
                </div>
            </div>
        </div>
    </div>
</t>
```

#### 3. SCSS 样式文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.scss`

```scss
.o_field_image {
    .o_upload_area {
        border: 2px dashed #ccc;
        border-radius: 4px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
            border-color: #007bff;
            background-color: #f8f9fa;
        }
        
        i {
            display: block;
            margin-bottom: 1rem;
        }
    }
    
    .o_image_container {
        position: relative;
        display: inline-block;
        
        .o_image_preview {
            max-width: 100%;
            max-height: 300px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }
        
        .o_image_actions {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            display: flex;
            gap: 0.25rem;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        &:hover .o_image_actions {
            opacity: 1;
        }
    }
    
    .o_uploading {
        padding: 2rem;
        text-align: center;
    }
}
```

### 参考实现

请参考以下 Odoo 标准字段实现：

**Binary**: `@web/views/fields/binary/binary_field`
**Image**: `@web/views/fields/image/image_field`
**FileHandler**: `@web/views/fields/file_handler`
**Many2many Binary**: `@web/views/fields/many2many_binary/many2many_binary_field`

### 代码规范

- [ ] 使用 FileReader API 读取文件
- [ ] 正确处理 Base64 编码
- [ ] 实现文件验证逻辑
- [ ] 处理上传进度显示
- [ ] 添加错误处理
- [ ] 支持拖拽上传
- [ ] 支持文件名字段关联
- [ ] 添加完整注释

### 使用示例

#### Python 模型定义

```python
from odoo import models, fields

class YourModel(models.Model):
    _name = 'your.model'
    
    # 图片字段
    image = fields.Binary(string='Image', attachment=True)
    
    # 文件字段
    attachment = fields.Binary(string='Attachment', attachment=True)
    attachment_name = fields.Char(string='File Name')
    
    # 多文件字段
    attachment_ids = fields.Many2many(
        'ir.attachment',
        string='Attachments'
    )
```

#### 视图使用

请在生成代码后提供完整的视图使用示例。

## 额外说明

【在此添加任何额外的说明、约束或特殊要求】

- 是否需要图片裁剪功能？
- 是否需要压缩上传？
- 文件存储位置（数据库/文件系统/CDN）？
- 是否需要支持多文件上传？
- 是否需要进度条显示？

## 期望输出

请生成：
1. 完整的 JavaScript 组件代码
2. 完整的 XML 模板代码
3. 完整的 SCSS 样式代码
4. assets.xml 注册代码
5. 使用文档和示例
6. 文件处理最佳实践说明
7. 测试建议

确保代码：
- 完全符合 Odoo 16.0+ OWL 框架规范
- 正确处理 Base64 编码
- 实现完整的文件验证
- 优雅处理上传进度和错误
- 支持拖拽上传
````

---

## 🎨 快速示例

### 示例1：产品图片上传（带裁剪）

```text
**组件名称**: ProductImageField
**技术名称**: product_image_field
**字段类型**: Image
**显示名称**: "产品图片"

核心功能:
1. 上传产品图片
2. 正方形裁剪（1:1）
3. 最大2MB
4. 仅支持JPG/PNG

验证规则:
- 文件类型: image/jpeg, image/png
- 最大大小: 2MB
- 图片尺寸: 500x500 到 2000x2000
- 宽高比: 1:1

Widget使用:
<field name="image" widget="product_image_field"
       options="{'max_file_size': 2097152, 'aspect_ratio': '1:1', 'allow_crop': true}"/>
```

### 示例2：多文件附件上传

```text
**组件名称**: MultiFileAttachmentField
**技术名称**: multi_file_attachment_field
**字段类型**: Many2many Binary
**显示名称**: "附件上传"

核心功能:
1. 批量上传多个文件
2. 显示文件列表
3. 单个删除或批量删除
4. 显示文件大小和类型

验证规则:
- 文件类型: PDF, Word, Excel, 图片
- 最大大小: 10MB per file
- 最多文件数: 10

Widget使用:
<field name="attachment_ids" widget="multi_file_attachment_field"
       options="{'max_file_size': 10485760, 'max_files': 10}"/>
```

---

## 📚 常见问题

### Q1: 如何实现拖拽上传？

```javascript
onDragOver(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.state.isDragging = true;
}

onDragLeave(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.state.isDragging = false;
}

async onDrop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.state.isDragging = false;
    
    const files = ev.dataTransfer.files;
    if (files.length > 0) {
        await this.handleFile(files[0]);
    }
}
```

### Q2: 如何压缩图片？

```javascript
async compressImage(base64, maxWidth, maxHeight) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
        };
        img.src = 'data:image/jpeg;base64,' + base64;
    });
}
```

### Q3: 如何实现图片裁剪？

```javascript
// 使用 cropperjs 库
import Cropper from 'cropperjs';

showCropDialog() {
    const img = document.createElement('img');
    img.src = 'data:image/jpeg;base64,' + this.props.value;
    
    const cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        ready: () => {
            // 裁剪器准备就绪
        }
    });
    
    // 显示对话框，确认后获取裁剪结果
    const canvas = cropper.getCroppedCanvas();
    const croppedBase64 = canvas.toDataURL().split(',')[1];
    await this.props.update(croppedBase64);
}
```

### Q4: 如何处理大文件上传？

```javascript
// 分片上传
async uploadLargeFile(file) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        // 上传分片
        await this.uploadChunk(chunk, i, chunks);
        
        // 更新进度
        this.state.progress = ((i + 1) / chunks) * 100;
    }
}
```

---

## 🔗 相关资源

- [Binary Field 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/binary)
- [Image Field 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/image)
- [FileHandler 工具](https://github.com/odoo/odoo/blob/16.0/addons/web/static/src/views/fields/file_handler.js)
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [Cropper.js 文档](https://github.com/fengyuanchen/cropperjs)

---

**版本历史**:
- v1.0 (2026-01-23): 初始版本
