# Odoo 16 tools/pdf.py PDF处理工具分析文档

## 概述

`odoo/tools/pdf.py` 是Odoo框架中专门处理PDF文档的核心工具模块。该模块基于PyPDF2和ReportLab库，提供了PDF文档的合并、旋转、水印添加、附件管理、PDF/A转换等企业级PDF处理功能，特别适用于报表生成、文档管理和归档系统。

**文件位置**: `odoo/tools/pdf.py`  
**代码行数**: 456行  
**主要依赖**: PyPDF2, ReportLab, PIL, fontTools  
**核心功能**: PDF操作、PDF/A合规、附件管理、水印处理

## 目录

1. [依赖和兼容性处理](#依赖和兼容性处理)
2. [常量和配置](#常量和配置)
3. [核心类定义](#核心类定义)
4. [基础PDF操作函数](#基础pdf操作函数)
5. [PDF水印和Banner功能](#pdf水印和banner功能)
6. [OdooPdfFileReader类](#odoopdffilereader类)
7. [OdooPdfFileWriter类](#odoopdffilewriter类)
8. [PDF/A合规处理](#pdfa合规处理)
9. [附件管理功能](#附件管理功能)
10. [最佳实践和应用场景](#最佳实践和应用场景)

---

## 依赖和兼容性处理

### PyPDF2版本兼容性
```python
try:
    # PyPDF2 > 2.0版本的类重命名处理
    from PyPDF2 import PdfReader
    import PyPDF2
    
    # 兼容性包装类
    class PdfFileReader(PdfReader):
        def __init__(self, *args, **kwargs):
            if "strict" not in kwargs and len(args) < 2:
                kwargs["strict"] = True  # 维持默认行为
            kwargs = {k:v for k, v in kwargs.items() if k in ('strict', 'stream')}
            super().__init__(*args, **kwargs)
    
    PyPDF2.PdfFileReader = PdfFileReader
    from PyPDF2 import PdfFileWriter, PdfFileReader
    PdfFileWriter._addObject = PdfFileWriter._add_object
except ImportError:
    from PyPDF2 import PdfFileWriter, PdfFileReader
```
**用途**: 处理PyPDF2库版本间的API变化，确保向后兼容性。

### 可选依赖处理
```python
try:
    from fontTools.ttLib import TTFont
except ImportError:
    TTFont = None
```
**用途**: fontTools用于PDF/A字体处理，不是必需依赖。

---

## 常量和配置

### 时间格式和正则表达式
```python
DEFAULT_PDF_DATETIME_FORMAT = "D:%Y%m%d%H%M%S+00'00'"
REGEX_SUBTYPE_UNFORMATED = re.compile(r'^\w+/[\w-]+$')
REGEX_SUBTYPE_FORMATED = re.compile(r'^/\w+#2F[\w-]+$')
```

**说明**:
- `DEFAULT_PDF_DATETIME_FORMAT`: PDF标准日期时间格式
- `REGEX_SUBTYPE_UNFORMATED`: 未格式化MIME类型匹配（如"text/xml"）
- `REGEX_SUBTYPE_FORMATED`: PDF格式化MIME类型匹配（如"/text#2Fxml"）

### Dictionary对象增强
```python
def _unwrapping_get(self, key, default=None):
    try:
        return self[key]
    except KeyError:
        return default

DictionaryObject.get = _unwrapping_get
```
**用途**: 为PyPDF2的DictionaryObject添加标准的get方法，确保值的正确解包。

---

## 核心类定义

### `BrandedFileWriter` - Odoo品牌PDF写入器
```python
class BrandedFileWriter(PdfFileWriter):
    def __init__(self):
        super().__init__()
        self.addMetadata({
            '/Creator': "Odoo",
            '/Producer': "Odoo",
        })
```

**功能**: 自动为生成的PDF添加Odoo创建者信息
**用途**: 品牌化所有通过Odoo生成的PDF文档

---

## 基础PDF操作函数

### `merge_pdf(pdf_data)`
**功能**: 合并多个PDF文档为一个文档

- **参数**: `pdf_data` - PDF数据字符串列表
- **返回**: 合并后的PDF数据字符串
- **注意**: 不会合并附件

**实现逻辑**:
```python
def merge_pdf(pdf_data):
    writer = PdfFileWriter()
    for document in pdf_data:
        reader = PdfFileReader(io.BytesIO(document), strict=False)
        for page in range(0, reader.getNumPages()):
            writer.addPage(reader.getPage(page))
    with io.BytesIO() as _buffer:
        writer.write(_buffer)
        return _buffer.getvalue()
```

**使用示例**:
```python
# 合并多个PDF文件
pdf1_data = open('file1.pdf', 'rb').read()
pdf2_data = open('file2.pdf', 'rb').read()
pdf3_data = open('file3.pdf', 'rb').read()

merged_pdf = merge_pdf([pdf1_data, pdf2_data, pdf3_data])

# 保存合并结果
with open('merged.pdf', 'wb') as f:
    f.write(merged_pdf)
```

### `rotate_pdf(pdf)`
**功能**: 顺时针旋转PDF页面90度

- **参数**: `pdf` - 要旋转的PDF数据
- **返回**: 旋转后的PDF数据
- **注意**: 不会复制附件

**实现逻辑**:
```python
def rotate_pdf(pdf):
    writer = PdfFileWriter()
    reader = PdfFileReader(io.BytesIO(pdf), strict=False)
    for page in range(0, reader.getNumPages()):
        page = reader.getPage(page)
        page.rotateClockwise(90)
        writer.addPage(page)
    with io.BytesIO() as _buffer:
        writer.write(_buffer)
        return _buffer.getvalue()
```

**使用示例**:
```python
# 旋转PDF文档
original_pdf = open('document.pdf', 'rb').read()
rotated_pdf = rotate_pdf(original_pdf)

# 保存旋转结果
with open('rotated_document.pdf', 'wb') as f:
    f.write(rotated_pdf)
```

### `to_pdf_stream(attachment)`
**功能**: 将附件转换为PDF流

- **参数**: `attachment` - 附件对象（需有mimetype和raw属性）
- **返回**: PDF格式的BytesIO流
- **支持格式**: PDF文档、图像文件

**转换逻辑**:
```python
def to_pdf_stream(attachment) -> io.BytesIO:
    stream = io.BytesIO(attachment.raw)
    if attachment.mimetype == 'application/pdf':
        return stream
    elif attachment.mimetype.startswith('image'):
        output_stream = io.BytesIO()
        Image.open(stream).convert("RGB").save(output_stream, format="pdf")
        return output_stream
    _logger.warning("mimetype (%s) not recognized for %s", attachment.mimetype, attachment)
```

**使用示例**:
```python
class MockAttachment:
    def __init__(self, data, mimetype):
        self.raw = data
        self.mimetype = mimetype

# 图像转PDF
with open('image.jpg', 'rb') as f:
    image_data = f.read()
    
attachment = MockAttachment(image_data, 'image/jpeg')
pdf_stream = to_pdf_stream(attachment)

# 保存转换结果
with open('converted.pdf', 'wb') as f:
    f.write(pdf_stream.getvalue())
```

---

## PDF水印和Banner功能

### `add_banner(pdf_stream, text=None, logo=False, thickness=2 * cm)`
**功能**: 在PDF右上角添加斜向水印横幅

- **参数**:
  - `pdf_stream`: PDF流
  - `text`: 横幅文字
  - `logo`: 是否显示Odoo标志
  - `thickness`: 横幅厚度（默认2cm）
- **返回**: 添加横幅后的PDF流

**视觉效果**:
- 45度倾斜的紫色横幅
- 白色文字，右对齐
- 可选的Odoo标志
- 透明度0.8的紫色背景

**实现细节**:
```python
def add_banner(pdf_stream, text=None, logo=False, thickness=2 * cm):
    old_pdf = PdfFileReader(pdf_stream, strict=False, overwriteWarnings=False)
    packet = io.BytesIO()
    can = canvas.Canvas(packet)
    odoo_logo = Image.open(file_open('base/static/img/main_partner-image.png', mode='rb'))
    odoo_color = colors.Color(113 / 255, 75 / 255, 103 / 255, 0.8)

    for p in range(old_pdf.getNumPages()):
        page = old_pdf.getPage(p)
        width = float(abs(page.mediaBox.getWidth()))
        height = float(abs(page.mediaBox.getHeight()))

        can.translate(width, height)
        can.rotate(-45)

        # 绘制横幅路径
        path = can.beginPath()
        path.moveTo(-width, -thickness)
        path.lineTo(-width, -2 * thickness)
        path.lineTo(width, -2 * thickness)
        path.lineTo(width, -thickness)
        can.setFillColor(odoo_color)
        can.drawPath(path, fill=1, stroke=False)

        # 添加文字和标志
        can.setFontSize(10)
        can.setFillColor(colors.white)
        can.drawRightString(0.75 * thickness, -1.45 * thickness, text)
        if logo:
            can.drawImage(
                ImageReader(odoo_logo), 0.25 * thickness, -2.05 * thickness, 
                40, 40, mask='auto', preserveAspectRatio=True
            )
        can.showPage()
```

**使用示例**:
```python
# 添加带文字和标志的横幅
with open('document.pdf', 'rb') as f:
    pdf_data = f.read()

pdf_stream = io.BytesIO(pdf_data)
banner_stream = add_banner(
    pdf_stream, 
    text="CONFIDENTIAL", 
    logo=True, 
    thickness=1.5 * cm
)

# 保存结果
with open('watermarked.pdf', 'wb') as f:
    f.write(banner_stream.getvalue())
```

---

## OdooPdfFileReader类

### 继承和增强
```python
class OdooPdfFileReader(PdfFileReader):
    # 重写以支持多个嵌入文件的管理
```

### `getAttachments(self)`
**功能**: 提取PDF中的嵌入附件

- **返回**: 生成器，产生(文件名, 文件数据)元组
- **特性**: 
  - 自动解密owner-encrypted PDF
  - 处理格式错误的PDF
  - 支持多个附件

**提取逻辑**:
```python
def getAttachments(self):
    if self.isEncrypted:
        # 尝试用空密码解密owner-encrypted PDF
        self.decrypt('')

    try:
        file_path = self.trailer["/Root"].get("/Names", {}).get("/EmbeddedFiles", {}).get("/Names")
        
        if not file_path:
            return []
            
        for i in range(0, len(file_path), 2):
            attachment = file_path[i+1].getObject()
            yield (attachment["/F"], attachment["/EF"]["/F"].getObject().getData())
    except Exception:
        # 处理格式错误的PDF
        return []
```

**使用示例**:
```python
# 提取PDF附件
with open('document_with_attachments.pdf', 'rb') as f:
    pdf_data = f.read()

reader = OdooPdfFileReader(io.BytesIO(pdf_data))
attachments = list(reader.getAttachments())

for filename, data in attachments:
    print(f"发现附件: {filename}, 大小: {len(data)} bytes")
    
    # 保存附件
    with open(f"extracted_{filename}", 'wb') as attachment_file:
        attachment_file.write(data)
```

---

## OdooPdfFileWriter类

### 初始化和属性
```python
class OdooPdfFileWriter(PdfFileWriter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._reader = None
        self.is_pdfa = False
```

**新增属性**:
- `_reader`: 源PDF读取器引用
- `is_pdfa`: PDF/A合规状态标志

### `addAttachment(self, name, data, subtype=None)`
**功能**: 向PDF添加附件，支持PDF/A规则

- **参数**:
  - `name`: 附件名称
  - `data`: 附件数据
  - `subtype`: MIME类型（PDF/A需要）
- **特性**: 自动格式化MIME类型，支持多附件

**MIME类型处理**:
```python
adapted_subtype = subtype
if subtype:
    # 将未格式化的MIME类型转换为PDF有效格式
    if REGEX_SUBTYPE_UNFORMATED.match(subtype):
        adapted_subtype = '/' + subtype.replace('/', '#2F')
    
    if not REGEX_SUBTYPE_FORMATED.match(adapted_subtype):
        _logger.warning("尝试添加错误subtype '%s'的附件，将忽略subtype", subtype)
        adapted_subtype = ''
```

**使用示例**:
```python
# 创建带附件的PDF
writer = OdooPdfFileWriter()

# 添加XML附件
xml_data = b'<?xml version="1.0"?><root>test</root>'
writer.addAttachment(
    name="metadata.xml", 
    data=xml_data, 
    subtype="text/xml"  # 自动转换为 "/text#2Fxml"
)

# 添加文本附件
text_data = b"This is a text attachment"
writer.addAttachment(
    name="readme.txt", 
    data=text_data, 
    subtype="text/plain"
)

# 保存PDF
with open('pdf_with_attachments.pdf', 'wb') as f:
    writer.write(f)
```

### `embed_odoo_attachment(self, attachment, subtype=None)`
**功能**: 嵌入Odoo附件对象

- **参数**:
  - `attachment`: Odoo附件对象
  - `subtype`: 可选的MIME类型覆盖
- **便利性**: 直接使用attachment的name、raw和mimetype属性

```python
def embed_odoo_attachment(self, attachment, subtype=None):
    assert attachment, "embed_odoo_attachment cannot be called without attachment."
    self.addAttachment(
        attachment.name, 
        attachment.raw, 
        subtype=subtype or attachment.mimetype
    )
```

---

## PDF/A合规处理

### `convert_to_pdfa(self)`
**功能**: 将PDF转换为PDF/A-3合规文档

**PDF/A要求**:
1. PDF版本1.7
2. 特定的文件头格式
3. 文档ID
4. 颜色配置文件（sRGB）
5. 字体字形宽度一致性
6. 输出意图声明

**实现步骤**:

#### 1. 设置PDF/A头部
```python
self._header = b"%PDF-1.7\n%\xFF\xFF\xFF\xFF"
```

#### 2. 添加文档ID
```python
pdf_id = ByteStringObject(md5(self._reader.stream.getvalue()).digest())
self._ID = ArrayObject((pdf_id, pdf_id))
```

#### 3. 嵌入sRGB颜色配置文件
```python
with file_open('tools/data/files/sRGB2014.icc', mode='rb') as icc_profile:
    icc_profile_file_data = compress(icc_profile.read())

icc_profile_stream_obj = DecodedStreamObject()
icc_profile_stream_obj.setData(icc_profile_file_data)
icc_profile_stream_obj.update({
    NameObject("/Filter"): NameObject("/FlateDecode"),
    NameObject("/N"): NumberObject(3),
    NameObject("/Length"): NameObject(str(len(icc_profile_file_data))),
})
```

#### 4. 字体字形宽度校正
```python
if TTFont:
    fonts = {}
    # 浏览所有页面，获取字体引用
    for page in pages:
        for font in page.getObject()['/Resources']['/Font'].values():
            for descendant in font.getObject()['/DescendantFonts']:
                fonts[descendant.idnum] = descendant.getObject()

    # 重写宽度数组
    for font in fonts.values():
        font_file = font['/FontDescriptor']['/FontFile2']
        stream = io.BytesIO(decompress(font_file._data))
        ttfont = TTFont(stream)
        font_upm = ttfont['head'].unitsPerEm
        glyphs = ttfont.getGlyphSet()._hmtx.metrics
        glyph_widths = []
        
        for key, values in glyphs.items():
            if key[:5] == 'glyph':
                glyph_widths.append(NumberObject(round(1000.0 * values[0] / font_upm)))

        font[NameObject('/W')] = ArrayObject([NumberObject(1), ArrayObject(glyph_widths)])
```

### `add_file_metadata(self, metadata_content)`
**功能**: 添加XMP元数据到PDF

- **参数**: `metadata_content` - 元数据内容字节
- **格式**: 自动添加XMP包装头和尾

**XMP包装**:
```python
header = b'<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>'
footer = b'<?xpacket end="w"?>'
metadata = b'%s%s%s' % (header, metadata_content, footer)
```

**使用示例**:
```python
# 创建PDF/A合规文档
with open('source.pdf', 'rb') as f:
    pdf_data = f.read()

reader = OdooPdfFileReader(io.BytesIO(pdf_data))
writer = OdooPdfFileWriter()
writer.cloneReaderDocumentRoot(reader)

# 复制所有页面
for page_num in range(reader.getNumPages()):
    writer.addPage(reader.getPage(page_num))

# 转换为PDF/A
writer.convert_to_pdfa()

# 添加元数据
metadata_xml = b'''<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="">
        <dc:title>Document Title</dc:title>
    </rdf:Description>
</rdf:RDF>'''

writer.add_file_metadata(metadata_xml)

# 保存PDF/A文档
with open('pdfa_compliant.pdf', 'wb') as f:
    writer.write(f)
```

---

## 附件管理功能

### `_create_attachment_object(self, attachment)`
**功能**: 创建PDF附件对象

- **参数**: attachment字典，包含filename、content、subtype
- **返回**: PyPDF2附件对象引用

**附件对象结构**:
```python
file_entry = DecodedStreamObject()
file_entry.setData(attachment['content'])
file_entry.update({
    NameObject("/Type"): NameObject("/EmbeddedFile"),
    NameObject("/Params"): DictionaryObject({
        NameObject('/CheckSum'): createStringObject(md5(attachment['content']).hexdigest()),
        NameObject('/ModDate'): createStringObject(datetime.now().strftime(DEFAULT_PDF_DATETIME_FORMAT)),
        NameObject('/Size'): NameObject(f"/{len(attachment['content'])}"),
    }),
})

if attachment.get('subtype'):
    file_entry.update({
        NameObject("/Subtype"): NameObject(attachment['subtype']),
    })

# 文件规范对象
filespec_object = DictionaryObject({
    NameObject("/AFRelationship"): NameObject("/Data"),
    NameObject("/Type"): NameObject("/Filespec"),
    NameObject("/F"): filename_object,
    NameObject("/EF"): DictionaryObject({
        NameObject("/F"): file_entry_object,
        NameObject('/UF'): file_entry_object,
    }),
    NameObject("/UF"): filename_object,
})
```

**安全特性**:
- MD5校验和验证
- 修改日期记录
- 文件大小记录
- 关系类型标识

---

## 最佳实践和应用场景

### 1. 报表合并和归档
```python
def create_monthly_report_archive(report_pdfs, month, year):
    """创建月度报表归档"""
    # 合并所有报表
    merged_pdf = merge_pdf(report_pdfs)
    
    # 创建PDF/A归档版本
    reader = OdooPdfFileReader(io.BytesIO(merged_pdf))
    writer = OdooPdfFileWriter()
    writer.cloneReaderDocumentRoot(reader)
    
    # 复制页面
    for page_num in range(reader.getNumPages()):
        writer.addPage(reader.getPage(page_num))
    
    # 转换为PDF/A用于长期归档
    writer.convert_to_pdfa()
    
    # 添加元数据
    metadata = f'''<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                           xmlns:dc="http://purl.org/dc/elements/1.1/">
        <rdf:Description rdf:about="">
            <dc:title>Monthly Report Archive {month}/{year}</dc:title>
            <dc:subject>Financial Reports</dc:subject>
            <dc:creator>Odoo ERP System</dc:creator>
        </rdf:Description>
    </rdf:RDF>'''.encode('utf-8')
    
    writer.add_file_metadata(metadata)
    
    # 添加原始数据作为附件
    for i, pdf_data in enumerate(report_pdfs):
        writer.addAttachment(
            name=f"report_{i+1}.pdf",
            data=pdf_data,
            subtype="application/pdf"
        )
    
    # 保存归档文件
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()
```

### 2. 发票处理和水印
```python
def process_invoice_pdf(invoice_data, status="DRAFT"):
    """处理发票PDF，添加状态水印"""
    pdf_stream = io.BytesIO(invoice_data)
    
    # 根据状态添加不同颜色的横幅
    status_config = {
        "DRAFT": {"text": "DRAFT", "logo": False},
        "PAID": {"text": "PAID", "logo": True},
        "OVERDUE": {"text": "OVERDUE", "logo": False},
    }
    
    if status in status_config:
        config = status_config[status]
        watermarked_stream = add_banner(
            pdf_stream,
            text=config["text"],
            logo=config["logo"]
        )
        return watermarked_stream.getvalue()
    
    return invoice_data

def create_invoice_package(invoice_pdf, supporting_docs):
    """创建包含支持文档的发票包"""
    reader = OdooPdfFileReader(io.BytesIO(invoice_pdf))
    writer = OdooPdfFileWriter()
    writer.cloneReaderDocumentRoot(reader)
    
    # 复制发票页面
    for page_num in range(reader.getNumPages()):
        writer.addPage(reader.getPage(page_num))
    
    # 添加支持文档作为附件
    for doc_name, doc_data, doc_type in supporting_docs:
        writer.addAttachment(
            name=doc_name,
            data=doc_data,
            subtype=doc_type
        )
    
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()
```

### 3. 文档转换和标准化
```python
def standardize_document_collection(documents):
    """标准化文档集合为统一PDF格式"""
    pdf_streams = []
    
    for doc in documents:
        if doc.mimetype == 'application/pdf':
            pdf_streams.append(io.BytesIO(doc.data))
        elif doc.mimetype.startswith('image/'):
            # 图像转PDF
            img_stream = io.BytesIO(doc.data)
            pdf_stream = io.BytesIO()
            Image.open(img_stream).convert("RGB").save(pdf_stream, format="PDF")
            pdf_streams.append(pdf_stream)
    
    # 合并所有PDF
    pdf_data_list = [stream.getvalue() for stream in pdf_streams]
    merged_pdf = merge_pdf(pdf_data_list)
    
    # 创建标准化版本
    reader = OdooPdfFileReader(io.BytesIO(merged_pdf))
    writer = OdooPdfFileWriter()
    writer.cloneReaderDocumentRoot(reader)
    
    for page_num in range(reader.getNumPages()):
        writer.addPage(reader.getPage(page_num))
    
    # 转换为PDF/A用于归档
    writer.convert_to_pdfa()
    
    return writer

def extract_and_process_attachments(pdf_data):
    """提取并处理PDF附件"""
    reader = OdooPdfFileReader(io.BytesIO(pdf_data))
    attachments = list(reader.getAttachments())
    
    processed_attachments = []
    for filename, data in attachments:
        # 基于文件扩展名确定处理方式
        if filename.lower().endswith('.xml'):
            # 验证XML格式
            try:
                import xml.etree.ElementTree as ET
                ET.fromstring(data.decode('utf-8'))
                processed_attachments.append((filename, data, 'valid_xml'))
            except:
                processed_attachments.append((filename, data, 'invalid_xml'))
        
        elif filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            # 图像附件，获取尺寸信息
            try:
                img = Image.open(io.BytesIO(data))
                processed_attachments.append((filename, data, f'image_{img.size[0]}x{img.size[1]}'))
            except:
                processed_attachments.append((filename, data, 'invalid_image'))
        
        else:
            processed_attachments.append((filename, data, 'unknown'))
    
    return processed_attachments
```

### 4. 错误处理和日志
```python
def safe_pdf_operation(operation, *args, **kwargs):
    """安全的PDF操作包装器"""
    try:
        return operation(*args, **kwargs)
    except Exception as e:
        _logger.error(f"PDF操作失败: {operation.__name__}, 错误: {e}")
        raise

def validate_pdf_integrity(pdf_data):
    """验证PDF完整性"""
    try:
        reader = OdooPdfFileReader(io.BytesIO(pdf_data))
        page_count = reader.getNumPages()
        
        # 尝试读取每一页
        for i in range(page_count):
            page = reader.getPage(i)
            # 验证页面内容可访问
            _ = page.mediaBox
        
        return True, f"PDF有效，包含{page_count}页"
    
    except Exception as e:
        return False, f"PDF验证失败: {e}"

class PDFProcessor:
    """PDF处理器类"""
    
    def __init__(self, enable_pdfa=True, add_branding=True):
        self.enable_pdfa = enable_pdfa
        self.add_branding = add_branding
        self.processed_count = 0
    
    def process_document(self, pdf_data, metadata=None, attachments=None):
        """处理单个PDF文档"""
        try:
            reader = OdooPdfFileReader(io.BytesIO(pdf_data))
            writer = OdooPdfFileWriter()
            writer.cloneReaderDocumentRoot(reader)
            
            # 复制页面
            for page_num in range(reader.getNumPages()):
                writer.addPage(reader.getPage(page_num))
            
            # PDF/A转换
            if self.enable_pdfa:
                writer.convert_to_pdfa()
            
            # 添加元数据
            if metadata:
                writer.add_file_metadata(metadata)
            
            # 添加附件
            if attachments:
                for name, data, subtype in attachments:
                    writer.addAttachment(name, data, subtype)
            
            output = io.BytesIO()
            writer.write(output)
            
            self.processed_count += 1
            return output.getvalue()
            
        except Exception as e:
            _logger.error(f"文档处理失败: {e}")
            raise
    
    def get_stats(self):
        """获取处理统计"""
        return {
            'processed_documents': self.processed_count,
            'pdfa_enabled': self.enable_pdfa,
            'branding_enabled': self.add_branding
        }
```

---

## 总结

`odoo/tools/pdf.py` 是一个功能完整的企业级PDF处理模块，主要特点：

### 核心功能
1. **基础操作**: PDF合并、旋转、格式转换
2. **高级功能**: 水印添加、附件管理、PDF/A转换
3. **兼容性**: 处理PyPDF2版本差异，优雅降级
4. **企业特性**: Odoo品牌化、长期归档支持

### 技术优势
1. **PDF/A合规**: 完整的PDF/A-3转换支持，满足法规要求
2. **附件管理**: 嵌入和提取附件，支持多种MIME类型
3. **字体处理**: 自动校正字体字形宽度，确保PDF/A合规
4. **错误处理**: 完善的异常处理和格式错误容忍

### 应用场景
- **财务报表**: 发票、报表的生成和归档
- **文档管理**: 多文档合并、标准化处理
- **合规归档**: PDF/A格式的长期保存
- **品牌化输出**: 统一的文档外观和水印

该模块为Odoo框架提供了专业级的PDF处理能力，特别适合需要严格文档管理和合规要求的企业环境。