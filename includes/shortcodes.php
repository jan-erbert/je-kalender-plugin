<?php
// Sicherheitscheck: Kein Direktzugriff
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shortcode: [google_calendar max="50"]
 * Voller Kalender mit Suche, Filter und Paginierung
 */
function je_google_calendar_shortcode($atts)
{
    je_kalender_enqueue_scripts();

    $calendar_id = je_kalender_get_calendar_id();

    if (empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Kalender-ID fehlt!</p>';
    }

    $atts = shortcode_atts([
        'max' => 50,
    ], $atts, 'google_calendar');
    $container_id = wp_unique_id('je-google-calendar-');
    $max_results = max(1, absint($atts['max']));

    ob_start();
?>
    <div id="<?php echo esc_attr($container_id); ?>"
        class="je-google-calendar je-kalender-container"
        data-calendar-id="<?php echo esc_attr($calendar_id); ?>"
        data-max="<?php echo esc_attr($max_results); ?>">
        <p>📅 Lade Events…</p>
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('google_calendar', 'je_google_calendar_shortcode');

/**
 * Shortcode: [google_calendar_filtered category="..." max="..."]
 * Reduzierte Version für Kategorien
 */
function je_google_calendar_filtered_shortcode($atts)
{
    je_kalender_enqueue_scripts();

    $calendar_id = je_kalender_get_calendar_id();

    if (empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Kalender-ID fehlt!</p>';
    }

    $atts = shortcode_atts([
        'category' => '',
        'max'      => 3,
    ], $atts, 'google_calendar_filtered');
    $container_id = wp_unique_id('gcal-filtered-events-');
    $category = sanitize_text_field($atts['category']);
    $max_results = max(1, absint($atts['max']));

    ob_start();
?>
    <ul id="<?php echo esc_attr($container_id); ?>"
        class="gcal-filtered-events je-kalender-container"
        data-calendar-id="<?php echo esc_attr($calendar_id); ?>"
        data-category="<?php echo esc_attr($category); ?>"
        data-max="<?php echo esc_attr($max_results); ?>">
        <li>📅 Lade Events…</li>
    </ul>
<?php
    return ob_get_clean();
}
add_shortcode('google_calendar_filtered', 'je_google_calendar_filtered_shortcode');
