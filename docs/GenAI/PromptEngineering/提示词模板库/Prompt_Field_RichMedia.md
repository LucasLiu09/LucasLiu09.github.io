---
title: Odoo OWL富媒体字段组件Prompt模板
sidebar_label: Odoo OWL富媒体字段组件Prompt模板
keywords:
  - AI
  - GenAI
tags: [GenAI]
unlisted: true
---

# Odoo OWL 富媒体字段组件 Prompt 模板

> **适用类型**: Html, Signature, PDF Viewer, Ace Editor  
> **复杂度**: ⭐⭐⭐⭐  
> **版本**: v1.0  
> **最后更新**: 2026-01-23

---

## 📖 使用说明

本模板专门用于生成**富媒体字段组件**，这些字段具有以下共性：
- 集成第三方编辑器或组件
- 复杂的内容编辑功能
- 特殊的内容渲染需求
- 工具栏和快捷键支持

**适用场景：**
- Html: 富文本编辑器（WYSIWYG）
- Signature: 手写签名板
- PDF Viewer: PDF 文件查看器
- Ace Editor: 代码编辑器

---

## 🎯 类型特定规范

### 必需的导入

```javascript
/** @odoo-module **/

// 1. OWL 核心
import { Component, onMounted, onWillUnmount, useRef } from "@odoo/owl";

// 2. 字段基础
import { standardFieldProps } from "@web/views/fields/standard_field_props";

// 3. 服务
import { useService } from "@web/core/utils/hooks";

// 4. 工具
import { _lt } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { loadJS, loadCSS } from "@web/core/assets";
```

### Html 字段（富文本编辑器）

```javascript
// 通常使用 Odoo 内置的 Wysiwyg 编辑器
import { Wysiwyg } from "@web_editor/js/wysiwyg/wysiwyg";

setup() {
    this.wysiwygRef = useRef("wysiwyg");
    this.orm = useService("orm");
    
    onMounted(async () => {
        this.wysiwyg = await this._createWysiwyg();
    });
    
    onWillUnmount(() => {
        if (this.wysiwyg) {
            this.wysiwyg.destroy();
        }
    });
}

async _createWysiwyg() {
    const wysiwyg = new Wysiwyg(this, {
        value: this.props.value || '',
        height: this.props.height || 300,
        toolbar: this.props.toolbar || [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['link', 'picture']],
        ],
        callbacks: {
            onChange: () => {
                this.props.update(wysiwyg.getValue());
            }
        }
    });
    
    await wysiwyg.attachTo(this.wysiwygRef.el);
    return wysiwyg;
}
```

### Signature 字段（签名板）

```javascript
// 通常使用 signature_pad 库
import SignaturePad from 'signature_pad';

setup() {
    this.canvasRef = useRef("canvas");
    
    onMounted(() => {
        const canvas = this.canvasRef.el;
        this.signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            onEnd: () => {
                this._saveSignature();
            }
        });
        
        if (this.props.value) {
            this.signaturePad.fromDataURL(this._getSignatureDataURL());
        }
    });
}

_saveSignature() {
    if (this.signaturePad.isEmpty()) {
        this.props.update(false);
    } else {
        const dataURL = this.signaturePad.toDataURL();
        const base64 = dataURL.split(',')[1];
        this.props.update(base64);
    }
}

clear() {
    this.signaturePad.clear();
    this.props.update(false);
}
```

### PDF Viewer 字段

```javascript
// 使用 PDF.js 或内置的 PDF 查看器
import { PDFViewer } from "@web/core/pdf_viewer/pdf_viewer";

setup() {
    this.pdfViewerRef = useRef("pdfViewer");
}

get pdfUrl() {
    if (!this.props.value) return null;
    return `/web/content/${this.props.record.resModel}/${this.props.record.resId}/${this.props.name}`;
}
```

### Ace Editor 字段（代码编辑器）

