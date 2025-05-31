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
    $calendar_id = je_kalender_get_calendar_id();

    if (empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Kalender-ID fehlt!</p>';
    }

    $atts = shortcode_atts([
        'max' => 50,
    ], $atts, 'google_calendar');

    ob_start();
?>
    <div id="je-google-calendar"
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
 * Reduzierte Version für Kategorien
 */
function je_google_calendar_filtered_shortcode($atts)
{
    $calendar_id = je_kalender_get_calendar_id();

    if (empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Kalender-ID fehlt!</p>';
    }

    $atts = shortcode_atts([
        'category' => '',
        'max'      => 3,
    ], $atts, 'google_calendar_filtered');

    ob_start();
?>
    <ul id="gcal-filtered-events"
        data-calendar-id="<?php echo esc_attr($calendar_id); ?>"
        data-category="<?php echo esc_attr($atts['category']); ?>"
        data-max="<?php echo esc_attr($atts['max']); ?>">
        <li>📅 Lade Events…</li>
    </ul>
<?php
    return ob_get_clean();
}
add_shortcode('google_calendar_filtered', 'je_google_calendar_filtered_shortcode');
