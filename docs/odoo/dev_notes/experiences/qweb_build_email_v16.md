---
title: QWeb 构造邮件
description: Odoo 16 QWeb 构造邮件
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/10/15
  author: Lucas
---

:::info[说明]
Odoo 16 用 QWeb 构造邮件
:::

# Odoo 16 用 QWeb 构造邮件

本文是一份 Odoo 16 开发指南，说明如何在自定义模块里用 QWeb 模板生成邮件 HTML，并通过 `mail.mail` 发出。读完可以独立完成三件事：在数据文件里声明邮件模板、用 `ir.qweb._render()` 填入业务数据、创建并发送邮件。

文中的模块名、模型名和业务字段都是为讲清这条链路而设的示例，不对应仓库里的现有模块。接到自己的单据时，保留调用方式，替换字段和文案即可。

模块自带一封版式固定的信，数据在 Python 里整理成字典，用 `ir.qweb._render()` 生成 HTML，再写入 `mail.mail` 发出。全文用一封**培训报名确认信**说明这条链路。临时名称：模块 `workshop_mail`，模型 `workshop.enrollment`（培训报名），模板 XML ID `workshop_mail.enrollment_confirm`。

用户在报名表单上点击「发送确认信」。信里有报名人称呼、课程名、上课时间和地点、议程表，备注有内容时才多出一段。发件人用公司邮箱，收件人是报名人邮箱。

界面上可由用户改主题和正文、还要挂报表附件时，用 `mail.template`。版式随模块发版、正文由代码组装时，用本文的写法。

## 1. 报名上用到的字段

| 字段 | 类型 | 在邮件中的位置 |
| --- | --- | --- |
| `attendee_name` | Char | 称呼 |
| `attendee_email` | Char | 收件人 |
| `course_name` | Char | 主题和正文中的课程名 |
| `start_datetime` / `end_datetime` | Datetime | 渲染前格式化成一行时间 |
| `room` | Char | 地点 |
| `note` | Text | 有内容才显示的备注 |
| `agenda_line_ids` | One2many | 议程表，子行有 `sequence`、`title`、`minutes` |
| `company_id` | Many2one | 取公司邮箱作为发件人 |
| `confirmation_sent` | Boolean | 发出后勾上 |

## 2. 涉及的对象

| 对象 | 技术名 | 职责 |
| --- | --- | --- |
| 数据文件里的模板 | `ir.ui.view`（`type=qweb`） | 保存 HTML 骨架和 `t-*` 指令 |
| 渲染引擎 | `ir.qweb` | 把模板编译成函数，填入上下文字典，返回安全 HTML |
| 待发邮件 | `mail.mail` | 保存主题、正文、发件人、收件人；`state=outgoing` 表示待发 |
| 发信服务器 | `ir.mail_server` | `send()` 或邮件队列定时任务连接 SMTP |

`mail.mail` 通过 `_inherits` 挂在 `mail.message` 上。`create()` 会同时写出一条消息。确认信不需要出现在报名的聊天记录里，因此不填 `model` 和 `res_id`。

## 3. 调用顺序

1. `_confirmation_values()` 把当前报名收成字符串、数字和议程列表。
2. `self.env['ir.qweb']._render(xml_id, values, minimal_qcontext=True)` 返回 `markupsafe.Markup`。
3. `self.env['mail.mail'].sudo().create({...})` 写入待发邮件，`body_html` 使用上一步的返回值。
4. `mail.send()` 立即投递。SMTP 失败时 `state` 变为 `exception`，向用户抛出错误，并保持 `confirmation_sent` 为假。

```text
报名记录
    -> 上下文字典
    -> ir.qweb._render
        -> 按 XML ID 找到 ir.ui.view
        -> 编译（有缓存）并执行
        -> Markup HTML
    -> mail.mail.create（state = outgoing）
    -> mail.send()
```

`_render` 的实现在 `odoo/addons/base/models/ir_qweb.py`。它复制 `values`，拒绝字典里的模块对象，编译模板，把生成器产出的片段拼成字符串，再用 `Markup` 包起来。返回值可以直接作为 HTML，不必再包一层 `Markup`，也不必再转义一次。

## 4. 声明模板

`__manifest__.py` 依赖 `mail`，并加载模板文件：

```python
{
    'name': 'Workshop Mail',
    'depends': ['mail'],
    'data': [
        'data/enrollment_confirm_email.xml',
    ],
}
```