```javascript
// 使用 Ace Editor
setup() {
    this.editorRef = useRef("editor");
    
    onMounted(async () => {
        await loadJS('/web/static/lib/ace/ace.js');
        
        const editor = ace.edit(this.editorRef.el);
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode(`ace/mode/${this.props.mode || 'python'}`);
        editor.setValue(this.props.value || '');
        
        editor.session.on('change', () => {
            this.props.update(editor.getValue());
        });
        
        this.editor = editor;
    });
    
    onWillUnmount(() => {
        if (this.editor) {
            this.editor.destroy();
        }
    });
}
```

---

## 📋 Prompt 模板

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请为我生成一个**富媒体字段组件**。

## 组件信息

**组件名称**: 【如 RichTextEditorField】
**技术名称**: 【如 rich_text_editor_field】  
**字段类型**: [Html / Signature / PDF Viewer / Ace Editor / Custom]
**显示名称**: 【如 "富文本编辑器"】
**第三方库**: 【如 Wysiwyg / signature_pad / PDF.js / Ace Editor】

## 功能需求

### 核心功能

#### Html 富文本编辑器
1. 【功能1】: 【如 支持文本格式化（粗体、斜体、下划线）】
2. 【功能2】: 【如 支持插入图片和链接】
3. 【功能3】: 【如 支持表格编辑】
4. 【功能4】: 【如 支持代码块】
5. 【功能5】: 【如 支持撤销/重做】

#### Signature 签名板
1. 【功能1】: 【如 手写签名输入】
2. 【功能2】: 【如 清除签名】
3. 【功能3】: 【如 保存为图片】
4. 【功能4】: 【如 触摸屏支持】

#### PDF Viewer 查看器
1. 【功能1】: 【如 PDF文档预览】
2. 【功能2】: 【如 翻页功能】
3. 【功能3】: 【如 缩放功能】
4. 【功能4】: 【如 下载PDF】
5. 【功能5】: 【如 打印PDF】

#### Ace Editor 代码编辑器
1. 【功能1】: 【如 语法高亮】
2. 【功能2】: 【如 代码自动补全】
3. 【功能3】: 【如 代码折叠】
4. 【功能4】: 【如 多种语言支持】
5. 【功能5】: 【如 主题切换】

### 编辑器配置

#### 工具栏配置（Html编辑器）
```javascript
toolbar: [
    // 样式组
    ['style', ['style']],
    // 字体组
    ['font', ['bold', 'italic', 'underline', 'strikethrough']],
    ['fontsize', ['fontsize']],
    ['color', ['color']],
    // 段落组
    ['para', ['ul', 'ol', 'paragraph', 'height']],
    // 插入组
    ['insert', ['link', 'picture', 'video', 'table', 'hr']],
    // 其他
    ['view', ['fullscreen', 'codeview']],
]
```

#### 编辑器选项
- 高度: 【如 300px / 自适应】
- 最大高度: 【如 600px / 无限制】
- 占位符: 【如 "请输入内容..."】
- 焦点: 【是否自动聚焦】
- 禁用: 【只读模式】

### 内容处理

#### Html 字段
- 内容格式: 【HTML字符串】
- 消毒处理: 【是否清理危险标签】
- 样式内联: 【是否内联CSS】
- 图片处理: 【Base64 / URL】

#### Signature 字段
- 输出格式: 【PNG / JPG / SVG】
- 图片质量: 【0.0 - 1.0】
- 笔触颜色: 【如 黑色】
- 笔触粗细: 【如 2px】
- 背景色: 【如 白色 / 透明】

#### PDF Viewer 字段
- 预览模式: 【内嵌 / 弹窗】
- 初始页码: 【第1页】
- 初始缩放: 【适应页面 / 100%】
- 工具栏: 【显示 / 隐藏】

#### Ace Editor 字段
- 语言模式: 【python / javascript / xml / css / sql】
- 主题: 【monokai / github / twilight】
- 字体大小: 【12px / 14px】
- Tab大小: 【2 / 4 / 8 空格】
- 自动换行: 【是 / 否】

### Props 配置

#### 标准Props（自动继承）
```javascript
// 通过 standardFieldProps 自动获得
- record: Object      // 当前记录
- name: String        // 字段名称
- type: String        // 字段类型
- readonly: Boolean   // 是否只读
- value: String       // 字段值（HTML/Base64/文本）
- update: Function   // 更新回调
```

