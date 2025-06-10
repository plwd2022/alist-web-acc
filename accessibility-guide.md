# 无障碍优化指导

## 1. 交互元素添加 aria-label 或 title

**目标**：让屏幕阅读器能准确描述按钮、链接、表单等的作用。

**做法**：
- 检查所有 `<button>`、`<a>`、`<input>`、`<select>`、`<textarea>` 等交互元素。
- 如果元素内容不够明确（如只有图标），加上 `aria-label="描述"` 或 `title="描述"`。
- 对于有明确文本的按钮，优先保证文本语义清晰，减少冗余 aria-label。

**示例**：
```jsx
<button aria-label="上传文件">
  <UploadIcon />
</button>
<a href="/download" title="下载文件">下载</a>
```

**注意事项**：
- 确保 aria-label 或 title 的值与元素功能一致，避免误导用户。
- 不要重复添加 aria-label 和 title，优先使用 aria-label。

## 2. 主要结构元素使用语义标签

**目标**：帮助屏幕阅读器理解页面结构。

**做法**：
- 用 `<header>`、`<nav>`、`<main>`、`<footer>` 替换对应的 `<div>`。
- 保证每个页面只有一个 `<main>`。
- 导航区用 `<nav>`，并加 `aria-label="主导航"`（如有多个导航）。

**示例**：
```html
<header>...</header>
<nav aria-label="主导航">...</nav>
<main>...</main>
<footer>...</footer>
```

**注意事项**：
- 确保语义标签的使用不影响现有布局和样式。
- 检查 CSS 选择器，确保样式正确应用到新的语义标签。

## 3. 文件列表、预览等区域支持键盘导航

**目标**：无鼠标用户可流畅操作。

**做法**：
- 文件列表用 `<ul>`/`<ol>`+`<li>` 或 `<table>`，每项可聚焦（`tabIndex=0`）。
- 支持方向键、Enter、Space等操作（可用JS监听键盘事件）。
- 明确焦点样式（outline）。

**示例**（React伪代码）：
```jsx
<li tabIndex={0} onKeyDown={handleKey}>
  文件名
</li>
```
**键盘事件处理**：
```js
function handleKey(e) {
  if (e.key === 'Enter') {
    // 打开/预览
  }
  if (e.key === 'ArrowDown') {
    // 聚焦下一个
  }
}
```

**注意事项**：
- 确保键盘事件处理不影响现有功能。
- 测试键盘导航在不同浏览器中的表现。

## 4. 操作结果有视觉/语音反馈

**目标**：操作后用户能感知结果，屏幕阅读器能读到。

**做法**：
- 操作结果（如上传成功/失败）用 `aria-live` 区域提示。
- 视觉上用 toast/snackbar，语音上用 `<div aria-live="polite">`。

**示例**：
```html
<div aria-live="polite" id="operation-feedback">
  上传成功！
</div>
```
操作后动态更新该区域内容。

**注意事项**：
- 确保 aria-live 区域的内容更新不影响页面其他部分。
- 避免频繁更新 aria-live 区域，以免干扰用户。

## 5. 表单校验、错误提示可被屏幕阅读器读取

**目标**：表单错误能被读屏软件感知。

**做法**：
- 错误提示用 `aria-describedby` 关联到输入框。
- 错误提示区域用 `role="alert"` 或 `aria-live="assertive"`。

**示例**：
```html
<input id="email" aria-describedby="email-error" />
<span id="email-error" role="alert">邮箱格式错误</span>
```

**注意事项**：
- 确保错误提示的关联关系正确，避免误导用户。
- 测试表单校验在不同屏幕阅读器中的表现。

## 6. 整体符合W3C标准

**做法**：
- 保证 HTML 结构合法、标签闭合。
- 使用语义化标签。
- 检查无障碍相关的W3C规范（如[WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/)）。

**注意事项**：
- 使用自动化工具（如 axe、Lighthouse）检测无障碍问题。
- 定期进行手动测试，确保无障碍功能正常。

## 实施建议

1. **代码审查**：全局查找 `<button>`、`<a>`、`<input>` 等，补充 aria/title。
2. **结构优化**：将主要结构区块替换为语义标签。
3. **键盘导航**：为列表、表格等区域加键盘事件和 tabIndex。
4. **反馈机制**：统一用 aria-live 区域做操作反馈。
5. **表单校验**：所有表单错误提示都用 aria-describedby/role=alert。
6. **自动化检测**：用 [axe](https://www.deque.com/axe/)、[Lighthouse](https://developers.google.com/web/tools/lighthouse) 等工具检测无障碍问题。
7. **手动测试**：用键盘Tab、屏幕阅读器（如NVDA、VoiceOver）测试。

---

**注意**：在实施无障碍优化时，务必确保不破坏现有代码和功能API。建议在开发环境中逐步测试，确保所有功能正常后再部署到生产环境。 