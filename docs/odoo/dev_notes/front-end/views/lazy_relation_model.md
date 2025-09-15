---
title: LazyRelationalModel(Odoo16)
description: LazyRelationalModel(Odoo16)：仅当具有有效的查询条件时才加载数据。
sidebar_label: LazyRelationalModel(Odoo16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/9/15
  author: Lucas
---

# LazyRelationalModel(Odoo16)

:::info[Note]
扩展`RelationalModel` -> `LazyRelationalModel`；实现`listView`在没有查询条件时，不加载数据。
:::

通过重写 **`RelationalMode -> load()`** function，在其中判断如果无有效的查询条件时，不加载数据。

```javascript
import {registry} from "@web/core/registry";
import {listView} from "@web/views/list/list_view";
import {ListController} from "@web/views/list/list_controller";
import {ListRenderer} from "@web/views/list/list_renderer";
import { RelationalModel } from "@web/views/relational_model";
import { makeContext } from "@web/core/context";

// 扩展RelationalModel
class LazyRelationalModel extends RelationalModel {

    // 判断是否存在有效的查询条件
    hasEffectiveSearchConditions(searchModel) {
        try {
            // 获取不包含全局域的搜索域
            const searchDomain = searchModel._getDomain({
                withSearchPanel: true,
                withGlobal: false
            });

            // 如果域不为空，说明有搜索条件
            return searchDomain.length > 0;
        } catch (error) {
            console.error('检查搜索域时出错:', error);
            // 降级到检查facets
            return searchModel.facets.map(f => f.type).include('filter');
            // return searchModel.query.length > 0;
        }
    }

    /**
     * @param {Object} [params={}]
     * @param {Comparison | null} [params.comparison]
     * @param {Context} [params.context]
     * @param {DomainListRepr} [params.domain]
     * @param {string[]} [params.groupBy]
     * @param {Object[]} [params.orderBy]
     * @param {number} [params.resId] should not be there
     * @returns {Promise<void>}
     */
    async load(params = {}) {
        const rootParams = { ...this.rootParams, ...params };
        if (this.defaultOrderBy && !(params.orderBy && params.orderBy.length)) {
            rootParams.orderBy = this.defaultOrderBy;
        }
        if (
            this.defaultGroupBy &&
            !this.env.inDialog &&
            !(params.groupBy && params.groupBy.length)
        ) {
            rootParams.groupBy = [this.defaultGroupBy];
        }
        rootParams.rawContext = {
            make: () => {
                return makeContext([rootParams.context], {});
            },
        };
        const state = this.root
            ? Object.assign(this.root.exportState(), { offset: 0 })
            : this.initialRootState;

        // console.log('params.domain:', params.domain);
        // console.log('rootParams.domain:', rootParams.domain);
        // console.log('this.env.searchModel.searchDomain:', this.env.searchModel.searchDomain);
        // ** 仅当具有有效的搜索条件时，才加载数据。 **
        let newRoot;
        if (this.hasEffectiveSearchConditions(this.env.searchModel)){
            newRoot = this.createDataPoint(this.rootType, rootParams, state);
            await this.keepLast.add(newRoot.load({ values: this.initialValues }));
        }else{
            newRoot = this.createDataPoint(this.rootType, rootParams, {});
            // 处理异步问题
            await this.keepLast.add(Promise.resolve());
        }

        this.root = newRoot;
        this.rootParams = rootParams;
        this.notify();
    }

}

const LazyListView = {
    ...listView,
    Controller: ListController,
    Renderer: ListRenderer,
    Model: LazyRelationalModel,
};

registry.category("views").add("lazy_list_view", LazyListView);
```

## 存在有效搜索条件且点击按钮时load(v2)

:::tip[背景]
由于第一版在输入搜索条件时，每输入一次就加载一次数据，对于多条件查询的场景，加载的时间很影响效率，所以此次将load修改为通过按钮触发。
:::

实现步骤：
1. 以v1为基础进行补充。
2. 在`ListController`的`template`中增加`Button`。(可以在`slot:control-panel-bottom-right`内添加按钮)
3. 在`Button`的点击事件中调用`this.model.load({ onLazySearch: true })`。
4. 在`LazyRelationalModel`的`load()`中判断rootParams的属性，在判断需要加载数据的条件中加上对`onLazySearch`属性的判定。
5. 然后重置`rootParams.onLazySearch`的状态，以确保每次点击按钮才会附带该属性。

详情见[Github](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/Non_module/lazy_list_view)