#### 自定义Props（Html编辑器）
```javascript
- height: Number             // 【编辑器高度】
- minHeight: Number          // 【最小高度】
- maxHeight: Number          // 【最大高度】
- toolbar: Array             // 【工具栏配置】
- placeholder: String        // 【占位符】
- sanitize: Boolean          // 【是否清理HTML】
- allowImages: Boolean       // 【是否允许图片】
- allowTables: Boolean       // 【是否允许表格】
- allowVideos: Boolean       // 【是否允许视频】
```

#### 自定义Props（Signature）
```javascript
- penColor: String           // 【笔触颜色】
- penWidth: Number           // 【笔触粗细】
- backgroundColor: String    // 【背景颜色】
- canvasWidth: Number        // 【画布宽度】
- canvasHeight: Number       // 【画布高度】
```

#### 自定义Props（Ace Editor）
```javascript
- mode: String               // 【语言模式】
- theme: String              // 【编辑器主题】
- fontSize: Number           // 【字体大小】
- tabSize: Number            // 【Tab大小】
- showLineNumbers: Boolean   // 【显示行号】
- showGutter: Boolean        // 【显示边栏】
- highlightActiveLine: Boolean  // 【高亮当前行】
```

#### Widget 使用示例

**Html 编辑器**:
```xml
<field name="description" 
       widget="rich_text_editor_field"
       options="{
           'height': 400,
           'toolbar': 'full',
           'allow_images': true
       }"/>
```

**Signature 签名板**:
```xml
<field name="signature" 
       widget="signature_field"
       options="{
           'pen_color': '#000000',
           'pen_width': 2,
           'canvas_height': 200
       }"/>
```

**Ace 代码编辑器**:
```xml
<field name="code" 
       widget="ace_editor_field"
       options="{
           'mode': 'python',
           'theme': 'monokai',
           'show_line_numbers': true
       }"/>
```

### 交互逻辑

#### 加载状态
- 显示: 【加载指示器】
- 第三方库加载: 【CDN / 本地】
- 加载失败: 【错误提示】

#### 编辑状态
- 自动保存: 【是否启用】
- 保存延迟: 【如 500ms debounce】
- 变更检测: 【onChange / onBlur】
- 撤销/重做: 【是否支持】

#### 只读模式

**Html 字段**:
- 显示: 【渲染HTML内容】
- 样式: 【应用内容样式】
- 链接: 【可点击】

**Signature 字段**:
- 显示: 【显示签名图片】
- 点击: 【查看大图（可选）】

**PDF Viewer**:
- 显示: 【PDF预览】
- 操作: 【翻页、缩放、下载】

**Ace Editor**:
- 显示: 【语法高亮的代码】
- 编辑: 【禁用】

#### 错误处理
- 加载失败: 【显示错误信息】
- 保存失败: 【重试机制】
- 验证失败: 【错误提示】

### 样式需求

#### 编辑器容器
- 边框: 【1px solid #ccc】
- 圆角: 【4px】
- 阴影: 【可选】
- 背景: 【白色】

#### 工具栏
- 位置: 【顶部/底部/浮动】
- 样式: 【按钮组】
- 响应式: 【移动端简化】

#### 内容区域
- 最小高度: 【200px】
- 滚动条: 【自动显示】
- 字体: 【系统默认 / 自定义】

#### 响应式
- 桌面: 【完整功能】
- 平板: 【适度简化】
- 手机: 【移动优化、触摸支持】

### 特殊功能（可选）
- [ ] 全屏模式
- [ ] 源代码编辑
- [ ] 图片拖拽上传
- [ ] @ 提及用户
- [ ] 表情符号选择器
- [ ] 协同编辑（实时）
- [ ] 版本历史
- [ ] 导出功能（PDF/Word）
- [ ] 【其他】

## 技术要求

### 文件生成

请生成以下文件：

#### 1. JS 组件文件（Html编辑器）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
import { Wysiwyg } from "@web_editor/js/wysiwyg/wysiwyg";

export class RichTextEditorField extends Component {
    setup() {
        this.wysiwygRef = useRef("wysiwyg");
        
        onMounted(async () => {
            await this._createEditor();
        });
        
        onWillUnmount(() => {
            if (this.wysiwyg) {
                this.wysiwyg.destroy();
            }
        });
    }
    
