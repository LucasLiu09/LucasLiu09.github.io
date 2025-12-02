---
title: 创建简单的邮件发送服务
description: 创建简单的邮件发送服务
sidebar_label: 创建简单的邮件发送服务
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/2
  author: Lucas
---
# 创建简单的邮件发送服务

本文将创建以下两部分：
- `mail_service`: 发送邮件的服务
- `mail_container`: 邮件的内容结构容器

## mail_container

```javascript title="simple_mail_container.js"
/** @odoo-module */

const { Component, xml, useState } = owl;

export class SimpleMailContainer extends Component {
    setup() {
        console.log("This is a simple mail container.", this.props);
        this.state = useState(this.props.simple_mail);
    }
}

export class SimpleMail extends Component {
    setup() {
        console.log("This is simple mail component");
        this.state = useState({
          email_to: "",
          subject: "",
          message: "",
        })
    }
}

SimpleMail.template = "owl.SimpleMail";

SimpleMailContainer.template = xml`
    <div class="o_simple_mail_manager">
        <t t-if="state.isActive">
            <SimpleMail t-props="state"/>
        </t>
    </div>
`;

SimpleMailContainer.components = { SimpleMail };

```

```xml title="simple_mail.xml"
<templates>
  <t t-name="owl.SimpleMail" owl="1">
      <div class="o_simple_mail position-absolute top-0 bottom-0 w-100 h-100">
          <div class="d-flex justify-content-center align-items-center h-100 w-100 bg-white bg-opacity-75">
              <div class="o_simple_mail_wrapper bg-white border p-4 rounded shadow">
                  <h2>Simple Mail Service</h2>
                  <div class="my-3">
                      <label class="form-label">
                          Email From
                      </label>
                      <input class="form-control" type="email" t-att-value="props.email_from" readonly="1"/>
                  </div>
                  <div class="my-3">
                      <label class="form-label">
                          Email To
                      </label>
                      <input class="form-control" type="email" t-model="state.email_to"/>
                  </div>
                  <div class="my-3">
                      <label class="form-label">
                          Subject
                      </label>
                      <input class="form-control" type="text" t-model="state.subject"/>
                  </div>
                  <div class="my-3">
                      <label class="form-label">
                          Message
                      </label>
                      <textarea class="form-control" rows="3" t-model="state.message"/>
                  </div>
                  <div class="d-flex">
                      <button class="btn btn-primary ms-auto me-2" t-on-click="()=>props.send(state)">Send</button>
                      <button class="btn btn-secondary" t-on-click="props.close">Close</button>
                  </div>
              </div>
          </div>
      </div>
  </t>
</templates>
```

```css
.o_simple_mail {
  .o_simple_mail_wrapper{
      width:500px;
      height: auto;
  }
}
```

## mail_service

返回一个`open`函数作为service的公开API，用于打开邮件发送表单。

```javascript title="simple_mail_service.js"
/*/ @odoo-module */
import { registry } from "@web/core/registry"
import { SimpleMailContainer } from "./simple_mail_container"
const { reactive } = owl
export const simpleMailService ={
  dependencies: ["orm", "user", "rpc", "notification"],
  async start(env, { orm, user, rpc, notification}){
    console.log("user service", user)
    const user_email = await orm.searchRead("res.partner", [["id","=", user.partnerId]], ["email"])
    
  
    let simple_mail = reactive({
      isActive: false,	// 控制容器是否显示.
      open,
      close,
      send,
      email_from: user_email[0].email
    })
    // 在主页注册组件.
    registry.category("main_components").add("SimpleMailContainer",{
      Component: SimpleMailContainer,
      props: { simple_mail }
    })
    function open(){
      simple_mail.isActive = true
    }
    function close(){
      simple_mail.isActive = false
    }
    async function send(mail){
      console.log("Send simple mail service", mail)
      const data = {
        email_from: simple_mail.email_from,
        email_to: mail.email_to,
        subject: mail.subject,
        message: mail.message
      }
      const new_email = await rpc("/owl/simple_email", data)
      console.log(new_email)
      if (new_email){
        notification.add("Mail successfully sent", {type:"info"})
      }else{
        notification.add("Qgoops!Something went wrong.Mail not sent.", {type:"danger"})
      }

      close()
    }
    return{
      open
    }
  }
}

registry.category("services").add("simple_mail", simpleMailService)
```

创建Controller类，负责接收邮件内容，创建`mail.mail`并发送。

```python title="simple_mail_service.py"
from odoo import http


class SimpleMailService(http.Controller):
    
    @http.route('/owl/simple_mail',type='json',auth='user')
    def send_simple_mail(self,**mail_data):
        mail http.request.env['mail.mail']
        new_email mail.create({
            'email_from':mail_data['email_from'],
            'email_to':mail_data['email_to'],
            'subject':mail_data['subject'],
            'body_html':mail_data['message'],
        }).send()
        if not new_email:
            return False
        return True
```

## 调用service

```javascript
...
setup(){
  this.sample_mail = useService("simpleMailService")
}

opensimpleMail(){
  this.simple_mail.open()
}
```