/**
 * KSM External Link Manager - Vanilla JavaScript Handler
 * Optimized for performance and cache compatibility
 * 
 * @since 1.1
 */

(function() {
    'use strict';
    
    // Performance optimizations
    let processed_links = new WeakSet();
    let current_host = '';
    let current_scheme = '';
    let observer = null;
    let processing_timeout = null;
    
    /**
     * Initialize the external link processor
     * Optimized for minimal DOM manipulation
     * 
     * @since 1.0
     */
    function ksm_elm_initialize() {
        // Get site data from localized script
        if (typeof ksm_elm_data !== 'undefined') {
            current_host = ksm_elm_data.site_host || '';
            current_scheme = ksm_elm_data.site_scheme || 'https';
        }
        
        // Process existing links immediately
        ksm_elm_process_external_links();
        
        // Set up optimized mutation observer for dynamic content
        ksm_elm_setup_observer();
    }
    
    /**
     * Process external links with performance optimizations
     * 
     * @since 1.0
     */
    function ksm_elm_process_external_links() {
        // Use querySelectorAll for better performance than jQuery
        const links = document.querySelectorAll('a[href]');
        
        // Process in batches to avoid blocking UI
        let batch_size = 50;
        let current_batch = 0;
        
        function process_batch() {
            const start = current_batch * batch_size;
            const end = Math.min(start + batch_size, links.length);
            
            for (let i = start; i < end; i++) {
                const link = links[i];
                
                // Skip if already processed
                if (processed_links.has(link)) {
                    continue;
                }
                
                const href = link.getAttribute('href');
                if (!href) {
                    processed_links.add(link);
                    continue;
                }
                
                // Skip special links
                if (ksm_elm_is_special_link(href)) {
                    processed_links.add(link);
                    continue;
                }
                
                // Check if external and process
                if (ksm_elm_is_external_link(href)) {
                    ksm_elm_make_external(link);
                }
                
                processed_links.add(link);
            }
            
            current_batch++;
            
            // Continue processing if there are more links
            if (end < links.length) {
                // Use requestAnimationFrame for smooth processing
                requestAnimationFrame(process_batch);
            }
        }
        
        // Start processing
        process_batch();
    }
    
    /**
     * Make a link external with minimal DOM manipulation
     * 
     * @param {HTMLElement} link
     * @since 1.0
     */
    function ksm_elm_make_external(link) {
        // Set target to _blank
        link.setAttribute('target', '_blank');
        
        // Handle rel attribute efficiently
        const existing_rel = link.getAttribute('rel') || '';
        if (existing_rel) {
            if (existing_rel.indexOf('noopener') === -1) {
                link.setAttribute('rel', existing_rel + ' noopener');
            }
        } else {
            link.setAttribute('rel', 'noopener');
        }
    }
    
    /**
     * Optimized external link detection
     * 
     * @param {string} href
     * @returns {boolean}
     * @since 1.0
     */
    function ksm_elm_is_external_link(href) {
        try {
            // Handle relative URLs quickly
            const first_char = href.charAt(0);
            if (first_char === '/' || first_char === '#' || first_char === '?') {
                return false;
            }
            
            // Handle protocol-relative URLs
            if (href.substring(0, 2) === '//') {
                href = current_scheme + ':' + href;
            }
            
            // Quick check for protocol
            if (!href.startsWith('http://') && !href.startsWith('https://')) {
                return false;
            }
            
            // Use URL constructor for parsing (modern browsers)
            const url = new URL(href);
            const link_host = url.hostname;
            
            // Normalize hosts for comparison
            const normalized_current = current_host.replace(/^www\./, '');
            const normalized_link = link_host.replace(/^www\./, '');
            
            return normalized_current !== normalized_link;
            
        } catch (e) {
            // If URL parsing fails, treat as internal
            return false;
        }
    }
    
    /**
     * Optimized special link detection
     * 
     * @param {string} href
     * @returns {boolean}
     * @since 1.0
     */
    function ksm_elm_is_special_link(href) {
        const first_char = href.charAt(0);
        
        // Quick check for hash links
        if (first_char === '#') {
            return true;
        }
        
        // Check for protocol-based special links
        const protocols = ['javascript:', 'mailto:', 'tel:', 'sms:', 'ftp:'];
        const lower_href = href.toLowerCase();
        
        return protocols.some(protocol => lower_href.startsWith(protocol));
    }
    
    /**
     * Set up optimized mutation observer
     * 
     * @since 1.0
     */
    function ksm_elm_setup_observer() {
        if (!window.MutationObserver) {
            return;
        }
        
        observer = new MutationObserver(function(mutations) {
            let has_new_links = false;
            
            // Check if any new links were added
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'A' || node.querySelector('a')) {
                                has_new_links = true;
                                break;
                            }
                        }
                    }
                    if (has_new_links) break;
                }
            }
            
            if (has_new_links) {
                // Debounce processing to avoid excessive calls
                if (processing_timeout) {
                    clearTimeout(processing_timeout);
                }
                processing_timeout = setTimeout(ksm_elm_process_external_links, 100);
            }
        });
        
        // Start observing with minimal overhead
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Clean up resources
     * 
     * @since 1.0
     */
    function ksm_elm_cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (processing_timeout) {
            clearTimeout(processing_timeout);
            processing_timeout = null;
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ksm_elm_initialize);
    } else {
        ksm_elm_initialize();
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', ksm_elm_cleanup);
    
})();