    async _createEditor() {
        this.wysiwyg = new Wysiwyg(this, {
            value: this.props.value || '',
            height: this.props.height || 300,
            toolbar: this._getToolbarConfig(),
            callbacks: {
                onChange: (contents) => {
                    this.props.update(contents);
                }
            }
        });
        
        await this.wysiwyg.attachTo(this.wysiwygRef.el);
    }
    
    _getToolbarConfig() {
        // 根据 props 返回工具栏配置
        if (this.props.toolbar === 'full') {
            return [
                ['style', ['style']],
                ['font', ['bold', 'italic', 'underline']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link', 'picture', 'table']],
                ['view', ['fullscreen', 'codeview']],
            ];
        }
        return this.props.toolbar || [];
    }
}
```

#### 2. JS 组件文件（Signature）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
import SignaturePad from 'signature_pad';

export class SignatureField extends Component {
    setup() {
        this.canvasRef = useRef("canvas");
        
        onMounted(() => {
            this._initSignaturePad();
        });
        
        onWillUnmount(() => {
            if (this.signaturePad) {
                this.signaturePad.off();
            }
        });
    }
    
    _initSignaturePad() {
        const canvas = this.canvasRef.el;
        
        // 设置画布大小
        canvas.width = this.props.canvasWidth || canvas.offsetWidth;
        canvas.height = this.props.canvasHeight || 200;
        
        this.signaturePad = new SignaturePad(canvas, {
            backgroundColor: this.props.backgroundColor || 'rgb(255, 255, 255)',
            penColor: this.props.penColor || '#000000',
            minWidth: this.props.penWidth || 1,
            maxWidth: this.props.penWidth || 2,
            onEnd: () => this._saveSignature(),
        });
        
        // 加载现有签名
        if (this.props.value) {
            this.signaturePad.fromDataURL(this._getDataURL());
        }
    }
    
    _saveSignature() {
        if (this.signaturePad.isEmpty()) {
            this.props.update(false);
        } else {
            const dataURL = this.signaturePad.toDataURL('image/png');
            const base64 = dataURL.split(',')[1];
            this.props.update(base64);
        }
    }
    
    clear() {
        this.signaturePad.clear();
        this.props.update(false);
    }
    
    _getDataURL() {
        return `data:image/png;base64,${this.props.value}`;
    }
}
```

#### 3. JS 组件文件（Ace Editor）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class AceEditorField extends Component {
    setup() {
        this.editorRef = useRef("editor");
        
        onMounted(async () => {
            await this._initAceEditor();
        });
        
        onWillUnmount(() => {
            if (this.editor) {
                this.editor.destroy();
            }
        });
    }
    
    async _initAceEditor() {
        // 加载 Ace Editor 库
        await loadJS('/web/static/lib/ace/ace.js');
        
        const editor = ace.edit(this.editorRef.el);
        
        // 设置主题和模式
        editor.setTheme(`ace/theme/${this.props.theme || 'monokai'}`);
        editor.session.setMode(`ace/mode/${this.props.mode || 'python'}`);
        
        // 配置选项
        editor.setOptions({
            fontSize: this.props.fontSize || 14,
            showLineNumbers: this.props.showLineNumbers !== false,
            showGutter: this.props.showGutter !== false,
            highlightActiveLine: this.props.highlightActiveLine !== false,
            tabSize: this.props.tabSize || 4,
            useSoftTabs: true,
        });
        
        // 设置值
        editor.setValue(this.props.value || '', -1);
        
        // 设置只读
        editor.setReadOnly(this.props.readonly);
        
        // 监听变化
        editor.session.on('change', () => {
            if (!this.props.readonly) {
                this.props.update(editor.getValue());
            }
        });
        
        this.editor = editor;
    }
}
```

#### 4. XML 模板文件（Html编辑器）
```xml
<t t-name="【模块】.RichTextEditorField" owl="1">
    <div class="o_field_html">
        <div t-if="props.readonly" 
             class="o_readonly"
             t-out="props.value"/>
        <div t-else="" 
             class="o_wysiwyg_wrapper"
             t-ref="wysiwyg"/>
    </div>
