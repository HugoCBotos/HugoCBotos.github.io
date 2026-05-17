// Navigation helper for BNN Guide — seamless navigation with scroll preservation
(function() {
    'use strict';

    var currentPath = window.location.pathname;

    // ─────────────────────────────────────────────────
    // SIDEBAR SCROLL PRESERVATION
    // ─────────────────────────────────────────────────
    function restoreSidebarScroll() {
        var sidebar = document.querySelector('.sidebar');
        var saved = sessionStorage.getItem('bnn_sidebar_scroll');
        if (sidebar && saved !== null) {
            requestAnimationFrame(function() {
                sidebar.scrollTop = parseInt(saved, 10);
            });
            sessionStorage.removeItem('bnn_sidebar_scroll');
        }
    }

    function saveSidebarScroll() {
        var sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            try {
                sessionStorage.setItem('bnn_sidebar_scroll', sidebar.scrollTop);
            } catch(e) {}
        }
    }

    // ─────────────────────────────────────────────────
    // HIGHLIGHT CURRENT PAGE IN SIDEBAR
    // ─────────────────────────────────────────────────
    function highlightCurrentPage() {
        var links = document.querySelectorAll('.sidebar-nav a');
        links.forEach(function(link) {
            link.classList.remove('active');
            var linkPath = link.getAttribute('href');
            if (currentPath.endsWith(linkPath)) {
                link.classList.add('active');
            }
        });
    }

    // ─────────────────────────────────────────────────
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ─────────────────────────────────────────────────
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            var newAnchor = anchor.cloneNode(true);
            anchor.parentNode.replaceChild(newAnchor, anchor);
            newAnchor.addEventListener('click', function(e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, null, targetId);
                }
            });
        });
    }

    // ─────────────────────────────────────────────────
    // RE-RENDER KATEX AFTER CONTENT SWAP
    // ─────────────────────────────────────────────────
    function rerenderKaTeX() {
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ]
            });
        }
    }

    // ─────────────────────────────────────────────────
    // SEAMLESS NAVIGATION
    // ─────────────────────────────────────────────────
    function resolveURL(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.href;
    }

    function navigateTo(url) {
        var absoluteUrl = resolveURL(url);
        if (absoluteUrl === window.location.href) {
            return;
        }

        saveSidebarScroll();

        fetch(absoluteUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('Fetch failed');
                return response.text();
            })
            .then(function(html) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                var newContent = doc.querySelector('.main-content');
                var newTitle = doc.querySelector('title');
                if (!newContent) throw new Error('No content');

                history.pushState({ path: absoluteUrl }, '', absoluteUrl);
                currentPath = new URL(absoluteUrl).pathname;

                // Replace content
                var oldContent = document.querySelector('.main-content');
                oldContent.innerHTML = newContent.innerHTML;

                // Replace sidebar (keeps relative paths correct)
                var newSidebar = doc.querySelector('.sidebar');
                var oldSidebar = document.querySelector('.sidebar');
                if (newSidebar && oldSidebar) {
                    var savedScroll = oldSidebar.scrollTop;
                    oldSidebar.innerHTML = newSidebar.innerHTML;
                    requestAnimationFrame(function() {
                        oldSidebar.scrollTop = savedScroll;
                    });
                }

                if (newTitle) document.title = newTitle.textContent;

                // Re-init
                highlightCurrentPage();
                initSidebarNavigation();
                initSmoothScroll();
                rerenderKaTeX();
            })
            .catch(function() {
                window.location.href = absoluteUrl;
            });
    }

    function initSidebarNavigation() {
        var links = document.querySelectorAll('.sidebar-nav a');
        links.forEach(function(link) {
            var newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);

            newLink.addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                if (!href || href.startsWith('#') || href === '') return;

                // Don't intercept external links
                if (href.startsWith('http') || href.startsWith('//')) return;

                if (this.classList.contains('active')) {
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                navigateTo(href);
            });
        });
    }

    // ─────────────────────────────────────────────────
    // BACK/FORWARD
    // ─────────────────────────────────────────────────
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.path && e.state.path !== window.location.href) {
            saveSidebarScroll();
            window.location.href = e.state.path;
        }
    });

    // ─────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────
    highlightCurrentPage();
    initSidebarNavigation();
    initSmoothScroll();
    restoreSidebarScroll();
})();
