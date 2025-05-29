<?php
/*
Plugin Name: JE Kalender
Plugin URI:  https://jan-erbert.de
Description: Kalender-Shortcodes mit Google Calendar Integration und Antragssystem.
Version:     0.2.1
Author:      Jan Erbert
Author URI:  https://jan-erbert.de
License:     GPLv2 oder neuer
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: je-kalender
*/

// Sicherheitscheck: Kein Direktzugriff
if (!defined('ABSPATH')) {
    exit;
}
require_once plugin_dir_path(__FILE__) . 'includes/functions.php';
// Lade API-Loader nach vollständigem Laden von WordPress
add_action('plugins_loaded', function () {
    require_once plugin_dir_path(__FILE__) . 'includes/api-loader.php';
});

// Lade separate Funktionsdateien (für bessere Wartbarkeit)
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';
require_once plugin_dir_path(__FILE__) . 'includes/antrag-cpt.php';
require_once plugin_dir_path(__FILE__) . 'includes/backend-menu.php';

// Bei Aktivierung: Tabelle anlegen & Rechte vergeben
register_activation_hook(__FILE__, 'je_kalender_on_activation');
function je_kalender_on_activation()
{
    require_once plugin_dir_path(__FILE__) . 'includes/install.php';
    je_kalender_create_table();
    je_kalender_add_custom_capabilities();
}

// JS-Dateien für Google Kalender Shortcodes einbinden
function je_kalender_enqueue_scripts()
{
    if (is_admin()) return;

    global $post;
    if (!isset($post->post_content)) return;

    $api_key = je_get_google_maps_api_key();
    $enqueue_common = false;

    if (has_shortcode($post->post_content, 'google_calendar')) {
        wp_enqueue_script(
            'je-kalender-google-calendar',
            plugin_dir_url(__FILE__) . 'assets/js/je-kalender.js',
            [],
            '1.0',
            true
        );

        // Lokalisierung für JS (Maps API Key)
        wp_localize_script('je-kalender-google-calendar', 'JEKalenderData', [
            'apiKey' => esc_attr($api_key),
        ]);

        $enqueue_common = true;
    }

    if (has_shortcode($post->post_content, 'google_calendar_filtered')) {
        wp_enqueue_script(
            'je-kalender-google-calendar-filtered',
            plugin_dir_url(__FILE__) . 'assets/js/je-kalender-filtered.js',
            [],
            '1.0',
            true
        );

        wp_localize_script('je-kalender-google-calendar-filtered', 'JEKalenderDataFiltered', [
            'apiKey' => esc_attr($api_key),
        ]);

        $enqueue_common = true;
    }

    if ($enqueue_common) {
        wp_enqueue_style(
            'je-kalender-style',
            plugin_dir_url(__FILE__) . 'assets/css/google-calendar.css',
            [],
            '1.0'
        );
    }
}

add_action('wp_enqueue_scripts', 'je_kalender_enqueue_scripts');


// Bei Deaktivierung: Rechte entfernen (optional)
//register_deactivation_hook(__FILE__, 'je_kalender_on_deactivation');
//function je_kalender_on_deactivation() {
//    $role = get_role('administrator');
//    if ($role) {
//        $role->remove_cap('je_kalender_beantragen');
//    }
//}