</t>
```

#### 5. XML 模板文件（Signature）
```xml
<t t-name="【模块】.SignatureField" owl="1">
    <div class="o_field_signature">
        <div t-if="props.readonly" class="o_readonly">
            <img t-if="props.value"
                 t-att-src="'data:image/png;base64,' + props.value"
                 class="o_signature_image"/>
            <span t-else="" class="text-muted">无签名</span>
        </div>
        <div t-else="" class="o_signature_pad">
            <canvas t-ref="canvas" class="o_signature_canvas"/>
            <div class="o_signature_controls">
                <button type="button"
                        class="btn btn-sm btn-secondary"
                        t-on-click="clear">
                    <i class="fa fa-eraser"/> 清除
                </button>
            </div>
        </div>
    </div>
</t>
```

#### 6. SCSS 样式文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.scss`

```scss
.o_field_html {
    .o_wysiwyg_wrapper {
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        min-height: 300px;
    }
    
    .o_readonly {
        padding: 0.5rem;
        
        // 内容样式
        img {
            max-width: 100%;
            height: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            
            td, th {
                border: 1px solid #dee2e6;
                padding: 0.5rem;
            }
        }
    }
}

.o_field_signature {
    .o_signature_pad {
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        padding: 0.5rem;
        
        .o_signature_canvas {
            border: 1px dashed #adb5bd;
            cursor: crosshair;
            display: block;
            background-color: #fff;
        }
        
        .o_signature_controls {
            margin-top: 0.5rem;
            text-align: right;
        }
    }
    
    .o_signature_image {
        max-width: 100%;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
    }
}
```

### 参考实现

请参考以下 Odoo 标准字段实现和第三方库：

**Html Field**: `@web/views/fields/html/html_field`
**Wysiwyg Editor**: `@web_editor/js/wysiwyg/wysiwyg`
**Ace Editor**: `@web/views/fields/ace/ace_field`
**Signature Pad**: https://github.com/szimek/signature_pad

### 第三方库集成

#### 库文件加载
```javascript
// 方法1: 通过 assets.xml 加载
<script src="/web/static/lib/ace/ace.js"/>

// 方法2: 动态加载
await loadJS('/web/static/lib/ace/ace.js');
await loadCSS('/web/static/lib/ace/ace.css');
```

#### 库初始化最佳实践
- 在 `onMounted` 中初始化
- 检查库是否已加载
- 处理加载失败的情况
- 在 `onWillUnmount` 中清理资源

### 代码规范

- [ ] 正确加载和初始化第三方库
- [ ] 处理库加载失败情况
- [ ] 在组件销毁时清理资源
- [ ] 实现防抖保存（debounce）
- [ ] 处理只读模式
- [ ] 添加加载状态显示
- [ ] 添加错误处理
- [ ] 添加完整注释

### 使用示例

#### Python 模型定义

```python
from odoo import models, fields

class YourModel(models.Model):
    _name = 'your.model'
    
    # Html字段
    description = fields.Html(string='Description')
    
    # 签名字段
    signature = fields.Binary(string='Signature', attachment=True)
    
    # 代码字段
    code = fields.Text(string='Python Code')
```

#### 视图使用

请在生成代码后提供完整的视图使用示例。

## 额外说明

【在此添加任何额外的说明、约束或特殊要求】

- 使用哪个第三方库？版本要求？
- 工具栏需要哪些功能？
- 是否需要自动保存？
- 是否需要全屏模式？
- 是否需要协同编辑？
- 性能要求（大文件处理）？

## 期望输出

请生成：
1. 完整的 JavaScript 组件代码
2. 完整的 XML 模板代码
3. 完整的 SCSS 样式代码
4. assets.xml 注册代码（包括第三方库）
5. 使用文档和示例
6. 第三方库集成说明
7. 性能优化建议
8. 测试建议

确保代码：
- 完全符合 Odoo 16.0+ OWL 框架规范
- 正确集成第三方库
- 处理库加载和初始化
- 优雅处理错误情况
- 在组件销毁时清理资源
````