`data/enrollment_confirm_email.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <template id="enrollment_confirm">
        <div style="font-family: sans-serif; font-size: 14px; color: #1f2933; line-height: 1.5;">
            <p><t t-out="attendee_name"/>，你好：</p>
            <p>你已报名课程「<t t-out="course_name"/>」。</p>
            <p>
                时间：<t t-out="when_text"/><br/>
                地点：<t t-out="room"/>
            </p>
            <table width="100%" style="border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr>
                        <th align="left" style="padding: 6px 10px; border-bottom: 1px solid #d0d5dd;">议程</th>
                        <th align="right" style="padding: 6px 10px; border-bottom: 1px solid #d0d5dd;">时长（分钟）</th>
                    </tr>
                </thead>
                <tbody>
                    <t t-foreach="agenda" t-as="item">
                        <tr>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #eaecf0;"><t t-out="item['title']"/></td>
                            <td align="right" style="padding: 6px 10px; border-bottom: 1px solid #eaecf0;"><t t-out="item['minutes']"/></td>
                        </tr>
                    </t>
                </tbody>
            </table>
            <p t-if="note" style="white-space: pre-wrap;">备注：<t t-out="note"/></p>
            <p style="color: #667085;">如需改期，请直接回复这封邮件。</p>
        </div>
    </template>
</odoo>
```

`<template id="enrollment_confirm">` 安装后成为视图，完整 XML ID 是 `workshop_mail.enrollment_confirm`。加载时 Odoo 把它改写成带 `t-name` 的 QWeb 节点。`_render` 的第一个参数必须带点号，否则 `ir.ui.view._get_view_id()` 报 `Invalid template id`。

邮件客户端经常丢掉 `<style>` 和 class。字体、颜色、边框、内边距写在标签的 `style` 上。备注用 `white-space: pre-wrap`，换行会保留下来。

| 指令 | 在这封信里的作用 |
| --- | --- |
| `t-out` | 输出表达式，并做 HTML 转义 |
| `t-foreach` / `t-as` | 遍历 `agenda`。同时提供 `item_index`、`item_size`、`item_first`、`item_last` |
| `t-if` | 表达式为真才输出该节点。`''`、`0`、`False`、`None` 都是假，所以空备注不会多出一段 |

`t-esc` 与 `t-out` 走同一条编译路径，已标记为弃用。开发模式下出现 `t-esc` 会打警告。新模板写 `t-out`。

`t-out` 编译后执行 `escape(content)`。课程名、备注里的 `<` 和 `>` 会变成实体，不会变成标签。已经是 `Markup` 的值不会被二次转义。业务字段保持普通字符串。

## 5. 准备上下文字典

模板能看到本次传入的键，以及 `minimal_qcontext` 额外放入的 `true` 和 `false`。日期按用户时区格式化后再放进字典。

```python
def _confirmation_values(self):
    self.ensure_one()
    return {
        'attendee_name': self.attendee_name or '',
        'course_name': self.course_name or '',
        'when_text': self._format_when(),
        'room': self.room or '',
        'note': self.note or '',
        'agenda': [
            {
                'title': line.title or '',
                'minutes': line.minutes or 0,
            }
            for line in self.agenda_line_ids.sorted('sequence')
        ],
    }

def _format_when(self):
    self.ensure_one()
    if not self.start_datetime:
        return ''
    start = fields.Datetime.context_timestamp(self, self.start_datetime)
    text = start.strftime('%Y-%m-%d %H:%M')
    if not self.end_datetime:
        return text
    end = fields.Datetime.context_timestamp(self, self.end_datetime)
    return '%s – %s' % (text, end.strftime('%H:%M'))
```

`fields.Datetime` 在库里是 UTC。`context_timestamp` 按环境里的 `tz`（通常是当前用户时区）转成当地时间。模板在 `minimal_qcontext=True` 时没有 `datetime`，也没有当前用户，所以这一步放在 Python 里完成。

议程收成字典列表。渲染期间不再读记录，内容就是点击发送那一刻的快照，也不会在渲染时触发额外的访问检查。

`safe_eval.check_values()` 会拒绝字典值里的模块对象。需要计算时在 Python 里算完，把结果放进字典。

## 6. 调用 `_render`

```python
body = self.env['ir.qweb']._render(
    'workshop_mail.enrollment_confirm',
    self._confirmation_values(),
    minimal_qcontext=True,
)
```

| 参数 | 确认信中的取值 | 说明 |
| --- | --- | --- |
| `template` | `'workshop_mail.enrollment_confirm'` | 带模块前缀的 XML ID |
| `values` | `_confirmation_values()` | 方法内部会 `copy()` |
| `minimal_qcontext` | `True` | 模板只使用这次传入的键 |

`minimal_qcontext` 为假时，`_prepare_environment()` 会写入 `request`、`env`、`user_id`、`res_company`、`datetime` 等。确认信从按钮发出时有 HTTP 请求，从定时任务补发时没有，`request` 可能是未绑定对象。两种入口都传 `True`，模板依赖的名字就只来自字典。

返回值是 `markupsafe.Markup`。赋给 `body_html` 时按字符串存储。还要在 Python 里拼接别的 HTML 时，继续用 `Markup` 拼接，避免和普通字符串相加后失去“已安全”标记。

编译结果按视图和语言等上下文键缓存。改 XML 后升级模块。开发模式打开 `xml` 时这层缓存关闭。

确认信要固定中文时：

```python
self.with_context(lang='zh_CN').env['ir.qweb']._render(...)
```

`lang` 参与编译缓存。视图上的静态文字走视图翻译；字典里已经格式化的课程名、备注保持原样。

## 7. 写入邮件并发送

