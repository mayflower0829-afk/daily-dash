# 每日 Dash · 睁眼第一页

大学生的每日信息聚合页：**60 秒读懂世界**、微博/知乎/B站/抖音四平台热榜、天气预报、考研初试倒计时（含农历）。手机添加到主屏幕，每天睁眼刷一遍。

**在线使用**：<https://cloud1-d4gsgj705497df85d-1501559031.tcloudbaseapp.com/daily/>

## 工程特性

- **PWA**：manifest + Service Worker——手机添加到主屏幕后全屏独立运行；壳资源缓存秒开
- **断网兜底**：API 数据网络优先 + 缓存兜底，断网时展示最近一次成功的数据
- **跨天自动刷新**：页面常开时零点后自动拉取新一天的数据，不用手动刷新

## 数据来源（全部免费开源）

- **60s API**：开源项目 [vikiboss/60s](https://github.com/vikiboss/60s)——**自部署实例**（腾讯云 CloudBase 云托管），不依赖公共服务、无限流顾虑
- **天气**：[Open-Meteo](https://open-meteo.com/)（免费、无密钥、原生 CORS）

## 本地部署自己的 API（可选）

```bash
docker run -d -p 4399:4399 vikiboss/60s:latest
# 修改 app.js 中的 API 常量指向你的实例
```

## License

MIT
