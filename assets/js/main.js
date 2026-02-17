/* ========================================
   自定义 JavaScript 脚本
   ======================================== */

(function() {
  'use strict';

  // === 页面加载完成后执行 ===
  window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 博客加载成功！');
  });

  // === 暗黑模式切换 ===
  function initDarkMode() {
    const darkModeToggle = document.createElement('button');
    darkModeToggle.innerHTML = '🌙';
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.title = '切换暗黑模式';
    
    // 检查本地存储
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (currentTheme === 'dark') {
      darkModeToggle.innerHTML = '☀️';
    }
    
    darkModeToggle.addEventListener('click', function() {
      const theme = document.documentElement.getAttribute('data-theme');
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      darkModeToggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    });
    
    document.body.appendChild(darkModeToggle);
  }

  // === 返回顶部按钮 ===
  function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.title = '返回顶部';
    backToTopBtn.style.display = 'none';
    
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });
    
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    document.body.appendChild(backToTopBtn);
  }

  // === 为外部链接添加图标 ===
  function markExternalLinks() {
    const links = document.querySelectorAll('.markdown-section a');
    links.forEach(link => {
      if (link.hostname !== window.location.hostname && link.hostname !== '') {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.classList.add('external-link');
      }
    });
  }

  // === 图片懒加载 ===
  function lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      const images = document.querySelectorAll('img.lazy');
      images.forEach(img => imageObserver.observe(img));
    }
  }

  // === 代码块添加语言标签 ===
  function addCodeLanguageLabel() {
    const codeBlocks = document.querySelectorAll('pre[data-lang]');
    codeBlocks.forEach(block => {
      // 避免重复添加
      if (block.querySelector('.code-lang-label')) return;
      const lang = block.getAttribute('data-lang');
      if (lang && lang !== 'text') {
        const label = document.createElement('span');
        label.className = 'code-lang-label';
        label.textContent = lang;
        block.appendChild(label);
      }
    });
  }

  // === 阅读时间估算 ===
  function estimateReadingTime() {
    const content = document.querySelector('.markdown-section');
    if (content) {
      const text = content.textContent;
      const wordsPerMinute = 200; // 平均阅读速度
      const words = text.trim().split(/\s+/).length;
      const time = Math.ceil(words / wordsPerMinute);
      
      console.log(`📖 预计阅读时间：${time} 分钟`);
    }
  }

  // === 目录高亮 ===
  function highlightTOC() {
    // 空实现，暂不启用
  }

  // === 首页文章分页 ===
  var POSTS_PER_PAGE = 10;
  var currentPage = 1;

  // 保存和恢复当前页码
  function saveCurrentPage() {
    sessionStorage.setItem('homePage', currentPage);
  }

  function restoreCurrentPage() {
    var savedPage = sessionStorage.getItem('homePage');
    if (savedPage) {
      currentPage = parseInt(savedPage);
    }
  }

  function initPagination() {
    var postList = document.querySelector('.post-list');
    var paginationEl = document.getElementById('pagination');
    if (!postList || !paginationEl) return;

    var allCards = Array.prototype.slice.call(postList.querySelectorAll('.post-card'));
    var totalPosts = allCards.length;
    var totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    if (totalPages <= 0) return;
    if (currentPage > totalPages) currentPage = totalPages;

    // 显示/隐藏文章卡片
    allCards.forEach(function(card, i) {
      var start = (currentPage - 1) * POSTS_PER_PAGE;
      var end = start + POSTS_PER_PAGE;
      card.style.display = (i >= start && i < end) ? '' : 'none';
    });

    // 生成分页 HTML
    var html = '<span class="page-info">共 ' + totalPosts + ' 篇文章 · 第 ' + currentPage + '/' + totalPages + ' 页</span>';

    if (totalPages > 1) {
      html += '<div class="page-nav">';
      html += '<span class="page-btn' + (currentPage <= 1 ? ' disabled' : '') + '" data-page="prev">« 上一页</span>';
      html += '<div class="page-numbers">';
      for (var p = 1; p <= totalPages; p++) {
        html += '<span class="page-number' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</span>';
      }
      html += '</div>';
      html += '<span class="page-btn' + (currentPage >= totalPages ? ' disabled' : '') + '" data-page="next">下一页 »</span>';
      html += '</div>';
    }

    paginationEl.innerHTML = html;

    // 绑定点击事件
    paginationEl.querySelectorAll('[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = btn.getAttribute('data-page');
        if (page === 'prev' && currentPage > 1) {
          currentPage--;
        } else if (page === 'next' && currentPage < totalPages) {
          currentPage++;
        }else if (page !== 'prev' && page !== 'next') {
          currentPage = parseInt(page);
        }else {
          return;
        }
        saveCurrentPage();
        initPagination();
        // 滚动到文章列表顶部
        var heroBanner = document.querySelector('.hero-banner');
        if (heroBanner) {
          heroBanner.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // === Hero Banner 动态统计数字 ===
  function animateStats() {
    var statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(function(stat) {
      var text = stat.textContent;
      var num = parseInt(text);
      if (isNaN(num)) return;

      var duration = 1500;
      var start = 0;
      var startTime = null;

      function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        var progress = (currentTime - startTime) / duration;

        if (progress < 1) {
          var current = Math.floor(start + (num - start) * easeOutQuad(progress));
          stat.textContent = current + (text.includes('+') ? '+' : '');
          requestAnimationFrame(animate);
        } else {
          stat.textContent = text;
        }
      }

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      requestAnimationFrame(animate);
    });
  }

  // === 首页页脚管理 ===
  function addHomeFooter() {
    // 避免重复添加
    if (document.querySelector('.home-footer')) return;

    var footer = document.createElement('footer');
    footer.className = 'home-footer';
    footer.innerHTML = `
      <div class="footer-content">
        <p class="copyright">© 2014-2026 Hyper的技术博客 · All Rights Reserved</p>
        <p class="powered-by">Powered by <a href="https://docsify.js.org" target="_blank">Docsify</a></p>
      </div>
    `;

    var mainContent = document.querySelector('.content');
    if (mainContent) {
      mainContent.appendChild(footer);
    }
  }

  function removeHomeFooter() {
    var footer = document.querySelector('.home-footer');
    if (footer) {
      footer.remove();
    }
  }

  // === 首页背景粒子动画 ===
  function createParticles() {
    // 避免重复创建
    if (document.querySelector('.particles-container')) return;

    var container = document.createElement('div');
    container.className = 'particles-container';

    // 创建40个粒子（增加数量）
    for (var i = 0; i < 40; i++) {
      var particle = document.createElement('div');
      particle.className = 'particle';

      // 随机位置
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';

      // 随机大小（增大尺寸范围）
      var size = Math.random() * 8 + 4;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';

      // 随机动画延迟和持续时间
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';

      container.appendChild(particle);
    }

    document.body.appendChild(container);
  }

  function removeParticles() {
    var container = document.querySelector('.particles-container');
    if (container) {
      container.remove();
    }
  }

  // === Docsify 插件 ===
  window.$docsify = window.$docsify || {};

  window.$docsify.plugins = [].concat(window.$docsify.plugins || [], [
    function(hook, vm) {
      // 每次路由切换时触发
      hook.doneEach(function() {
        markExternalLinks();
        addCodeLanguageLabel();
        estimateReadingTime();
        highlightTOC();

        // 首页隐藏侧边栏
        const isHome = window.location.hash === '#/' || window.location.hash === '' || window.location.hash === '#/home';
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const mainContent = document.querySelector('.content');
        const pagination = document.querySelector('.docsify-pagination-container');

        if (isHome) {
          if (sidebar) sidebar.style.display = 'none';
          if (sidebarToggle) sidebarToggle.style.display = 'none';
          if (pagination) pagination.style.display = 'none';
          if (mainContent) mainContent.style.paddingLeft = '0';
          document.body.classList.add('is-home');
          // 恢复之前的页码
          restoreCurrentPage();
          initPagination();
          // 动画统计数字
          setTimeout(animateStats, 100);
          // 添加页脚
          addHomeFooter();
          // 创建粒子动画
          createParticles();
        }else {
          if (sidebar) sidebar.style.display = '';
          if (sidebarToggle) sidebarToggle.style.display = '';
          if (pagination) pagination.style.display = '';
          if (mainContent) mainContent.style.paddingLeft = '';
          document.body.classList.remove('is-home');
          // 移除首页页脚
          removeHomeFooter();
          // 移除粒子动画
          removeParticles();
        }

        // 初始化文章卡片点击
        initPostCardClick();
      });

      // 初始化完成后触发
      hook.mounted(function() {
        initDarkMode();
        initBackToTop();
      });

      // 内容渲染完成后触发
      hook.ready(function() {
        console.log('✨ 所有内容已加载完成');
      });
    }
  ]);

  // === 文章卡片点击跳转 ===
  function initPostCardClick() {
    const postCards = document.querySelectorAll('.post-card');
    postCards.forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function(e) {
        // 如果点击的是链接，不做处理
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          return;
        }
        const link = card.querySelector('.post-title a');
        if (link) {
          link.click();
        }
      });
    });
  }

})();

/* === 添加样式到页面 === */
const style = document.createElement('style');
style.textContent = `
  /* 暗黑模式切换按钮 */
  .dark-mode-toggle {
    position: fixed;
    bottom: 80px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--theme-color);
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 999;
  }
  
  .dark-mode-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  /* 返回顶部按钮 */
  .back-to-top {
    position: fixed;
    bottom: 20px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--theme-color);
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 999;
  }
  
  .back-to-top:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  /* 外部链接图标 */
  .external-link::after {
    content: "↗";
    font-size: 0.8em;
    margin-left: 3px;
    opacity: 0.6;
  }

  /* 活动的目录项 */
  .sidebar-nav a.active {
    background: var(--theme-color);
    color: white !important;
  }
`;
document.head.appendChild(style);