```python
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError
from odoo.tools import email_normalize

_logger = logging.getLogger(__name__)


class WorkshopEnrollment(models.Model):
    _name = 'workshop.enrollment'
    _description = 'Workshop Enrollment'

    def action_send_confirmation(self):
        self.ensure_one()
        recipient = email_normalize(self.attendee_email)
        if not recipient:
            raise UserError(_('报名人邮箱无效，无法发送确认信。'))
        email_from = email_normalize(self.company_id.email)
        if not email_from:
            raise UserError(_('公司尚未配置发件邮箱。'))

        body = self.env['ir.qweb']._render(
            'workshop_mail.enrollment_confirm',
            self._confirmation_values(),
            minimal_qcontext=True,
        )
        mail = self.env['mail.mail'].sudo().create({
            'subject': _('培训确认：%s') % (self.course_name or ''),
            'body_html': body,
            'email_from': email_from,
            'email_to': recipient,
            'auto_delete': False,
        })
        mail.send()
        if mail.state == 'exception':
            raise UserError(_('确认信未能发出：%s') % (mail.failure_reason or _('出站服务器返回错误')))
        self.confirmation_sent = True
        return True
```

| 字段 | 确认信中的取值 | 说明 |
| --- | --- | --- |
| `subject` | `培训确认：` 加课程名 | 主题是纯文本，不经过 QWeb |
| `body_html` | `_render` 的返回值 | 发送时另用 `html2plaintext` 生成纯文本副本 |
| `email_from` | 公司邮箱 | 出站服务器按发件人选择 SMTP |
| `email_to` | 规范化后的报名人邮箱 | 多个地址用逗号拼接，`send()` 用 `email_split_and_format` 拆开 |
| `auto_delete` | `False` | 为 `True` 时，发送成功后记录会被标成待删除，队列随后清掉，界面上无法再核对正文 |

`sudo()` 只用在创建 `mail.mail`。业务用户可以点按钮，但不一定有邮件模型的创建权限。收件人仍来自报名上的邮箱，`email_normalize` 会丢掉空值和非法值。

`create()` 只把 `state` 设为 `outgoing`，不会连接 SMTP。

- `mail.send()`：当前进程立即发送。默认 `raise_exception=False`，SMTP 失败时把 `state` 写成 `exception`，原因放在 `failure_reason`，方法本身不抛异常。确认信在发送后检查 `state`，失败则用 `UserError` 告诉用户。此时信没有离站，异常会回滚本次按钮事务里新建的邮件记录。
- 只 `create()`、不调用 `send()`：记录留在队列。定时任务 `mail.mail.process_email_queue()` 按批连接 SMTP。事务若在创建之后回滚，待发记录一起撤销，对方不会收到一封库里已经不存在的确认。夜间批量补发、并且希望与业务数据同生共死时，用这条路径。

按钮「发送确认信」使用 `send()`，用户当时就能知道结果。`send()` 在事务提交前访问 SMTP：若发出成功之后，同一事务里后续代码再抛错并回滚，信已经离站，`confirmation_sent` 却会回到假。把写标志放在 `send()` 成功之后、方法的最后，避免成功之后还有别的写入。

定时任务里一封信失败还要继续处理下一封时，把这一封的 `create()` 和 `send()` 放进 `with self.env.cr.savepoint()`，捕获异常后写日志。保存点只撤销这一封的 SQL。数据库错误若没有保存点，整个游标会进入失败状态，后面的报名也无法再发。

## 8. 接入时检查

- 模块依赖 `mail`，模板 XML 已列入 `data`，并已升级模块。
- `_render` 使用 `workshop_mail.enrollment_confirm`，并传入 `minimal_qcontext=True`。
- 字典的键与模板中的 `t-out`、`t-foreach`、`t-if` 一致；时间已按用户时区格式化。
- 课程名和备注以普通字符串进入模板。
- 公司邮箱和报名人邮箱都经过 `email_normalize`。
- 按钮动作在 `send()` 之后检查 `mail.state`，失败时抛出 `UserError`。
- 设置中的出站邮件能看到这封信的主题、`body_html` 和 `state`。

## 9. 源码位置

| 位置 | 方法 | 和本流程的关系 |
| --- | --- | --- |
| `odoo/addons/base/models/ir_qweb.py` | `IrQWeb._render` | 复制上下文、编译、返回 `Markup` |
| `odoo/addons/base/models/ir_qweb.py` | `IrQWeb._prepare_environment` | `minimal_qcontext` 为真时不注入 `request`、`env`、用户和公司 |
| `odoo/addons/base/models/ir_qweb.py` | `_compile_directive_out` | `t-out` 转义后输出 |
| `odoo/addons/base/models/ir_ui_view.py` | `View._get_view_id` | XML ID 必须含 `.`，再解析到视图 |
| `addons/mail/models/mail_mail.py` | `MailMail.create` | 写入待发邮件，默认 `outgoing` |
| `addons/mail/models/mail_mail.py` | `MailMail.send` / `process_email_queue` | 立即 SMTP，或由队列按批发送并在成功后处理 `auto_delete` |
