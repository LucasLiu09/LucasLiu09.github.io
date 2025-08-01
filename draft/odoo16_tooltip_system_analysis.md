# Odoo 16 Tooltip System Analysis and Widget Examples

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Analysis](#architecture-analysis)
3. [File Structure](#file-structure)
4. [Usage Examples](#usage-examples)
5. [Practical Widget Implementations](#practical-widget-implementations)
6. [Best Practices](#best-practices)

## System Overview

The Odoo 16 tooltip system is a comprehensive component-based solution that provides customizable tooltips throughout the web interface. It's built on top of the OWL (Odoo Web Library) framework and integrates seamlessly with the popover service to deliver consistent, accessible, and flexible tooltip functionality.

### Key Features
- **Declarative Usage**: Simple HTML data attributes for basic tooltips
- **Template Support**: Advanced tooltips with custom QWeb templates  
- **Position Control**: Configurable positioning (top, bottom, left, right)
- **Touch Support**: Optimized behavior for mobile devices
- **Performance**: Efficient event delegation and cleanup
- **Accessibility**: Proper focus management and screen reader support

## Architecture Analysis

### Directory Structure
```
addons/web/static/src/core/tooltip/
├── tooltip.js          # Main tooltip component
├── tooltip.scss        # Styling definitions
├── tooltip.xml         # QWeb template
├── tooltip_hook.js     # OWL hook for component integration
└── tooltip_service.js  # Core service implementation
```

### Component Hierarchy
```
TooltipService (Service)
├── Popover Service (Dependency)
├── Tooltip Component (OWL Component)
└── Browser Integration (Event Handlers)
```

### File Analysis

#### 1. tooltip.js (`addons/web/static/src/core/tooltip/tooltip.js:1-13`)
```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";

export class Tooltip extends Component {}
Tooltip.template = "web.Tooltip";
Tooltip.props = {
    close: Function,
    tooltip: { type: String, optional: true },
    template: { type: String, optional: true },
    info: { optional: true },
};
```

**Analysis**: Minimal OWL component that serves as a wrapper for tooltip content. The props structure supports both simple string tooltips and complex template-based tooltips.

#### 2. tooltip_service.js (`addons/web/static/src/core/tooltip/tooltip_service.js:47-226`)
```javascript
export const tooltipService = {
    dependencies: ["popover"],
    start(env, { popover }) {
        // Core service implementation
        return {
            add(el, params) {
                elementsWithTooltips.set(el, params);
                return () => {
                    elementsWithTooltips.delete(el);
                    if (target === el) {
                        cleanup();
                    }
                };
            },
        };
    },
};
```

**Key Features**:
- **Event Delegation**: Efficient handling using `document.body` event listeners
- **Touch Support**: Separate handling for touch devices with configurable behavior
- **Cleanup Management**: Automatic cleanup of removed DOM elements
- **Position Intelligence**: Smart positioning based on available space
- **Delay Control**: Configurable open/close delays (default 400ms open, 200ms close)

#### 3. tooltip_hook.js (`addons/web/static/src/core/tooltip/tooltip_hook.js:7-14`)
```javascript
export function useTooltip(refName, params) {
    const tooltip = useService("tooltip");
    const ref = useRef(refName);
    useEffect(
        (el) => tooltip.add(el, params),
        () => [ref.el]
    );
}
```

**Purpose**: OWL hook that simplifies tooltip integration in components by automatically managing lifecycle and cleanup.

#### 4. tooltip.xml (`addons/web/static/src/core/tooltip/tooltip.xml:4-9`)
```xml
<t t-name="web.Tooltip" owl="1">
    <div class="o-tooltip px-2 py-1">
        <t t-if="props.template" t-call="{{props.template}}" t-call-context="{ env, ...props.info }"/>
        <small t-else="" t-esc="props.tooltip"/>
    </div>
</t>
```

**Features**:
- **Conditional Rendering**: Simple string vs. template-based content
- **Context Passing**: Full environment and info object available to templates
- **Styling**: Bootstrap-compatible padding classes

#### 5. tooltip.scss (`addons/web/static/src/core/tooltip/tooltip.scss:1-29`)
```scss
.o-tooltip {
    font-size: small;
    max-width: 400px;

    .o-tooltip--string {
        background-color: $o-tooltip-title-background-color;
        font-weight: bold;
        padding: 5px 8px;
    }

    .o-tooltip--help {
        font-size: smaller;
        white-space: pre-line;
        padding: 8px;
        margin-bottom: 0px;
    }

    .o-tooltip--technical {
        font-size: smaller;
        padding: 8px;
        margin: 0 0 0 15px;
        list-style-type: circle;
    }
}
```

**Styling Features**:
- **Responsive Width**: Maximum 400px width with automatic wrapping
- **Content Types**: Specialized styling for different tooltip types
- **Typography**: Consistent font sizing and spacing
- **Accessibility**: High contrast and readable styling

## Usage Examples

### Basic String Tooltip
```html
<button data-tooltip="This is a simple tooltip">Click me</button>
```

### Advanced Configuration
```html
<button 
    data-tooltip="Custom tooltip" 
    data-tooltip-position="left"
    data-tooltip-delay="200"
    data-tooltip-touch-tap-to-show="true">
    Advanced Button
</button>
```

### Template-Based Tooltip
```html
<!-- Define template -->
<t t-name="custom.tooltip">
    <div>
        <strong t-esc="info.title"/>
        <p t-esc="info.description"/>
        <small>Last updated: <t t-esc="info.date"/></small>
    </div>
</t>

<!-- Use template -->
<span 
    data-tooltip-template="custom.tooltip"
    data-tooltip-info='{"title": "Product Info", "description": "Detailed product description", "date": "2024-01-15"}'>
    Product Details
</span>
```

### Programmatic Usage with Hook
```javascript
import { useTooltip } from "@web/core/tooltip/tooltip_hook";

class MyComponent extends Component {
    setup() {
        useTooltip("buttonRef", {
            tooltip: "Dynamic tooltip content",
            position: "top",
            delay: 300
        });
    }
}
```

## Practical Widget Implementations

### 1. Field Help Widget - Data Validation Assistant

**Use Case**: Provide contextual help and validation hints for form fields in real-time.

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { useTooltip } from "@web/core/tooltip/tooltip_hook";
import { useRef, useState } from "@odoo/owl";

export class FieldHelpWidget extends Component {
    static template = "web.FieldHelpWidget";
    static props = {
        fieldName: String,
        fieldType: String,
        required: { type: Boolean, optional: true },
        validation: { type: Object, optional: true },
        helpText: { type: String, optional: true },
    };

    setup() {
        this.state = useState({
            isValid: true,
            validationMessage: "",
            showHelp: false
        });
        
        this.helpIconRef = useRef("helpIcon");
        
        // Dynamic tooltip based on field state
        useTooltip("helpIcon", () => this.getTooltipParams());
    }

    getTooltipParams() {
        const { fieldName, fieldType, required, helpText } = this.props;
        const { isValid, validationMessage } = this.state;

        if (!isValid && validationMessage) {
            return {
                template: "web.FieldValidationTooltip",
                info: {
                    type: "error",
                    message: validationMessage,
                    fieldName: fieldName
                },
                position: "right"
            };
        }

        if (helpText) {
            return {
                template: "web.FieldHelpTooltip",
                info: {
                    fieldName: fieldName,
                    fieldType: fieldType,
                    required: required,
                    helpText: helpText,
                    examples: this.getFieldExamples()
                },
                position: "top",
                delay: 200
            };
        }

        return {
            tooltip: `${fieldName} (${fieldType})${required ? ' - Required' : ''}`,
            position: "top"
        };
    }

    getFieldExamples() {
        const examples = {
            'char': ['John Doe', 'Example text'],
            'email': ['user@example.com', 'contact@company.org'],
            'phone': ['+1-555-123-4567', '(555) 123-4567'],
            'url': ['https://www.example.com', 'http://company.com'],
            'date': ['2024-01-15', '15/01/2024'],
            'datetime': ['2024-01-15 14:30:00', '15/01/2024 2:30 PM'],
            'float': ['123.45', '1000.00'],
            'integer': ['42', '1000'],
        };
        return examples[this.props.fieldType] || [];
    }

    validateField(value) {
        const { fieldType, required, validation } = this.props;
        
        if (required && !value) {
            this.state.isValid = false;
            this.state.validationMessage = "This field is required";
            return false;
        }

        if (validation && value) {
            // Custom validation logic
            const isValid = this.runValidation(value, validation);
            this.state.isValid = isValid;
            this.state.validationMessage = isValid ? "" : validation.message;
            return isValid;
        }

        this.state.isValid = true;
        this.state.validationMessage = "";
        return true;
    }

    runValidation(value, validation) {
        switch (validation.type) {
            case 'regex':
                return new RegExp(validation.pattern).test(value);
            case 'length':
                return value.length >= validation.min && value.length <= validation.max;
            case 'range':
                const num = parseFloat(value);
                return num >= validation.min && num <= validation.max;
            default:
                return true;
        }
    }
}

// XML Template
`<t t-name="web.FieldHelpWidget">
    <span class="field-help-widget">
        <i class="fa fa-question-circle field-help-icon" 
           t-ref="helpIcon"
           t-att-class="state.isValid ? 'text-info' : 'text-danger'"/>
    </span>
</t>

<t t-name="web.FieldHelpTooltip">
    <div class="field-help-tooltip">
        <div class="tooltip-header">
            <strong t-esc="info.fieldName"/> 
            <span class="badge badge-secondary" t-esc="info.fieldType"/>
            <span t-if="info.required" class="badge badge-warning">Required</span>
        </div>
        <div class="tooltip-content">
            <p t-if="info.helpText" t-esc="info.helpText"/>
            <div t-if="info.examples.length" class="examples">
                <strong>Examples:</strong>
                <ul>
                    <li t-foreach="info.examples" t-as="example" t-esc="example"/>
                </ul>
            </div>
        </div>
    </div>
</t>

<t t-name="web.FieldValidationTooltip">
    <div class="field-validation-tooltip validation-error">
        <div class="error-header">
            <i class="fa fa-exclamation-triangle"/> Validation Error
        </div>
        <div class="error-message" t-esc="info.message"/>
        <div class="error-field">Field: <strong t-esc="info.fieldName"/></div>
    </div>
</t>`

// SCSS Styling
`.field-help-widget {
    .field-help-icon {
        font-size: 14px;
        margin-left: 5px;
        cursor: pointer;
        
        &.text-danger {
            animation: pulse 1s infinite;
        }
    }
}

.field-help-tooltip {
    max-width: 300px;
    
    .tooltip-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
        margin-bottom: 8px;
        
        .badge {
            font-size: 10px;
            margin-left: 5px;
        }
    }
    
    .examples ul {
        margin: 5px 0;
        padding-left: 15px;
        
        li {
            font-family: monospace;
            font-size: 11px;
            color: #666;
        }
    }
}

.field-validation-tooltip {
    &.validation-error {
        border-left: 3px solid #dc3545;
        
        .error-header {
            color: #dc3545;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .error-message {
            color: #721c24;
            margin-bottom: 5px;
        }
        
        .error-field {
            font-size: 11px;
            color: #6c757d;
        }
    }
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}`
```

### 2. Status Indicator Widget - Process Flow Monitor

**Use Case**: Display detailed status information and process flow for records with multiple states.

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { useTooltip } from "@web/core/tooltip/tooltip_hook";
import { useRef, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class StatusIndicatorWidget extends Component {
    static template = "web.StatusIndicatorWidget";
    static props = {
        record: Object,
        statusField: String,
        statusConfig: Object,
        showHistory: { type: Boolean, optional: true },
        allowTransitions: { type: Boolean, optional: true },
    };

    setup() {
        this.orm = useService("orm");
        this.state = useState({
            statusHistory: [],
            nextStates: [],
            loading: false
        });
        
        this.statusRef = useRef("statusIndicator");
        
        useTooltip("statusIndicator", () => this.getStatusTooltipParams());
        
        onWillStart(async () => {
            if (this.props.showHistory) {
                await this.loadStatusHistory();
            }
            if (this.props.allowTransitions) {
                await this.loadNextStates();
            }
        });
    }

    get currentStatus() {
        return this.props.record.data[this.props.statusField];
    }

    get statusInfo() {
        return this.props.statusConfig[this.currentStatus] || {
            label: this.currentStatus,
            color: 'secondary',
            icon: 'fa-question'
        };
    }

    async loadStatusHistory() {
        if (!this.props.record.resId) return;
        
        this.state.loading = true;
        try {
            // Load mail.tracking.value records for status changes
            const history = await this.orm.searchRead(
                'mail.tracking.value',
                [
                    ['res_id', '=', this.props.record.resId],
                    ['res_model', '=', this.props.record.resModel],
                    ['field_name', '=', this.props.statusField]
                ],
                ['old_value_char', 'new_value_char', 'create_date', 'create_uid'],
                { order: 'create_date desc', limit: 10 }
            );
            
            this.state.statusHistory = history.map(h => ({
                from: h.old_value_char || 'New',
                to: h.new_value_char,
                date: h.create_date,
                user: h.create_uid[1]
            }));
        } catch (error) {
            console.error('Failed to load status history:', error);
        } finally {
            this.state.loading = false;
        }
    }

    async loadNextStates() {
        // Load possible next states based on workflow/state machine
        const currentConfig = this.statusInfo;
        this.state.nextStates = currentConfig.next_states || [];
    }

    getStatusTooltipParams() {
        const info = {
            currentStatus: this.currentStatus,
            statusInfo: this.statusInfo,
            record: this.props.record,
            showHistory: this.props.showHistory,
            allowTransitions: this.props.allowTransitions,
            statusHistory: this.state.statusHistory,
            nextStates: this.state.nextStates,
            loading: this.state.loading
        };

        return {
            template: "web.StatusIndicatorTooltip",
            info: info,
            position: "bottom",
            delay: 300
        };
    }

    async transitionToState(newState) {
        if (!this.props.allowTransitions) return;
        
        try {
            await this.orm.write(
                this.props.record.resModel,
                [this.props.record.resId],
                { [this.props.statusField]: newState }
            );
            
            // Trigger record reload
            this.props.record.load();
            
            // Reload history
            if (this.props.showHistory) {
                await this.loadStatusHistory();
            }
        } catch (error) {
            console.error('Status transition failed:', error);
        }
    }
}

// XML Templates
`<t t-name="web.StatusIndicatorWidget">
    <span class="status-indicator-widget">
        <span t-ref="statusIndicator"
              t-att-class="'status-badge status-' + statusInfo.color"
              t-att-data-status="currentStatus">
            <i t-att-class="'fa ' + statusInfo.icon"/>
            <span t-esc="statusInfo.label"/>
        </span>
    </span>
</t>

<t t-name="web.StatusIndicatorTooltip">
    <div class="status-indicator-tooltip">
        <div class="current-status">
            <div class="status-header">
                <i t-att-class="'fa ' + info.statusInfo.icon + ' status-icon-' + info.statusInfo.color"/>
                <strong t-esc="info.statusInfo.label"/>
                <span class="status-code" t-esc="info.currentStatus"/>
            </div>
            <div t-if="info.statusInfo.description" class="status-description" t-esc="info.statusInfo.description"/>
        </div>

        <div t-if="info.showHistory and info.statusHistory.length" class="status-history">
            <h6>Recent Changes</h6>
            <div class="history-list">
                <div t-foreach="info.statusHistory" t-as="change" class="history-item">
                    <div class="history-transition">
                        <span class="from-status" t-esc="change.from"/>
                        <i class="fa fa-arrow-right"/>
                        <span class="to-status" t-esc="change.to"/>
                    </div>
                    <div class="history-meta">
                        <small class="text-muted">
                            <t t-esc="change.date"/> by <t t-esc="change.user"/>
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <div t-if="info.allowTransitions and info.nextStates.length" class="next-states">
            <h6>Available Actions</h6>
            <div class="action-buttons">
                <button t-foreach="info.nextStates" t-as="state"
                        t-att-class="'btn btn-sm btn-' + state.color"
                        t-on-click="() => this.transitionToState(state.key)">
                    <i t-att-class="'fa ' + state.icon"/>
                    <t t-esc="state.label"/>
                </button>
            </div>
        </div>

        <div t-if="info.loading" class="loading-indicator">
            <i class="fa fa-spinner fa-spin"/> Loading...
        </div>
    </div>
</t>`

// SCSS Styling
`.status-indicator-widget {
    .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        i {
            margin-right: 4px;
        }
        
        &.status-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        &.status-warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        &.status-danger {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        &.status-info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        &.status-secondary {
            background-color: #e2e3e5;
            color: #383d41;
            border: 1px solid #d6d8db;
        }
    }
}

.status-indicator-tooltip {
    min-width: 250px;
    max-width: 400px;
    
    .current-status {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 10px;
        
        .status-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            
            .status-code {
                font-family: monospace;
                font-size: 10px;
                background: #f8f9fa;
                padding: 2px 4px;
                border-radius: 3px;
                color: #6c757d;
            }
        }
        
        .status-description {
            font-size: 12px;
            color: #6c757d;
            line-height: 1.4;
        }
    }
    
    .status-history {
        margin-bottom: 15px;
        
        h6 {
            margin: 0 0 8px 0;
            font-size: 11px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 600;
        }
        
        .history-list {
            max-height: 120px;
            overflow-y: auto;
        }
        
        .history-item {
            margin-bottom: 8px;
            font-size: 11px;
            
            .history-transition {
                display: flex;
                align-items: center;
                gap: 6px;
                
                .from-status, .to-status {
                    font-weight: 500;
                }
                
                .fa-arrow-right {
                    font-size: 10px;
                    color: #6c757d;
                }
            }
            
            .history-meta {
                margin-top: 2px;
                
                small {
                    font-size: 10px;
                }
            }
        }
    }
    
    .next-states {
        h6 {
            margin: 0 0 8px 0;
            font-size: 11px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 600;
        }
        
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            
            button {
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 4px;
                
                i {
                    margin-right: 3px;
                }
            }
        }
    }
    
    .loading-indicator {
        text-align: center;
        padding: 10px;
        color: #6c757d;
        font-size: 12px;
        
        .fa-spinner {
            margin-right: 5px;
        }
    }
}`
```

### 3. Data Preview Widget - Smart Content Display

**Use Case**: Provide rich previews of related records, files, or complex data without navigation.

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { useTooltip } from "@web/core/tooltip/tooltip_hook";
import { useRef, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class DataPreviewWidget extends Component {
    static template = "web.DataPreviewWidget";
    static props = {
        record: Object,
        fieldName: String,
        previewType: String, // 'record', 'image', 'document', 'json'
        previewConfig: { type: Object, optional: true },
        maxPreviewSize: { type: Number, optional: true },
    };

    setup() {
        this.orm = useService("orm");
        this.http = useService("http");
        this.state = useState({
            previewData: null,
            loading: false,
            error: null,
            imageLoaded: false
        });
        
        this.previewRef = useRef("previewTrigger");
        
        useTooltip("previewTrigger", () => this.getPreviewTooltipParams());
        
        onWillStart(async () => {
            await this.loadPreviewData();
        });
    }

    get fieldValue() {
        return this.props.record.data[this.props.fieldName];
    }

    get displayValue() {
        const value = this.fieldValue;
        if (!value) return 'No data';
        
        switch (this.props.previewType) {
            case 'record':
                return Array.isArray(value) ? value[1] : value.toString();
            case 'image':
                return 'Image';
            case 'document':
                return 'Document';
            case 'json':
                return 'Data Object';
            default:
                return value.toString();
        }
    }

    async loadPreviewData() {
        if (!this.fieldValue) return;
        
        this.state.loading = true;
        this.state.error = null;
        
        try {
            switch (this.props.previewType) {
                case 'record':
                    await this.loadRecordPreview();
                    break;
                case 'image':
                    await this.loadImagePreview();
                    break;
                case 'document':
                    await this.loadDocumentPreview();
                    break;
                case 'json':
                    await this.loadJsonPreview();
                    break;
            }
        } catch (error) {
            this.state.error = error.message || 'Failed to load preview';
            console.error('Preview loading error:', error);
        } finally {
            this.state.loading = false;
        }
    }

    async loadRecordPreview() {
        const config = this.props.previewConfig || {};
        const recordId = Array.isArray(this.fieldValue) ? this.fieldValue[0] : this.fieldValue;
        const model = config.model || this.props.record.fields[this.props.fieldName].relation;
        
        if (!model || !recordId) return;
        
        const fields = config.fields || ['display_name', 'create_date', 'write_date'];
        const records = await this.orm.read(model, [recordId], fields);
        
        if (records.length > 0) {
            this.state.previewData = {
                type: 'record',
                model: model,
                record: records[0],
                fields: fields,
                config: config
            };
        }
    }

    async loadImagePreview() {
        const config = this.props.previewConfig || {};
        const imageField = config.field || this.props.fieldName;
        const maxSize = this.props.maxPreviewSize || 300;
        
        // Construct image URL
        const imageUrl = `/web/image/${this.props.record.resModel}/${this.props.record.resId}/${imageField}/${maxSize}x${maxSize}`;
        
        // Pre-load image to check if it exists
        const img = new Image();
        img.onload = () => {
            this.state.imageLoaded = true;
            this.state.previewData = {
                type: 'image',
                url: imageUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
                maxSize: maxSize
            };
        };
        img.onerror = () => {
            throw new Error('Image not found or failed to load');
        };
        img.src = imageUrl;
    }

    async loadDocumentPreview() {
        const config = this.props.previewConfig || {};
        const attachmentId = this.fieldValue;
        
        if (!attachmentId) return;
        
        const attachments = await this.orm.read('ir.attachment', [attachmentId], [
            'name', 'mimetype', 'file_size', 'create_date', 'datas_fname',
            'res_model', 'res_id', 'description'
        ]);
        
        if (attachments.length > 0) {
            const attachment = attachments[0];
            this.state.previewData = {
                type: 'document',
                attachment: attachment,
                downloadUrl: `/web/content/${attachmentId}`,
                previewUrl: this.getDocumentPreviewUrl(attachment),
                isPreviewable: this.isDocumentPreviewable(attachment.mimetype)
            };
        }
    }

    async loadJsonPreview() {
        let jsonData;
        
        try {
            jsonData = typeof this.fieldValue === 'string' 
                ? JSON.parse(this.fieldValue) 
                : this.fieldValue;
        } catch (e) {
            throw new Error('Invalid JSON data');
        }
        
        this.state.previewData = {
            type: 'json',
            data: jsonData,
            formatted: JSON.stringify(jsonData, null, 2),
            keys: Object.keys(jsonData || {}),
            size: JSON.stringify(jsonData).length
        };
    }

    getDocumentPreviewUrl(attachment) {
        const previewableTypes = ['application/pdf', 'text/plain', 'text/html'];
        if (previewableTypes.includes(attachment.mimetype)) {
            return `/web/content/${attachment.id}?download=false`;
        }
        return null;
    }

    isDocumentPreviewable(mimetype) {
        const previewableTypes = [
            'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript',
            'application/json', 'application/xml', 'text/xml'
        ];
        return previewableTypes.includes(mimetype) || mimetype.startsWith('image/');
    }

    getFileIcon(mimetype) {
        const iconMap = {
            'application/pdf': 'fa-file-pdf-o',
            'application/vnd.ms-excel': 'fa-file-excel-o',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fa-file-excel-o',
            'application/msword': 'fa-file-word-o',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word-o',
            'application/vnd.ms-powerpoint': 'fa-file-powerpoint-o',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-powerpoint-o',
            'application/zip': 'fa-file-archive-o',
            'application/x-rar-compressed': 'fa-file-archive-o',
            'text/plain': 'fa-file-text-o',
            'text/html': 'fa-file-code-o',
            'application/json': 'fa-file-code-o',
        };
        
        if (mimetype.startsWith('image/')) return 'fa-file-image-o';
        if (mimetype.startsWith('video/')) return 'fa-file-video-o';
        if (mimetype.startsWith('audio/')) return 'fa-file-audio-o';
        
        return iconMap[mimetype] || 'fa-file-o';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getPreviewTooltipParams() {
        return {
            template: "web.DataPreviewTooltip",
            info: {
                fieldName: this.props.fieldName,
                previewType: this.props.previewType,
                previewData: this.state.previewData,
                loading: this.state.loading,
                error: this.state.error,
                displayValue: this.displayValue,
                widget: this // Pass the widget instance for method access
            },
            position: "right",
            delay: 400
        };
    }
}

// XML Templates
`<t t-name="web.DataPreviewWidget">
    <span class="data-preview-widget" t-ref="previewTrigger">
        <span class="preview-value" t-esc="displayValue"/>
        <i class="fa fa-eye preview-icon"/>
    </span>
</t>

<t t-name="web.DataPreviewTooltip">
    <div class="data-preview-tooltip" t-att-class="'preview-type-' + info.previewType">
        <div class="preview-header">
            <strong t-esc="info.fieldName"/>
            <span class="preview-type-badge" t-esc="info.previewType"/>
        </div>

        <div t-if="info.loading" class="preview-loading">
            <i class="fa fa-spinner fa-spin"/> Loading preview...
        </div>

        <div t-elif="info.error" class="preview-error">
            <i class="fa fa-exclamation-triangle"/> 
            <t t-esc="info.error"/>
        </div>

        <div t-elif="info.previewData" class="preview-content">
            <!-- Record Preview -->
            <div t-if="info.previewData.type === 'record'" class="record-preview">
                <div class="record-info">
                    <div class="record-name" t-esc="info.previewData.record.display_name"/>
                    <div class="record-model">
                        <small class="text-muted" t-esc="info.previewData.model"/>
                    </div>
                </div>
                <div class="record-fields">
                    <t t-foreach="info.previewData.fields" t-as="field">
                        <div t-if="info.previewData.record[field] and field !== 'display_name'" 
                             class="field-row">
                            <span class="field-label" t-esc="field"/>:
                            <span class="field-value" t-esc="info.previewData.record[field]"/>
                        </div>
                    </t>
                </div>
            </div>

            <!-- Image Preview -->
            <div t-if="info.previewData.type === 'image'" class="image-preview">
                <img t-att-src="info.previewData.url" 
                     t-att-style="'max-width: ' + info.previewData.maxSize + 'px; max-height: ' + info.previewData.maxSize + 'px;'"
                     class="preview-image"/>
                <div class="image-info">
                    <small class="text-muted">
                        <t t-esc="info.previewData.width"/>×<t t-esc="info.previewData.height"/>px
                    </small>
                </div>
            </div>

            <!-- Document Preview -->
            <div t-if="info.previewData.type === 'document'" class="document-preview">
                <div class="document-info">
                    <div class="document-header">
                        <i t-att-class="'fa ' + info.widget.getFileIcon(info.previewData.attachment.mimetype)"/>
                        <span class="document-name" t-esc="info.previewData.attachment.name"/>
                    </div>
                    <div class="document-meta">
                        <span class="file-size" t-esc="info.widget.formatFileSize(info.previewData.attachment.file_size)"/>
                        <span class="file-type" t-esc="info.previewData.attachment.mimetype"/>
                    </div>
                </div>
                <div t-if="info.previewData.attachment.description" class="document-description">
                    <small t-esc="info.previewData.attachment.description"/>
                </div>
                <div class="document-actions">
                    <a t-att-href="info.previewData.downloadUrl" class="btn btn-sm btn-outline-primary" download="">
                        <i class="fa fa-download"/> Download
                    </a>
                    <a t-if="info.previewData.isPreviewable" 
                       t-att-href="info.previewData.previewUrl" 
                       class="btn btn-sm btn-outline-secondary" target="_blank">
                        <i class="fa fa-external-link"/> Preview
                    </a>
                </div>
            </div>

            <!-- JSON Preview -->
            <div t-if="info.previewData.type === 'json'" class="json-preview">
                <div class="json-info">
                    <span class="json-keys-count"><t t-esc="info.previewData.keys.length"/> keys</span>
                    <span class="json-size"><t t-esc="info.previewData.size"/> bytes</span>
                </div>
                <div class="json-keys">
                    <strong>Keys:</strong>
                    <div class="keys-list">
                        <span t-foreach="info.previewData.keys" t-as="key" 
                              class="key-badge" t-esc="key"/>
                    </div>
                </div>
                <div class="json-content">
                    <pre class="json-formatted" t-esc="info.previewData.formatted"/>
                </div>
            </div>
        </div>

        <div t-else="" class="preview-empty">
            <i class="fa fa-info-circle"/> No preview available
        </div>
    </div>
</t>`

// SCSS Styling
`.data-preview-widget {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    
    .preview-value {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .preview-icon {
        font-size: 12px;
        color: #6c757d;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    &:hover .preview-icon {
        opacity: 1;
        color: #007bff;
    }
}

.data-preview-tooltip {
    min-width: 250px;
    max-width: 400px;
    
    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
        
        .preview-type-badge {
            font-size: 10px;
            padding: 2px 6px;
            background: #e9ecef;
            border-radius: 10px;
            text-transform: uppercase;
            font-weight: 500;
        }
    }
    
    .preview-loading, .preview-error, .preview-empty {
        text-align: center;
        padding: 20px;
        color: #6c757d;
        font-size: 12px;
    }
    
    .preview-error {
        color: #dc3545;
    }
    
    // Record Preview Styles
    .record-preview {
        .record-info {
            margin-bottom: 10px;
            
            .record-name {
                font-weight: 500;
                margin-bottom: 2px;
            }
            
            .record-model {
                font-size: 11px;
            }
        }
        
        .record-fields {
            .field-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 11px;
                
                .field-label {
                    font-weight: 500;
                    color: #6c757d;
                    text-transform: capitalize;
                }
                
                .field-value {
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }
    }
    
    // Image Preview Styles
    .image-preview {
        text-align: center;
        
        .preview-image {
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 5px;
        }
        
        .image-info {
            font-size: 11px;
        }
    }
    
    // Document Preview Styles
    .document-preview {
        .document-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            
            .fa {
                font-size: 16px;
                color: #007bff;
            }
            
            .document-name {
                font-weight: 500;
                word-break: break-word;
            }
        }
        
        .document-meta {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 11px;
            color: #6c757d;
        }
        
        .document-description {
            margin-bottom: 10px;
            font-size: 11px;
            color: #6c757d;
            font-style: italic;
        }
        
        .document-actions {
            display: flex;
            gap: 5px;
            
            .btn {
                font-size: 11px;
                padding: 3px 8px;
            }
        }
    }
    
    // JSON Preview Styles
    .json-preview {
        .json-info {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 11px;
            color: #6c757d;
        }
        
        .json-keys {
            margin-bottom: 10px;
            
            .keys-list {
                display: flex;
                flex-wrap: wrap;
                gap: 3px;
                margin-top: 5px;
                
                .key-badge {
                    font-size: 10px;
                    padding: 2px 5px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 3px;
                    font-family: monospace;
                }
            }
        }
        
        .json-content {
            max-height: 200px;
            overflow-y: auto;
            
            .json-formatted {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 8px;
                font-size: 10px;
                line-height: 1.3;
                margin: 0;
                word-break: break-all;
            }
        }
    }
}`
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze the tooltip directory structure and files", "id": "1", "priority": "high", "status": "completed"}, {"content": "Create comprehensive documentation of tooltip system", "id": "2", "priority": "high", "status": "completed"}, {"content": "Design and implement 3 practical widget examples", "id": "3", "priority": "medium", "status": "completed"}, {"content": "Create markdown documentation file in ai_markdown directory", "id": "4", "priority": "high", "status": "completed"}]