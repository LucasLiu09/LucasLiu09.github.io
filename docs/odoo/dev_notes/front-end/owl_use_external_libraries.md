---
title: use External Libraries in odoo using OWL Javascript Framework
description: use External Libraries in odoo using OWL Javascript Framework
sidebar_label: OWL - use external libraries
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/19
  author: Lucas
---

# use External Libraries in odoo using OWL Javascript Framework

:::info[Note]
基于OWL框架使用第三方库。

> - [Intel-Tel-Input](https://github.com/jackocnr/intl-tel-input) : 国际电话输入
> - [Filepond](https://pqina.nl/filepond/docs/): 文件拖拽上传
:::

## 国际电话输入

可以使用此功能获取正确的国际电话号码，其中显示每个国家的旗帜和扩展号码。

选择的每个国家/地区都会为您提供可以使用的样本格式。使用此验证按钮，我们能够识别电话号码是否有效。这些只是一些功能，可以通过阅读文档来使用其他选项。

```javascript
/** @odoo-module */

import { registry } from "@web/core/registry";
const { Component, onWillStart, onMounted, useRef, useState } = owl;
import { loadJS, loadCSS } from "@web/core/assets";

export class ExternalLibraries extends Component {
    setup() {
        this.phone = useRef("phone")
        this.iti
        this.state = useState({ phoneValid: undefined })
    
        onWillStart(async () => {	// 此处用async确保页面渲染时外部lib已成功加载。
            await loadJS("https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js")
            await loadCSS("https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css")
            // 如果将外部库的build文件夹下载到项目中，在static/src/目录下创建./lib/intl-tel-input/,将build放于此处。
            // await loadJS("/this_module/static/src/lib/intl-tel-input/build/js/intlTelInput.min.js")
            // await loadCSS("/this_module/static/src/lib/intl-tel-input/build/css/intlTelInput.css")
          
        })
    
        onMounted(()=>{
          console.log("intlTelInput", intlTelInput)
          this.iti = intlTelInput(this.phone.el, {
            // allowDropdown: false,
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.1.0/build/js/utils.js",
          })
        })
      }

    validate(){
      // console.log("iti", this.iti)
      const number = this.iti.getNumber()
      const country = this.iti.getSelectedCountryData()
      console.log("number,country ==>", number, country)

      if (this.iti.isValidNumber()){
        console.log("Phone is valid.")
        this.state.phoneValid = ture
      }else{
        console.log("Phone is not valid.")
        this.state.phoneValid = false
      }
    }
    
}

ExternalLibraries.template = "owl.ExternalLibraries"

registry.category("actions").add("owl.ExternalLibraries", ExternalLibraries)
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
  <t t-name="owl.ExternalLibraries" owl="1">
    <div class="row px-5 vh-100 overflow-y-auto">
      <div class="col-lg-6 p-5">
        <div class="h1 mb-3">International Telephone Input</div>
        <div class="mb-3">
          <label class="form-label me-2">Phone</label>
          <input class="form-control" type="tel" t-ref="phone"/>
        </div>

        <div t-if="state.phoneValid === false" class="alert alert-danger">
          Phone is not valid!
        </div>

        <div t-if="state.phoneValid === true" class="alert alert-success">
          Phone is valid!
        </div>

        <button class="btn btn-primary" t-on-click="validate">Validate</button>
      </div>
    </div>
  </t>
</templates>
```

## 文件拖拽上传 - Filepond

使用Filepond JavaScript库将文件保存到数据库中。如果我们上传一些文件，它会显示图像预览和百分比，并指示是否成功上传。该文件将保存到附件模块。还有一个删除此文件的选项。此处使用了默认的ir.attachment模型，但该方法适用于任何具有二进制字段类型的模型。

```javascript title="filepond_component.js"
/** @odoo-module **/

import {registry} from "@web/core/registry";
import {loadJS, loadCSS} from "@web/core/assets";

const {Component, onWillStart, onMounted, useRef, useState} = owl;

/*
source: https://pqina.nl/filepond/
doc: https://pqina.nl/filepond/docs/
Properties: https://pqina.nl/filepond/docs/api/instance/properties/
Server: https://pqina.nl/filepond/docs/api/server/
Plugins: https://pqina.nl/filepond/docs/api/plugins/
    - File encode
    - File metadata
    - File poster
    - File rename
    - File size validation
    - File type validation
    - Image crop
    - Image edit
    - Image exif-orientation
    - Image filter
    - Image preview
    - Image resize
    - Image transform
    - Image validate size
 */

export class FilepondComponent extends Component {
    setup() {
        this.file = useRef("file")

        onWillStart(async () => {	// 此处用async确保页面渲染时外部lib已成功加载。
            await loadJS("/filepond/static/src/lib/dist/filepond.js")
            await loadCSS("/filepond/static/src/lib/dist/filepond.css")
            await loadCSS("https://unpkg.com/filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css")
            await loadJS("https://unpkg.com/filepond-plugin-image-preview/dist/filepond-plugin-image-preview.js")
            await loadJS("https://unpkg.com/filepond-plugin-image-crop/dist/filepond-plugin-image-crop.js")
            await loadJS("https://unpkg.com/filepond-plugin-file-validate-type/dist/filepond-plugin-file-validate-type.js")
        })

        onMounted(() => {
            console.log("filepond", FilePond)
            // 图像预览插件
            FilePond.registerPlugin(FilePondPluginImagePreview);
            // 图像裁剪插件
            FilePond.registerPlugin(FilePondPluginImageCrop);
            // 文件类型校验插件
            FilePond.registerPlugin(FilePondPluginFileValidateType);
            FilePond.create(this.file.el, {
                allowMultiple: true,
                server: {   // 上传文件请求存储的地址
                    process: './filepond/process',
                    fetch: null,
                    revert: './filepond/revert',
                },
                acceptedFileTypes: ['image/png'],
                fileValidateTypeDetectType: (source, type) =>
                    new Promise((resolve, reject) => {
                        // Do custom type detection here and return with promise
                        resolve(type);
                    }),
                credits: [['', ''], ''] // 隐藏底部来源信息。
            })
        })
    }


}

FilepondComponent.template = "filepond"

registry.category("actions").add("filepond", FilepondComponent)
```

```xml title="filepond_component.xml"
<?xml version="1.0" encoding="UTF-8" ?>
<templates>

  <t t-name="filepond" owl="1">
    <div class="row px-5 vh-100 overflow-y-auto">
      <div class="col-lg-6 p-5">
        <div class="h1 mb-3">Filepond</div>
        <div class="mb-3">
          <label class="form-label me-2">Upload Files</label>
          <input class="form-control" type="file" t-ref="file"/>
        </div>
      </div>
    </div>
  </t>

</templates>
```

```python title="filepond_controller.py"
# -*- coding: utf-8 -*-
from odoo import http
from base64 import b64encode
import json


class Filepond(http.Controller):

    @http.route('/filepond/process', type='http', auth='user', methods=["POST"], csrf=False)
    def filepond_process(self):
        print("request", http.request.params)
        filepond = http.request.params.get("filepond")
        print("filepond", filepond.filename, filepond.content_type)
        file = b64encode(filepond.read())
        ir_attachment = http.request.env["ir.attachment"]
        new_attachment = ir_attachment.create({
            "name": filepond.filename,
            "datas": file,
        })
        print("new attachment", new_attachment)
        if not new_attachment:
            return False
        return str(new_attachment.id)

    @http.route('/filepond/revert', type='http', auth='user', methods=["DELETE"], csrf=False)
    def filepond_revert(self):
        print("request", json.loads(http.request.httprequest.data))
        id = json.loads(http.request.httprequest.data)
        ir_attachment = http.request.env["ir.attachment"]
        attachment = ir_attachment.search([('id', '=', id)])
        if attachment:
            attachment.unlink()
        return ""

```

**add menu to show this page**

```xml
<odoo>
  <data>
    <record id="filepond.demo" model="ir.actions.client">
      <field name="name">Filepond Demo</field>
      <field name="tag">filepond</field>
    </record>


    <menuitem
      id="filepond.menu_root"
      name="filepond"
      sequence="40"
      web_icon="filepond,static/description/icon.png"/>

    <menuitem
      id="filepond_demo_menu"
      name="name"
      action="filepond.demo"
      parent="filepond.menu_root"
      sequence="10"/>
  </data>
</odoo>
```