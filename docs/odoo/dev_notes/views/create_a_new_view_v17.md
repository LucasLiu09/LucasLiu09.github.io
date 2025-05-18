---
title: 创建一个新视图
description: 创建一个新视图
sidebar_label: 创建新视图
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/18
  author: Lucas
---
# create a new view

**创建一个新的视图涉及的主要内容如下：**

+ OWL
    - Controller
    - Renderer
    - Model
    - Arch Parser
    - View
+ Python
    - add the view_mode to 'ir.actions.act_window.view'
    - add the type to 'ir.ui.view'

## create the Controller

Controller的主要作用是促进视图的各个组件之间的协调，例如 Renderer、Model 和 Layout。

```javascript title="Controller.js"
/** @odoo-module */

import { Layout } from "@web/search/layout";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState} from "@odoo/owl";

export class BeautifulController extends Component {
    setup() {
        this.orm = useService("orm");

        // The controller create the model and make it reactive so whenever this.model is
        // accessed and edited then it'll cause a rerendering
        this.model = useState(
            new this.props.Model(
                this.orm,
                this.props.resModel,	// from custom Model
                this.props.fields,	// from custom Model
                this.props.archInfo,	// from custom ArchParser
                this.props.domain	// from custom Model
            )
        );

        onWillStart(async () => {
            await this.model.load();
        });
    }
}

BeautifulController.template = "my_module.View";
BeautifulController.components = { Layout };
```

Controller的template带有Layout的control panel以及renderer。

```xml title="controller.xml"
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="my_module.View">
        <Layout display="props.display" className="'h-100 overflow-auto'">
            <t t-component="props.Renderer" records="model.records" propsYouWant="'Hello world'"/>
        </Layout>
    </t>
</templates>
```

## create the Renderer

Renderer的主要功能是通过渲染包含记录的视图来生成数据的可视化展示。

```javascript title="renderer.js"
import { Component } from "@odoo/owl";
export class BeautifulRenderer extends Component {}

BeautifulRenderer.template = "my_module.Renderer";
```

```xml title="renderer.xml"
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
	<t t-name="my_module.Renderer">
		<t t-esc="props.propsYouWant"/>
		<t t-foreach="props.records" t-as="record" t-key="record.id">
			// Show records
		</t>
	</t>
</templates>
```

## create the Model

Model的作用是检索和管理视图中的所有必要的数据。

```javascript title="model.js"
/** @odoo-module */

import { KeepLast } from "@web/core/utils/concurrency";

export class BeautifulModel {
    constructor(orm, resModel, fields, archInfo, domain) {
        this.orm = orm;
        this.resModel = resModel;
        // We can access arch information parsed by the beautiful arch parser
        const { fieldFromTheArch } = archInfo;
        this.fieldFromTheArch = fieldFromTheArch;
        this.fields = fields;
        this.domain = domain;
        this.keepLast = new KeepLast();
    }

    async load() {
        // The keeplast protect against concurrency call
        const { length, records } = await this.keepLast.add(
            this.orm.webSearchRead(this.resModel, this.domain, [this.fieldsFromTheArch], {})
        );
        this.records = records;
        this.recordsLength = length;
    }
}
```

:::tip
对于高级情况，除了从头开始创建模型，还可以使用其他视图使用的 RelationalModel。
:::

## create the arch parser

ArchParser的作用是解析arch视图，以便视图可以访问这些信息。

```javascript title="arch_parser.js"
/** @odoo-module */

import { XMLParser } from "@web/core/utils/xml";

export class BeautifulArchParser extends XMLParser {
		// 此处parse接收的参数来源于View的props()中的new ArchParser().parse()传参
    parse(arch) {
        const xmlDoc = this.parseXML(arch);
        const fieldFromTheArch = xmlDoc.getAttribute("fieldFromTheArch");
        return {
            fieldFromTheArch,
        };
    }
}
```

## Create the view and combine all the pieces together

创建视图将以上所有部分组合起来，然后注册视图。

```javascript title="view.js"
/** @odoo-module */

import { registry } from "@web/core/registry";
import { BeautifulController } from "./beautiful_controller";
import { BeautifulArchParser } from "./beautiful_arch_parser";
import { BeautifylModel } from "./beautiful_model";
import { BeautifulRenderer } from "./beautiful_renderer";

export const beautifulView = {
    type: "beautiful",
    display_name: "Beautiful",
    icon: "fa fa-map-o", // the icon that will be displayed in the Layout panel
    multiRecord: true,
    Controller: BeautifulController,
    ArchParser: BeautifulArchParser,
    Model: BeautifulModel,
    Renderer: BeautifulRenderer,

    props(genericProps, view) {
        const { ArchParser } = view;
        const { arch } = genericProps;
        const archInfo = new ArchParser().parse(arch);

        return {
            ...genericProps,
            Model: view.Model,
            Renderer: view.Renderer,
            archInfo,
        };
    },
};

registry.category("views").add("beautifulView", beautifulView);
```

## Add the view_mode to ir.actions.act_window.view

```python
# -*- coding: utf-8 -*-
from odoo import fields, models


class ActWindowView(models.Model):
    _inherit = 'ir.actions.act_window.view'

    view_mode = fields.Selection(selection_add=[
        ('map', "Map")
    ],  ondelete={'map': 'cascade'})
```

## Add the type to ir.ui.view

```python
# -*- coding: utf-8 -*-
from odoo import fields, models


class View(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('map', "Map View")])
```

## Use view

```xml
...
<record id="my_beautiful_view" model="ir.ui.view">
	<field name="name">my_view</field>
	<field name="model">my_model</field>
	<field name="arch" type="xml">
		<beautiful>
			...
		</beautiful>
	</field>
</record>
...
```