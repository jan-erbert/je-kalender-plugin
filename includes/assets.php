<?php

defined('ABSPATH') || exit;

add_action('wp_enqueue_scripts', 'je_kalender_enqueue_assets_when_needed');

/**
 * Laedt Frontend-Assets nur auf Seiten mit Kalender-Shortcodes.
 */
function je_kalender_enqueue_assets_when_needed()
{
    if (je_kalender_current_page_has_shortcode()) {
        je_kalender_enqueue_scripts();
    }
}

/**
 * Prueft, ob der aktuelle Inhalt einen Kalender-Shortcode enthaelt.
 */
function je_kalender_current_page_has_shortcode()
{
    if (!is_singular()) {
        return false;
    }

    $post = get_post();

    if (!$post instanceof WP_Post) {
        return false;
    }

    return has_shortcode($post->post_content, 'google_calendar')
        || has_shortcode($post->post_content, 'google_calendar_filtered');
}

/**
 * Bindet Scripts, Styles und Frontend-Konfiguration ein.
 */
function je_kalender_enqueue_scripts()
{
    wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', [], '1.9.4');
    wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);

    wp_enqueue_script(
        'je-kalender',
        plugin_dir_url(JE_KALENDER_PLUGIN_FILE) . 'je-kalender.js',
        ['leaflet'],
        filemtime(plugin_dir_path(JE_KALENDER_PLUGIN_FILE) . 'je-kalender.js'),
        true
    );

    wp_enqueue_style(
        'je-kalender-css',
        plugin_dir_url(JE_KALENDER_PLUGIN_FILE) . 'google-calendar.css',
        [],
        filemtime(plugin_dir_path(JE_KALENDER_PLUGIN_FILE) . 'google-calendar.css')
    );

    wp_localize_script('je-kalender', 'JEKalenderData', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('je_kalender_frontend'),
        'geocoder' => get_option('je_kalender_geocoding_provider', 'opencage'),
        'debug' => defined('JE_KALENDER_DEBUG') && JE_KALENDER_DEBUG,
        'eventsMaxResults' => je_kalender_get_events_max_results(),
        'eventsInitialResults' => je_kalender_get_events_initial_results(),
    ]);
}
