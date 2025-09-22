
# Clipboard Api

剪贴板API: `navigator.clipboard`

从剪贴板获取数据

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="ClipboardL" owl="1">
        <div class="row">
            <div class="col-2">
                <button type="button" class="btn btn-primary" t-on-click="onCopyFromCopyboard">从剪贴板复制</button>
                <p t-ref="log"></p>
            </div>
            <div class="col-4">
                <div t-ref="text1">这是一个文本</div>
            </div>
            <div class="col-6">
                <div t-ref="imgBox"/>
            </div>
        </div>
    </t>

</templates>
```

```javascript
/** @odoo-module **/

import {Component, useRef} from "@odoo/owl";

export class ClipboardL extends Component {
    setup() {
        this.text1Ref = useRef("text1");
        this.imgBoxRef = useRef("imgBox");
        this.logRef = useRef("log");
    }

    log(text) {
        this.logRef.el.innerHTML = `Error: ${text}`;
    }

    async onCopyFromCopyboard() {
        try {
            // Clipboard 接口的 read() 方法可用于请求获取剪贴板的内容，返回将兑现为剪贴板数据的 Promise。  如果希望只读取文本，则应该使用 readText() 方法。
            const clipboardContents = await navigator.clipboard.read();
            for (const item of clipboardContents) {
                if (item.types.length === 0) {
                    this.log("剪贴板中没有内容。");
                } else {
                    for (const mimeType of item.types) {
                        if (mimeType === 'image/png') {
                            const pngImage = new Image(); // Image 构造函数
                            pngImage.src = "image1.png";
                            pngImage.alt = "剪贴板中得到的 PNG";
                            // ClipboardItem 接口的 getType() 方法返回一个 Promise ，该 Promise 使用所请求的 MIME 类型的 Blob 进行解析，如果未找到 MIME 类型，则返回错误。
                            const blob = await item.getType(mimeType);
                            pngImage.src = URL.createObjectURL(blob);
                            this.imgBoxRef.el.appendChild(pngImage);
                        } else if (mimeType === 'text/plain') {
                            const blob = await item.getType(mimeType);
                            const blobText = await blob.text();
                            const clipPlain = document.createElement("pre");
                            clipPlain.innerText = blobText;
                            this.text1Ref.el.appendChild(clipPlain);
                        } else if (mimeType === 'text/html') {
                            const blob = await item.getType("text/html");
                            const blobText = await blob.text();
                            const clipHTML = document.createElement("pre");
                            clipHTML.innerText = blobText;
                            this.text1Ref.el.appendChild(clipHTML);
                        } else {
                            throw new Error(`${mimeType} 不被支持。`);
                        }
                    }
                }
            }
        } catch (e) {
            this.log(e.message);
        }
    }
}

ClipboardL.template = "ClipboardL";
```
