// Navigation helper for LLM Wiki — preserves sidebar scroll position
(function() {
    'use strict';

    var currentPath = window.location.pathname;

    // ─────────────────────────────────────────────────
    // SIDEBAR SCROLL RESTORATION (survives full page reloads)
    // ─────────────────────────────────────────────────
    function restoreSidebarScroll() {
        var sidebar = document.querySelector('.sidebar');
        var saved = sessionStorage.getItem('wiki_sidebar_scroll');
        if (sidebar && saved !== null) {
            requestAnimationFrame(function() {
                sidebar.scrollTop = parseInt(saved, 10);
            });
            sessionStorage.removeItem('wiki_sidebar_scroll');
        }
    }

    function saveSidebarScroll() {
        var sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            try {
                sessionStorage.setItem('wiki_sidebar_scroll', sidebar.scrollTop);
            } catch(e) {}
        }
    }

    // ─────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────

    function resolveURL(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.href;
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
    // COLLAPSIBLE SIDEBAR SECTIONS & SUBSECTIONS
    // ─────────────────────────────────────────────────
    function initCollapsible(selector, headerClass, pagesClass, toggleClass) {
        var items = document.querySelectorAll(selector);
        items.forEach(function(item) {
            var header = item.querySelector('.' + headerClass);
            var pages = item.querySelector('.' + pagesClass);
            var toggle = item.querySelector('.' + toggleClass);
            if (!header || !pages) return;

            var hasActive = item.querySelector('a.active') !== null;

            if (hasActive) {
                pages.classList.add('open');
                if (toggle) toggle.classList.add('expanded');
            } else {
                pages.classList.remove('open');
                if (toggle) toggle.classList.remove('expanded');
            }

            header.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                pages.classList.toggle('open');
                if (toggle) toggle.classList.toggle('expanded');
            });
        });
    }

    function initCollapsibleSections() {
        initCollapsible('.sidebar-section', 'section-header', 'section-pages', 'section-toggle');
        initCollapsible('.sidebar-subsection', 'subsection-header', 'subsection-pages', 'subsection-toggle');
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
    // TRY SPA NAVIGATION FIRST, FALL BACK TO FULL LOAD
    // ─────────────────────────────────────────────────
    function navigateTo(url) {
        var absoluteUrl = resolveURL(url);
        if (absoluteUrl === window.location.href) return;

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

                var oldContent = document.querySelector('.main-content');
                oldContent.innerHTML = newContent.innerHTML;

                // Replace sidebar (keeps relative paths correct)
                var newSidebar = doc.querySelector('.sidebar');
                var oldSidebar = document.querySelector('.sidebar');
                var savedScroll = oldSidebar ? oldSidebar.scrollTop : 0;

                if (newSidebar && oldSidebar) {
                    oldSidebar.innerHTML = newSidebar.innerHTML;
                }

                if (newTitle) document.title = newTitle.textContent;

                highlightCurrentPage();
                initCollapsibleSections();
                initSidebarNavigation();

                // Restore sidebar scroll AFTER collapsible sections are adjusted
                // so the sidebar has its correct final height
                if (oldSidebar) {
                    requestAnimationFrame(function() {
                        oldSidebar.scrollTop = savedScroll;
                    });
                }
                initSmoothScroll();
                if (window.renderTOC) window.renderTOC();
                if (window.renderSearch) window.renderSearch();
            })
            .catch(function() {
                // Full page load — scroll already saved to sessionStorage
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
    // BACK/FORWARD — full page load with scroll preserved
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
    initCollapsibleSections();
    initSidebarNavigation();
    restoreSidebarScroll();
    initSmoothScroll();
    restoreSidebarScroll();
})();
