# 虚拟眼镜试戴 (Virtual Glasses Try-On)

基于浏览器的虚拟眼镜试戴 Web 应用，客户可以通过手机摄像头实时试戴眼镜。

## 功能

- 🛒 **在线选购** — 浏览多款眼镜样式
- 📸 **AR 试戴** — 调用手机/电脑摄像头，实时将眼镜叠加到人脸
- 🎨 **多种款式** — 支持多种眼镜框型
- 📱 **移动端适配** — 手机浏览器即可使用

## 技术栈

- 前端：原生 HTML + CSS + JavaScript
- 人脸跟踪：MediaPipe Face Landmarks Detection
- 部署：纯静态页面，可部署到任何静态托管服务

## 快速开始

直接在浏览器打开 `index.html` 即可，或部署到任意 Web 服务器。

```
npm install -g serve
serve .
```

## 部署

纯静态项目，可部署到：
- GitHub Pages
- Vercel / Netlify
- 阿里云 OSS / 腾讯云 COS
- 任意 Nginx / Apache 服务器
