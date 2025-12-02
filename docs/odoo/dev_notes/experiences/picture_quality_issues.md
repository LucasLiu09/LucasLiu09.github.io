---
title: Image画质被压缩的问题
description: Image画质被压缩的问题
sidebar_label: Image画质被压缩的问题
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/2
  author: Lucas
---
# Image画质被压缩的问题

:::note[背景]
使用fields.Image字段，在上传图片后，图片被压缩至最大尺寸1920x1920。
- version: odoo16
:::

```python
file = fields.Image(string='文件', attachment=True)
```

先说一下Image字段的属性`attachment`，默认值: `True`,当这个属性设置为`True`时，文件会被存储到附件(`ir.attachment`)中。

经排查，画质被压缩的原因出自`ir.attachment`处理图片时会将超出设置中的最大尺寸时，压缩画质。

定位到问题后，就容易得出以下两个方案。

## 方案一

将属性attachment设置为False，不存储到附件中，直接存储。

## 方案二

- 属性attachment仍设置为True，新增/修改系统参数`base.image_autoresize_max_px`，该参数控制图片最大尺寸。默认1920x1920，其中x为英文小写x。
- 系统参数`base.image_autoresize_extensions`控制自动转换图片大小的文件格式，默认`png`,`jpeg`,`bmp`,`tiff`。
- 注：ir.attachment自动转化图片大小的函数：`odoo.addons.base.models.IrAttachment._postprocess_contents()`

---
另外：

`odoo.fields.Image`有一个属性`verify_resolution`，待进一步确认代码逻辑。贴上代码及原注释。

```python
class Image(Binary):
    """Encapsulates an image, extending :class:`Binary`.

    If image size is greater than the ``max_width``/``max_height`` limit of pixels, the image will be
    resized to the limit by keeping aspect ratio.

    :param int max_width: the maximum width of the image (default: ``0``, no limit)
    :param int max_height: the maximum height of the image (default: ``0``, no limit)
    :param bool verify_resolution: whether the image resolution should be verified
        to ensure it doesn't go over the maximum image resolution (default: ``True``).
        See :class:`odoo.tools.image.ImageProcess` for maximum image resolution (default: ``50e6``).

    .. note::

        If no ``max_width``/``max_height`` is specified (or is set to 0) and ``verify_resolution`` is False,
        the field content won't be verified at all and a :class:`Binary` field should be used.
    """
    max_width = 0
    max_height = 0
    verify_resolution = True
```