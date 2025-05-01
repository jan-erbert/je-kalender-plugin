<?php
// Sicherheitscheck: Kein Direktzugriff
if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'api-loader.php';

/**
 * Shortcode: [google_calendar] 
 * Zeigt Events aus Google Calendar mit Such-, Filter- und Kartenfunktion.
 */
function je_google_calendar_events($atts) {
    $api_key     = je_kalender_get_api_key();
    $calendar_id = je_kalender_get_calendar_id();

    if (empty($api_key) || empty($calendar_id)) {
        return '<p style="color:red;">⚠️ Google API-Key oder Kalender-ID fehlt! Bitte konfigurieren.</p>';
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

        <p>📅 Lade Events...</p>

        <!-- Filterleiste -->
        <div class="je-calendar-filters">
            <input type="text" id="event-search" placeholder="🔍 Suche nach Events...">
            <select id="category-filter">
                <option value="Alle">Alle Kategorien</option>
            </select>
            <label>
                <input type="checkbox" id="competition-checkbox">
                Nur Wettkämpfe anzeigen
            </label>
        </div>

        <!-- Eventliste -->
        <ul id="events" class="je-event-list"></ul>

        <!-- Pagination -->
        <div class="je-calendar-pagination">
            <button id="prev-page">⬅️ Zurück</button>
            <span id="page-info">Seite 1</span>
            <button id="next-page">Weiter ➡️</button>
        </div>
    </div>
    <script>
        const jeKalender = {
            apiKey: "<?php echo esc_js($api_key); ?>",
            calendarId: "<?php echo esc_js($calendar_id); ?>"
        };
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('google_calendar', 'je_google_calendar_events');

/**
 * Skripte und Styles nur einbinden, wenn Shortcode verwendet wird
 */
function je_google_calendar_enqueue_scripts() {
    if (!is_admin() && has_shortcode(get_post_field('post_content', get_the_ID()), 'google_calendar')) {
        wp_enqueue_script(
            'je-google-calendar',
            plugin_dir_url(dirname(__FILE__)) . 'assets/js/je-kalender.js',
            [],
            '1.0',
            true
        );
        wp_enqueue_style(
            'je-google-calendar-style',
            plugin_dir_url(dirname(__FILE__)) . 'assets/css/google-calendar.css',
            [],
            '1.0'
        );
    }
}
add_action('wp_enqueue_scripts', 'je_google_calendar_enqueue_scripts');
