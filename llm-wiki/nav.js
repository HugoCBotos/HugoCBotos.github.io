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

    function initSidebarNavigation() {
        // Let the browser handle navigation natively.
        // No need to intercept clicks — all pages are static HTML.
        var links = document.querySelectorAll('.sidebar-nav a');
        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                if (!href || href.startsWith('#') || href === '') return;
                if (this.classList.contains('active')) {
                    e.preventDefault();
                }
            });
        });
    }

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
