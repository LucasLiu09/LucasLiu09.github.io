# 一些Owl的说明

## slots

对于通用组件，通常来说会包含一些可自定义的内容，而具体内容是由该通用组件的父组件来指定。这正是slot的工作方式。

### Named slots<!-- {docsify-ignore} -->

通过`t-slot`指令定义.

```javascript
<div class="info-box">
  <div class="info-box-title">
    <t t-slot="title"/>
    <span class="info-box-close-button" t-on-click="close">X</span>
  </div>
  <div class="info-box-content">
    <t t-slot="content"/>
  </div>
</div>
```

在父组件通过`t-set-slot`指令来设置内容

```javascript
<InfoBox>
  <t t-set-slot="title">
    Specific Title. It could be html also.
  </t>
  <t t-set-slot="content">
    <!-- some template here, with html, events, whatever -->
  </t>
</InfoBox>
```

### Default Slot<!-- {docsify-ignore} -->

组件内所有非命名Slot的元素都将被视为 `default` Slot内容的一部分。

例如：

```javascript
<div t-name="Parent">
  <Child>
    <span>some content</span>
  </Child>
</div>

<div t-name="Child">
  <t t-slot="default"/>
</div>
```

可以混合使用`default slot` 和 `named slots`.

Default content

如果slot内定义了默认内容，当父组件未定义slot时，将渲染默认内容.例如：

```javascript
<div t-name="Parent">
  <Child/>
</div>

<span t-name="Child">
  <t t-slot="default">default content</t>
</span>
<!-- will be rendered as: <div><span>default content</span></div> -->
```

### slots and props<!-- {docsify-ignore} -->

从某种意义上说，**slots** 几乎与 **props** 相同：它们定义了一些要传递给子组件的信息。为了能够使用这些信息并将其传递给子组件，Owl 实际上定义了一个特殊的 **prop** `slots` ，其中包含传递给组件的所有 slot 信息。它看起来像这样：

```javascript
{ slotName_1: slotInfo_1, ..., slotName_m: slotInfo_m }
```

组件可以像这样将其插槽传递给子组件：

```javascript
<Child slots="props.slots"/>
```

### 动态slots<!-- {docsify-ignore} -->

对于高级用例，可能需要向 slot 传递额外的信息。这可以通过向 `t-set-slot` 提供额外的键/值对来实现。然后，通用组件可以在其 prop `slots` 中读取它们。
例如，下面是如何实现 Notebook 组件（一个具有多个页面和一个标签栏的组件，它仅呈现当前活动页面，并且每个页面都有一个标题）。

```javascript
class Notebook extends Component {
  static template = xml`
    <div class="notebook">
      <div class="tabs">
        <t t-foreach="tabNames" t-as="tab" t-key="tab_index">
          <span t-att-class="{active:tab_index === activeTab}" t-on-click="() => state.activeTab=tab_index">
            <t t-esc="props.slots[tab].title"/>
          </span>
        </t>
      </div>
      <div class="page">
        <t t-slot="{{currentSlot}}"/>
      </div>
    </div>`;

  setup() {
    this.state = useState({ activeTab: 0 });
    this.tabNames = Object.keys(this.props.slots);
  }

  get currentSlot() {
    return this.tabNames[this.state.activeTab];
  }
}
```

以下是如何使用这个 `Notebook` 组件(注意如何读取每个slot的 `title` 值)：

```javascript
<Notebook>
  <t t-set-slot="page1" title.translate="Page 1">
    <div>this is in the page 1</div>
  </t>
  <t t-set-slot="page2" title.translate="Page 2" hidden="somevalue">
    <div>this is in the page 2</div>
  </t>
</Notebook>
```

Slot params 的工作方式与普通 props 类似，因此可以使用 `.translate` 之类的后缀 当 prop 是面向用户的字符串并且应该被翻译时，或者在需要时使用 `.bind` 来绑定函数。

### Slot scopes<!-- {docsify-ignore} -->

通常slot都有父组件传递内容给通用组件，反之在父组件定义slot时可以访问子组件提供的内容。此时就需要用到`t-slot-scope`来定义一个变量的名称，该变量可以访问子组件提供的所有内容。
需要将`t-slot-scope`与`t-set-slot`结合使用：

```javascript
<MyComponent>
    <t t-set-slot="foo" t-slot-scope="scope">
        content
        <t t-esc="scope.bool"/>
        <t t-esc="scope.num"/>
    </t>
</MyComponent>
```

包含该slot的子组件可以提供如下值(直接指定或通过t-props):

```javascript
<t t-slot="foo" bool="other_var" num="5">

<t t-slot="foo" t-props="someObject">
```

对于default slot，可以直接在组件本身上声明slot scope：

```javascript
<MyComponent t-slot-scope="scope">
    content
    <t t-esc="scope.bool"/>
    <t t-esc="scope.num"/>
</MyComponent>
```

slot values的工作方式与普通props类似，因此可以根据需要使用 `.bind` 后缀来绑定函数。



