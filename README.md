# 我的个人博客

> 基于 Docsify 构建的个人技术博客 🚀

##  项目结构

```
/
├── index.html              # 入口文件（Docsify 配置）
├── home.md                 # 首页内容（文章列表）
├── _coverpage.md           # 封面页
├── _navbar.md              # 顶部导航
├── _sidebar.md             # 侧边栏
├── _404.md                 # 404 页面
├── .nojekyll               # GitHub Pages 配置
│
├── posts/                  # 博文目录（每篇文章一个文件夹）
│   ├── 2025-01-15-docsify-blog-guide/
│   │   └── README.md
│   ├── 2025-01-10-markdown-tips/
│   │   └── README.md
│   └── 2024-12-25-example-post/
│       └── README.md
│
├── assets/
│   ├── css/main.css        # 自定义样式
│   ├── js/main.js          # 自定义脚本
│   └── images/             # 图片资源
│
└── about/
    └── README.md           # 关于页面
```

## 🚀 本地运行

```bash
# 安装 docsify-cli
npm install -g docsify-cli

# 启动本地服务
docsify serve .
```

访问 `http://localhost:3000`

## ✍️ 发布文章

1. 在 `posts/` 目录下新建 `YYYY-MM-DD-文章标题.md`
2. 编辑 `home.md`，添加文章卡片：

```html
<article class="post-card">
  <div class="post-meta">
    <span class="post-date">📅 2025-01-20</span>
    <div class="post-tags">
      <span class="tag">标签</span>
    </div>
  </div>
  <h3 class="post-title">
    <a href="#/posts/2025-01-20-article-name">文章标题</a>
  </h3>
  <p class="post-excerpt">文章摘要...</p>
  <div class="post-footer">
    <span class="read-more">阅读全文 →</span>
    <span class="read-time">⏱️ 约 X 分钟</span>
  </div>
</article>
```

##  技术栈

- [Docsify](https://docsify.js.org/) - 文档站点生成器
- [GitHub Pages](https://pages.github.com/) - 静态网站托管
- [Prism.js](https://prismjs.com/) - 代码高亮
