---
title: 翻译
description: 翻译
sidebar_label: 翻译
keywords:
- docs
- odoo development
tags: [odoo]
---

## 隐式导出

Odoo 会自动从 “data” 类型的内容中导出可翻译的字符串

- 在非 QWeb 视图中，将导出所有`text`节点以及 `string`、`help`、`sum`、`confirm` 和 `placeholder` 属性的内容

- QWeb 模板（服务器端和客户端），除 `t-translation=“off”` 块外，所有`text`节点都会导出，`title`、`alt`、`label` 和 `placeholder` 属性的内容也会导出

- 对于Field，除非其模型标记为 `_translate = False`

- 它们的 `String` 和 `Help` 属性被导出

- 如果存在 `selection` 并且是 List （或 Tuple），则会将其导出

- 如果其 `translate` 属性设置为 `True`，则导出其所有现有值（跨所有记录）

- 导出 `_constraints` 和 `_sql_constraints` 的`help`/`error`消息

## 显示导出

- **import**

- **JavaScript**

`import { _t, _lt } from "@web/core/l10n/translation";`

- **Python**

`from odoo.tools.translate import _, _lt`

当涉及 Python 代码或 Javascript 代码时， Odoo 无法自动导出可翻译术语，因此必须明确标记它们以供导出。这是通过在函数调用中包装文本字符串来完成的。

在Python中，包装的函数为`odoo._()`

`title = _("Bank Accounts")`

在JavaScript中，包装的函数为`odoo.web._t()`

`title = _t("Bank Accounts");`

lazy 版本：翻译查找仅在渲染时执行，可用于在全局变量的类方法中声明可翻译属性。

- odoo._() -> odoo._lt()
- odoo.web._t() -> odoo.web._lt()

:::tip

默认情况下，模块的翻译不会暴露在前端，因此无法从 JavaScript 访问。为了实现这一点，模块名称必须以 `website` 为前缀（就像 `website_sale`、 `website_event` 等）或通过实现 `_get_translation_frontend_modules_name()` `ir.http` 模型来显式注册。

:::

```python
from odoo import models

class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _get_translation_frontend_modules_name(cls):
        modules = super()._get_translation_frontend_modules_name()
        return modules + ['your_module']
```

## 使用翻译

**务必将动态变量设置为翻译查找的参数**

```python
# good
_("Scheduled meeting with %s", invitee.name)

# bad
_("Scheduled meeting with %s" % invitee.name)
```

**不要将翻译拆分成多个块或多行**

```javascript
// good
// good, allow to change position of the number in the translation
_("You have %s invoices wainting") % len(invoices)
_.str.sprintf(_t("You have %s invoices wainting"), invoices.length);

// good, full sentence is understandable
_("Reference of the document that generated " + \
  "this sales order request.")

// bad
// bad, trailing spaces, blocks out of context
_("You have ") + len(invoices) + _(" invoices waiting")
_t("You have ") + invoices.length + _t(" invoices waiting");

// bad, multiple small translations
_("Reference of the document that generated ") + \
  _("this sales order request.")
```

**不要用英语方式复数术语，每种语言都有不同的复数形式**

```python
# good
if invoice_count > 1:
  msg = _("You have %(count)s invoices", count=invoice_count)
else:
  msg = _("You have one invoice")

# bad
msg = _("You have %(count)s invoice", count=invoice_count)
if invoice_count > 1:
  msg += _("s")
```

**不要在服务器启动时调用翻译查找**

```python
# bad
ERROR_MESSAGE = {
  # bad, evaluated at server launch with no user language
  'access_error': _('Access Error'),
  'missing_error': _('Missing Record'),
}

class Record(models.Model):

  def _raise_error(self, code):
    raise UserError(ERROR_MESSAGE[code])

# -------------------------------------------
# 使用lazy translation
ERROR_MESSAGE = {
  'access_error': _lt('Access Error'),
  'missing_error': _lt('Missing Record'),
}

class Record(models.Model):

  def _raise_error(self, code):
    # translation lookup executed at error rendering
    raise UserError(ERROR_MESSAGE[code])

# 动态评估可翻译内容
# good, evaluated at run time
def _get_error_message(self):
  return {
    access_error: _('Access Error'),
    missing_error: _('Missing Record'),
  }
```

**读取JavaScript文件时用_lt**

```javascript
// bad, js _t is evaluated too early
var core = require('web.core');
var _t = core._t;
var map_title = {
  access_error: _t('Access Error'),
  missing_error: _t('Missing Record'),
};

// 如果在读取 JS 文件时完成翻译查找，请使用 _lt 而不是 _t 来翻译使用术语
// good, js _lt is evaluated lazily
var core = require('web.core');
var _lt = core._lt;
var map_title = {
    access_error: _lt('Access Error'),
    missing_error: _lt('Missing Record'),
};
```
