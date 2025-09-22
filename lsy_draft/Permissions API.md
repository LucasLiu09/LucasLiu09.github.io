
# Permissions API

> [查看文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Permissions_API)

 Permissions API 基本用法
```
  // 检查单个权限
  async function checkPermission(permissionName) {
      try {
          const result = await navigator.permissions.query({ name: permissionName });
          console.log(`${permissionName} 权限状态:`, result.state);
          return result;
      } catch (err) {
          console.error('权限检查失败:', err);
          return null;
      }
  }
```
  常见权限检查
```
  // 剪贴板权限
  async function checkClipboardPermissions() {
      const readPermission = await navigator.permissions.query({
          name: 'clipboard-read'
      });
      const writePermission = await navigator.permissions.query({
          name: 'clipboard-write'
      });

      console.log('读取权限:', readPermission.state);
      console.log('写入权限:', writePermission.state);
  }

  // 通知权限
  async function checkNotificationPermission() {
      const permission = await navigator.permissions.query({
          name: 'notifications'
      });
      console.log('通知权限:', permission.state);
  }

  // 地理位置权限
  async function checkGeolocationPermission() {
      const permission = await navigator.permissions.query({
          name: 'geolocation'
      });
      console.log('地理位置权限:', permission.state);
  }

  // 摄像头权限
  async function checkCameraPermission() {
      const permission = await navigator.permissions.query({
          name: 'camera'
      });
      console.log('摄像头权限:', permission.state);
  }

  // 麦克风权限
  async function checkMicrophonePermission() {
      const permission = await navigator.permissions.query({
          name: 'microphone'
      });
      console.log('麦克风权限:', permission.state);
  }
```
  权限状态说明
```
  async function explainPermissionStates() {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });

      switch (permission.state) {
          case 'granted':
              console.log('权限已授予，可以直接使用');
              break;
          case 'denied':
              console.log('权限被拒绝，无法使用该功能');
              break;
          case 'prompt':
              console.log('需要用户授权，首次使用时会弹出询问');
              break;
          default:
              console.log('未知权限状态');
      }
  }
```
  监听权限变化
```
  async function monitorPermissionChanges() {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });

      permission.addEventListener('change', () => {
          console.log('剪贴板权限状态变化为:', permission.state);
      });
  }
```
  批量检查多个权限
```
  async function checkMultiplePermissions(permissionNames) {
      const results = {};

      for (const name of permissionNames) {
          try {
              const permission = await navigator.permissions.query({ name });
              results[name] = permission.state;
          } catch (err) {
              results[name] = 'not-supported';
              console.warn(`${name} 权限不被支持:`, err);
          }
      }

      return results;
  }

  // 使用示例
  const permissions = await checkMultiplePermissions([
      'clipboard-read',
      'clipboard-write',
      'notifications',
      'geolocation',
      'camera',
      'microphone'
  ]);

  console.log('权限状态:', permissions);
```
  实用的权限检查函数
```
  async function hasPermission(permissionName) {
      try {
          const permission = await navigator.permissions.query({ name: permissionName });
          return permission.state === 'granted';
      } catch (err) {
          console.warn(`无法检查 ${permissionName} 权限:`, err);
          return false;
      }
  }

  // 使用示例
  if (await hasPermission('clipboard-read')) {
      const text = await navigator.clipboard.readText();
      console.log('剪贴板内容:', text);
  } else {
      console.log('没有剪贴板读取权限');
  }
```

  注意事项

  1. 浏览器支持: 不是所有浏览器都支持所有权限类型
  2. 权限名称: 确保使用正确的权限名称
  3. 安全上下文: 某些权限只在 HTTPS 环境下可用
  4. 用户体验: 权限被拒绝时提供友好的提示信息
