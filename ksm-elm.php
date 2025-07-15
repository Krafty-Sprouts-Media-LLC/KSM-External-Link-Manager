<?php
/**
 * Plugin Name: KSM External Link Manager
 * Plugin URI: https://kraftysprouts.com
 * Description: Automatically opens all external links in a new tab for better UX and SEO.
 * Version: 1.1
 * Author: Krafty Sprouts Media
 * Author URI: https://kraftysprouts.com
 * License: GPL2
 * Text Domain: ksm-elm
 * Requires PHP: 8.2
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Check PHP version compatibility
if (version_compare(PHP_VERSION, '8.2', '<')) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-error"><p>';
        echo __('KSM External Link Manager requires PHP 8.2 or higher. Current version: ' . PHP_VERSION, 'ksm-elm');
        echo '</p></div>';
    });
    return;
}

/**
 * Main Plugin Class - Optimized for PHP 8.2+ and High Performance
 * 
 * Handles the initialization and core functionality of the KSM External Link Manager plugin
 */
final class KSM_ELM_External_Link_Manager {
    
    /**
     * Plugin version
     */
    public const VERSION = '1.1';
    
    /**
     * Plugin text domain
     */
    public const TEXT_DOMAIN = 'ksm-elm';
    
    /**
     * Singleton instance
     */
    private static ?self $instance = null;
    
    /**
     * Script data cache
     */
    private static ?array $script_data = null;
    
    /**
     * Get singleton instance
     * 
     * @return self
     */
    public static function get_instance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Private constructor - Singleton pattern
     */
    private function __construct() {
        // Hook directly to wp_enqueue_scripts for better performance
        // Only run on frontend and avoid unnecessary init hook
        if (!is_admin() && !wp_doing_ajax() && !wp_is_json_request()) {
            add_action('wp_enqueue_scripts', [$this, 'ksm_elm_enqueue_scripts'], 20);
        }
    }
    
    /**
     * Enqueue JavaScript file for handling external links
     * Optimized for caching and minimal server load
     * 
     * @since 1.0
     */
    public function ksm_elm_enqueue_scripts(): void {
        // Skip if not on frontend or if doing AJAX
        if (is_admin() || wp_doing_ajax() || wp_is_json_request()) {
            return;
        }
        
        // Generate script data only once and cache it
        if (self::$script_data === null) {
            self::$script_data = $this->ksm_elm_get_script_data();
        }
        
        // Enqueue the external link handler script
        wp_enqueue_script(
            'ksm-elm-handler',
            plugin_dir_url(__FILE__) . 'assets/js/ksm-elm-handler.js',
            [], // Remove jQuery dependency for better performance
            self::VERSION,
            true
        );
        
        // Pass minimal data to JavaScript
        wp_localize_script(
            'ksm-elm-handler',
            'ksm_elm_data',
            self::$script_data
        );
    }
    
    /**
     * Get script data with caching consideration
     * 
     * @return array
     */
    private function ksm_elm_get_script_data(): array {
        // Try to get from object cache first (if available)
        $cache_key = 'ksm_elm_script_data_' . md5(home_url());
        $cached_data = wp_cache_get($cache_key, 'ksm_elm');
        
        if ($cached_data !== false) {
            return $cached_data;
        }
        
        // Generate data
        $home_url = home_url();
        $parsed_url = parse_url($home_url);
        
        $data = [
            'site_host' => $parsed_url['host'] ?? '',
            'site_scheme' => $parsed_url['scheme'] ?? 'https'
        ];
        
        // Cache for 1 hour (3600 seconds)
        wp_cache_set($cache_key, $data, 'ksm_elm', 3600);
        
        return $data;
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization
     */
    public function __wakeup(): void {
        throw new \Exception('Cannot unserialize singleton');
    }
}

/**
 * Initialize the plugin - Optimized singleton pattern
 * 
 * @since 1.0
 */
function ksm_elm_initialize_plugin(): void {
    // Use singleton pattern to prevent multiple instances
    KSM_ELM_External_Link_Manager::get_instance();
}

// Hook into WordPress with minimal overhead
add_action('plugins_loaded', 'ksm_elm_initialize_plugin', 10);

/**
 * Plugin activation hook - Minimal processing
 * 
 * @since 1.0
 */
function ksm_elm_activate_plugin(): void {
    // Clear any existing cache
    if (function_exists('wp_cache_flush_group')) {
        wp_cache_flush_group('ksm_elm');
    }
    
    // Flush rewrite rules only if needed (none for this plugin)
    // flush_rewrite_rules(); // Not needed for this plugin
}

/**
 * Plugin deactivation hook - Clean up cache
 * 
 * @since 1.0
 */
function ksm_elm_deactivate_plugin(): void {
    // Clear plugin cache on deactivation
    if (function_exists('wp_cache_flush_group')) {
        wp_cache_flush_group('ksm_elm');
    }
}

// Register activation and deactivation hooks
register_activation_hook(__FILE__, 'ksm_elm_activate_plugin');
register_deactivation_hook(__FILE__, 'ksm_elm_deactivate_plugin');
