// Auto-generate "On This Page" table of contents from <h2> headings
// Also adds slugified IDs to headings for anchor linking
(function() {
    'use strict';

    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/[^\w\s-]/g, '')    // Remove non-word chars
            .replace(/[\s_]+/g, '-')      // Replace spaces/underscores with hyphens
            .replace(/--+/g, '-')         // Collapse multiple hyphens
            .replace(/^-+|-+$/g, '');     // Trim hyphens
    }

    // Expose globally so nav.js can re-run it after content swap
    window.renderTOC = function() {
        // Remove existing TOC first
        var oldToc = document.querySelector('.page-toc');
        if (oldToc) oldToc.remove();

        var mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        var headings = mainContent.querySelectorAll('h2');
        if (headings.length < 2) return;

        var tocEntries = [];
        headings.forEach(function(h, index) {
            if (!h.id) {
                h.id = slugify(h.textContent) || 'section-' + (index + 1);
            }
            tocEntries.push({
                id: h.id,
                text: h.textContent
            });
        });

        var tocHTML = '';
        tocHTML += '<div class="page-toc">';
        tocHTML += '<div class="page-toc-title">📑 On this page</div>';
        tocHTML += '<ul class="page-toc-list">';
        for (var i = 0; i < tocEntries.length; i++) {
            tocHTML += '<li><a href="#' + tocEntries[i].id + '">' + tocEntries[i].text + '</a></li>';
        }
        tocHTML += '</ul></div>';

        var h1 = mainContent.querySelector('h1');
        var firstH2 = mainContent.querySelector('h2');
        if (h1 && firstH2) {
            var tocWrapper = document.createElement('div');
            tocWrapper.innerHTML = tocHTML;
            var tocNode = tocWrapper.firstChild;
            mainContent.insertBefore(tocNode, firstH2);
        }
    };

    // Run on initial load
    window.renderTOC();
})();
