<?php
// Sicherheitscheck: Kein Direktzugriff
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shortcode: [google_calendar]
 * Voller Kalender mit Suche, Filter und Paginierung
 */
function je_google_calendar_shortcode($atts)
{
    $api_key     = je_kalender_get_api_key();
    $calendar_id = je_kalender_get_calendar_id();

    if (empty($api_key) || empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Google API-Key oder Kalender-ID fehlt!</p>';
    }

    $atts = shortcode_atts([
        'max' => 50,
    ], $atts, 'google_calendar');

    ob_start();
?>
    <div id="je-google-calendar"
        data-api-key="<?php echo esc_attr($api_key); ?>"
        data-calendar-id="<?php echo esc_attr($calendar_id); ?>"
        data-max="<?php echo intval($atts['max']); ?>">
        <p>📅 Lade Events…</p>
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('google_calendar', 'je_google_calendar_shortcode');

/**
 * Shortcode: [google_calendar_filtered category="..." max="..."]
 * Reduzierte Version, z. B. für einzelne Kategorien
 */
function je_google_calendar_filtered_shortcode($atts)
{
    $api_key     = je_kalender_get_api_key();
    $calendar_id = je_kalender_get_calendar_id();

    if (empty($api_key) || empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Google API-Key oder Kalender-ID fehlt!</p>';
    }

    $atts = shortcode_atts([
        'category' => '',
        'max'      => 3,
    ], $atts, 'google_calendar_filtered');

    ob_start();
?>
    <ul id="gcal-filtered-events"
        data-api-key="<?php echo esc_attr($api_key); ?>"
        data-calendar-id="<?php echo esc_attr($calendar_id); ?>"
        data-category="<?php echo esc_attr($atts['category']); ?>"
        data-max="<?php echo esc_attr($atts['max']); ?>">
        <li>📅 Lade Events…</li>
    </ul>
<?php
    return ob_get_clean();
}
add_shortcode('google_calendar_filtered', 'je_google_calendar_filtered_shortcode');

/**
 * Assets laden (JS, CSS, Google Maps) – nur wenn Shortcodes verwendet werden
 */
function je_google_calendar_enqueue_assets()
{
    if (is_admin()) return;

    global $post;
    if (!isset($post->post_content)) return;

    $enqueue_common = false;

    // Hauptkalender
    if (has_shortcode($post->post_content, 'google_calendar')) {
        wp_enqueue_script(
            'je-kalender-google-calendar',
            plugin_dir_url(__FILE__) . 'assets/js/je-kalender.js',
            [],
            '1.0',
            true
        );

        wp_localize_script('je-kalender-google-calendar', 'JEKalenderData', [
            'apiKey' => je_get_google_maps_api_key(),
        ]);
    }

    // Gefilterte Kalender
    if (has_shortcode($post->post_content, 'google_calendar_filtered')) {
        wp_enqueue_script(
            'je-kalender-google-calendar-filtered',
            plugin_dir_url(__FILE__) . 'assets/js/je-kalender-filtered.js',
            [],
            '1.0',
            true
        );

        wp_localize_script('je-kalender-google-calendar-filtered', 'JEKalenderDataFiltered', [
            'apiKey' => je_get_google_maps_api_key(),
        ]);
    }

    // Gemeinsame Ressourcen nur einmal laden
    if ($enqueue_common) {
        $api_key = je_kalender_get_api_key();
        if (!empty($api_key)) {
            wp_enqueue_script(
                'google-maps-api',
                'https://maps.googleapis.com/maps/api/js?key=' . esc_attr($api_key) . '&callback=Function.prototype&modules=marker',
                [],
                null,
                true
            );
        }

        wp_enqueue_style(
            'je-google-calendar-style',
            plugin_dir_url(dirname(__FILE__)) . 'assets/css/google-calendar.css',
            [],
            '1.0'
        );
    }
}
add_action('wp_enqueue_scripts', 'je_google_calendar_enqueue_assets');