---

## 🎨 快速示例

### 示例1：产品描述编辑器

```text
**组件名称**: ProductDescriptionField
**技术名称**: product_description_field
**字段类型**: Html
**显示名称**: "产品描述编辑器"

核心功能:
1. 富文本编辑
2. 图片上传和管理
3. 表格插入
4. 全屏编辑模式

工具栏配置:
- 基础格式: 粗体、斜体、下划线
- 段落: 无序列表、有序列表
- 插入: 图片、链接、表格
- 视图: 全屏、源代码

Widget使用:
<field name="description" widget="product_description_field"
       options="{'height': 400, 'allow_images': true, 'toolbar': 'full'}"/>
```

### 示例2：合同签名字段

```text
**组件名称**: ContractSignatureField
**技术名称**: contract_signature_field
**字段类型**: Signature
**显示名称**: "电子签名"

核心功能:
1. 触摸屏/鼠标手写签名
2. 清除重签
3. 保存为PNG图片
4. 移动端优化

配置:
- 画布大小: 600x200
- 笔触颜色: 黑色
- 笔触粗细: 2px
- 背景: 白色

Widget使用:
<field name="signature" widget="contract_signature_field"
       options="{'canvas_width': 600, 'canvas_height': 200}"/>
```

### 示例3：Python代码编辑器

```text
**组件名称**: PythonCodeField
**技术名称**: python_code_field
**字段类型**: Ace Editor
**显示名称**: "Python代码编辑器"

核心功能:
1. Python语法高亮
2. 代码自动补全
3. 行号显示
4. 代码折叠
5. 错误提示

配置:
- 语言: Python
- 主题: Monokai
- 字体大小: 14px
- Tab大小: 4空格

Widget使用:
<field name="code" widget="python_code_field"
       options="{'mode': 'python', 'theme': 'monokai', 'show_line_numbers': true}"/>
```

---

## 📚 常见问题

### Q1: 如何处理大型HTML内容？

```javascript
// 使用防抖减少更新频率
import { debounce } from "@web/core/utils/timing";

setup() {
    this.debouncedUpdate = debounce(this.props.update, 500);
    
    // 在编辑器变化时使用
    onChange: (contents) => {
        this.debouncedUpdate(contents);
    }
}
```

### Q2: 如何自定义工具栏？

```javascript
_getCustomToolbar() {
    return [
        ['style', ['bold', 'italic', 'underline']],
        ['font', ['strikethrough', 'superscript', 'subscript']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview', 'help']],
    ];
}
```

### Q3: 如何处理签名板的响应式？

```javascript
onMounted() {
    this._initSignaturePad();
    
    // 监听窗口大小变化
    this.resizeObserver = new ResizeObserver(() => {
        this._resizeCanvas();
    });
    this.resizeObserver.observe(this.canvasRef.el.parentElement);
}

_resizeCanvas() {
    const canvas = this.canvasRef.el;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    
    // 重新加载签名
    if (this.props.value) {
        this.signaturePad.fromDataURL(this._getDataURL());
    }
}
```

### Q4: 如何实现代码验证？

```javascript
// Ace Editor 中添加语法检查
_initAceEditor() {
    // ... 初始化代码 ...
    
    // 添加Python语法检查
    editor.session.on('change', async () => {
        const code = editor.getValue();
        const errors = await this._validatePythonCode(code);
        
        // 设置标注
        editor.session.setAnnotations(errors.map(err => ({
            row: err.line,
            column: err.column,
            text: err.message,
            type: 'error'
        })));
    });
}

async _validatePythonCode(code) {
    // 调用后端验证接口
    return await this.orm.call('your.model', 'validate_python_code', [code]);
}
```

---

## 🔗 相关资源

- [Html Field 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/html)
- [Wysiwyg Editor](https://github.com/odoo/odoo/tree/16.0/addons/web_editor)
- [Ace Editor 官方文档](https://ace.c9.io/)
- [Signature Pad](https://github.com/szimek/signature_pad)
- [PDF.js](https://mozilla.github.io/pdf.js/)

---

**版本历史**:
- v1.0 (2026-01-23): 初始版本
