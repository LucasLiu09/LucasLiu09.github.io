---
title: x2many列表的删除按钮🗑️移到左侧(Odoo16)
description: x2many列表的删除按钮🗑️移到左侧(Odoo16)
sidebar_label: x2many列表的删除按钮🗑️移到左侧
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/19
  author: Lucas
---

#  将x2many列表的删除按钮🗑️移到左侧(Odoo16)

:::info[Note]
背景：由于部分FormView中的明细行的列过多，导致每次删除数据都需要拖动到最后面才可删除，使用不便。
:::

**主要步骤：**

1. inherit template
2. patch ListRenderer

**思路**

1. 控制参数从className获取unlink_btn_left
2. 对原模板删除按钮标签添加判断条件
3. 在原模板的字段列的前面插入原来的删除按钮对应的代码，在其中加上判断条件。

**附上代码**

```javascript title="patch_list_renderer.js"
/** @odoo-module **/

import { ListRenderer } from "@web/views/list/list_renderer";
import { patch } from "@web/core/utils/patch";

patch(ListRenderer.prototype, "list_unlink_btn_left", {
    setup(){
        this._super(...arguments);
        this.unlink_btn_left = this.props.archInfo.className && this.props.archInfo.className.split(' ').includes('unlink_btn_left');
    },
    // fix：headers Selector
    computeColumnWidthsFromContent(){
        const table = this.tableRef.el;

        // Toggle a className used to remove style that could interfere with the ideal width
        // computation algorithm (e.g. prevent text fields from being wrapped during the
        // computation, to prevent them from being completely crushed)
        table.classList.add("o_list_computing_widths");
        //比较源码，只修改了此处  thead th --> thead th:not(.o_list_actions_header)
        const headers = [...table.querySelectorAll("thead th:not(.o_list_actions_header)")];
        const columnWidths = headers.map((th) => th.getBoundingClientRect().width);
        const getWidth = (th) => columnWidths[headers.indexOf(th)] || 0;
        const getTotalWidth = () => columnWidths.reduce((tot, width) => tot + width, 0);
        const shrinkColumns = (thsToShrink, shrinkAmount) => {
            let canKeepShrinking = true;
            for (const th of thsToShrink) {
                const index = headers.indexOf(th);
                let maxWidth = columnWidths[index] - shrinkAmount;
                // prevent the columns from shrinking under 92px (~ date field)
                if (maxWidth < 92) {
                    maxWidth = 92;
                    canKeepShrinking = false;
                }
                th.style.maxWidth = `${Math.floor(maxWidth)}px`;
                columnWidths[index] = maxWidth;
            }
            return canKeepShrinking;
        };
        // Sort columns, largest first
        const sortedThs = [...table.querySelectorAll("thead th:not(.o_list_button)")].sort(
            (a, b) => getWidth(b) - getWidth(a)
        );
        const allowedWidth = table.parentNode.getBoundingClientRect().width;

        let totalWidth = getTotalWidth();
        for (let index = 1; totalWidth > allowedWidth; index++) {
            // Find the largest columns
            const largestCols = sortedThs.slice(0, index);
            const currentWidth = getWidth(largestCols[0]);
            for (; currentWidth === getWidth(sortedThs[index]); index++) {
                largestCols.push(sortedThs[index]);
            }

            // Compute the number of px to remove from the largest columns
            const nextLargest = sortedThs[index];
            const toRemove = Math.ceil((totalWidth - allowedWidth) / largestCols.length);
            const shrinkAmount = Math.min(toRemove, currentWidth - getWidth(nextLargest));

            // Shrink the largest columns
            const canKeepShrinking = shrinkColumns(largestCols, shrinkAmount);
            if (!canKeepShrinking) {
                break;
            }

            totalWidth = getTotalWidth();
        }

        // We are no longer computing widths, so restore the normal style
        table.classList.remove("o_list_computing_widths");
        return columnWidths;
    }
});
```

```xml title="inherit_web_list_renderer.xml"
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

  <t t-name="list_unlink_btn_left" t-inherit="web.ListRenderer" t-inherit-mode="extension" owl="1">
    <xpath expr="//thead/tr/th[@t-if='displayOptionalFields or activeActions.onDelete']" position="attributes">
      <attribute name="t-if">!unlink_btn_left and (displayOptionalFields or activeActions.onDelete)</attribute>
    </xpath>

    <xpath expr="//thead//t[@t-foreach='state.columns']" position="before">
      <t t-if="unlink_btn_left">
        <th t-if="displayOptionalFields or activeActions.onDelete" t-on-keydown.synthetic="(ev) => this.onCellKeydown(ev)" class="o_list_controller o_list_actions_header ps-0" style="width: 32px; min-width: 32px">
          <Dropdown t-if="displayOptionalFields"
            class="'o_optional_columns_dropdown text-center border-top-0'"
            togglerClass="'btn p-0'"
            skipTogglerTabbing="true"
            position="'bottom-end'">
            <t t-set-slot="toggler">
              <i class="o_optional_columns_dropdown_toggle oi oi-fw oi-settings-adjust"/>
            </t>

            <t t-foreach="getOptionalFields" t-as="field" t-key="field_index">
              <DropdownItem parentClosingMode="'none'" onSelected="() => this.toggleOptionalField(field.name)">
                <CheckBox
                  onChange="() => this.toggleOptionalField(field.name)"
                  value="field.value"
                  name="field.name"
                  >
                  <t t-esc="field.label"/> <t t-if="env.debug" t-esc="' (' + field.name + ')'" />
                </CheckBox>
              </DropdownItem>
            </t>
          </Dropdown>
        </th>
      </t>
    </xpath>
  </t>

  <t t-name="list_unlink_btn_left_record_row" owl="1" t-inherit="web.ListRenderer.RecordRow" t-inherit-mode="extension">
    <xpath expr="//tr[@class='o_data_row']/t[@t-if='displayOptionalFields or hasX2ManyAction']" position="attributes">
      <attribute name="t-if">!unlink_btn_left and (displayOptionalFields or hasX2ManyAction)</attribute>
    </xpath>

    <xpath expr="//tr[@class='o_data_row']/t[@t-foreach='getColumns(record)']" position="before">
      <t t-if="unlink_btn_left">
        <t t-set="useUnlink" t-value="'unlink' in activeActions" />
        <t t-set="hasX2ManyAction" t-value="isX2Many and (useUnlink ? activeActions.unlink : activeActions.delete)" />
        <t t-if="displayOptionalFields or hasX2ManyAction">
          <t t-if="hasX2ManyAction">
            <td class="o_list_record_remove text-center ps-0"
              t-on-keydown.synthetic="(ev) => this.onCellKeydown(ev, group, record)"
                            t-on-click.stop="() => this.onDeleteRecord(record)"
                            tabindex="-1"
                        >
                            <button class="fa"
                                t-att-class="{
                                    'fa-trash-o': !useUnlink and activeActions.delete,
                                    'fa-times': useUnlink and activeActions.unlink,
                                }"
                                name="delete"
                                aria-label="Delete row"
                                tabindex="-1"
                            />
                        </td>
                    </t>
                    <td t-else="" tabindex="-1" />
                </t>
            </t>
        </xpath>

    </t>
</templates>
```