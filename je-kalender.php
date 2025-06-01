<?php

/**
 * Plugin Name: JE Kalender
 * Description: Google Kalender Integration mit Leaflet-Kartenanzeige für Veranstaltungen.
 * Version: 1.0.2
 * Author: Jan Erbert
 */

defined('ABSPATH') || exit;

// Shortcodes laden
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';

// Scripts & Styles einbinden
add_action('wp_enqueue_scripts', 'je_kalender_enqueue_scripts');
function je_kalender_enqueue_scripts()
{
    wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', [], '1.9.4');
    wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);

    wp_enqueue_script(
        'je-kalender',
        plugin_dir_url(__FILE__) . 'je-kalender.js',
        [],
        filemtime(plugin_dir_path(__FILE__) . 'je-kalender.js'),
        true
    );


    wp_enqueue_style(
        'je-kalender-css',
        plugin_dir_url(__FILE__) . 'google-calendar.css',
        [],
        filemtime(plugin_dir_path(__FILE__) . 'google-calendar.css')
    );

    // API-Keys
    // Google Calendar API Key
    $google_key = defined('JE_KALENDER_GOOGLE_API_KEY')
        ? constant('JE_KALENDER_GOOGLE_API_KEY')
        : get_option('je_kalender_google_api_key', '');

    // OpenCage Key
    $geo_key = defined('JE_KALENDER_OPENCAGE_KEY')
        ? constant('JE_KALENDER_OPENCAGE_KEY')
        : get_option('je_kalender_opencage_key', '');

    // Google Geocode Key
    $google_geocode_key = defined('JE_KALENDER_GOOGLE_GEOCODE_KEY')
        ? constant('JE_KALENDER_GOOGLE_GEOCODE_KEY')
        : get_option('je_kalender_google_geocode_key', '');

    wp_localize_script('je-kalender', 'JEKalenderData', [
        'geocoder' => get_option('je_kalender_geocoding_provider', 'opencage'),
        'googleKey' => esc_attr($google_key),
        'googleGeocodeKey' => esc_attr($google_geocode_key),
        'geoKey'    => esc_attr($geo_key),
        'mapId'     => '',
    ]);
}

// Admin-Menüeintrag
add_action('admin_menu', 'je_kalender_admin_menu');
function je_kalender_admin_menu()
{
    add_options_page('JE Kalender Einstellungen', 'JE Kalender', 'manage_options', 'je-kalender', 'je_kalender_settings_page');
}

// Einstellungsseite
function je_kalender_settings_page()
{
    $selected_provider = get_option('je_kalender_geocoding_provider', 'opencage');
?>
    <div class="wrap">
        <h1>JE Kalender – Einstellungen</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('je_kalender_settings');
            do_settings_sections('je_kalender');
            ?>

            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Geocoding-Methode</th>
                    <td>
                        <select name="je_kalender_geocoding_provider" id="je_geocoding_provider">
                            <option value="opencage" <?php selected($selected_provider, 'opencage'); ?>>OpenCage (kostenlos)</option>
                            <option value="google" <?php selected($selected_provider, 'google'); ?>>Google Maps (präziser)</option>
                        </select>
                        <p class="description">Wähle aus, welcher Dienst zur Geocodierung (Umwandlung von Adressen in Koordinaten) verwendet werden soll.</p>
                    </td>
                </tr>
            </table>

            <?php submit_button(); ?>
        </form>

        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const select = document.getElementById("je_geocoding_provider");
                const updateVisibility = () => {
                    const isGoogle = select.value === "google";
                    document.querySelector("tr.je-opencage").style.display = isGoogle ? "none" : "";
                    document.querySelector("tr.je-google-geocode").style.display = isGoogle ? "" : "none";
                };
                select.addEventListener("change", updateVisibility);
                updateVisibility();
            });
        </script>
    </div>
<?php
}


// Einstellungen registrieren
add_action('admin_init', 'je_kalender_register_settings');
function je_kalender_register_settings()
{
    register_setting('je_kalender_settings', 'je_kalender_geocoding_provider');
    register_setting('je_kalender_settings', 'je_kalender_google_geocode_key');
    register_setting('je_kalender_settings', 'je_kalender_calendar_id');
    register_setting('je_kalender_settings', 'je_kalender_google_api_key');
    register_setting('je_kalender_settings', 'je_kalender_opencage_key');

    add_settings_section(
        'je_kalender_main_section',
        'Kalender-Einstellungen',
        null,
        'je_kalender'
    );

    add_settings_field(
        'je_kalender_calendar_id',
        'Google Kalender-ID',
        'je_kalender_calendar_id_field_cb',
        'je_kalender',
        'je_kalender_main_section'
    );

    add_settings_field(
        'je_kalender_google_api_key',
        'Google API Key (für Kalenderdaten)',
        'je_kalender_google_api_key_field_cb',
        'je_kalender',
        'je_kalender_main_section'
    );

    add_settings_field(
        'je_kalender_opencage_key',
        'OpenCage API Key',
        'je_kalender_opencage_key_field_cb',
        'je_kalender',
        'je_kalender_main_section',
        ['class' => 'je-opencage']
    );

    add_settings_field(
        'je_kalender_google_geocode_key',
        'Google Maps API Key (für Geocoding)',
        'je_kalender_google_geocode_key_field_cb',
        'je_kalender',
        'je_kalender_main_section',
        ['class' => 'je-google-geocode']
    );
}

// Feld: Kalender-ID
function je_kalender_calendar_id_field_cb()
{
    $value = get_option('je_kalender_calendar_id', '');
    echo '<input type="text" name="je_kalender_calendar_id" value="' . esc_attr($value) . '" style="width: 400px;" />';
    echo '<p class="description">Deine Google Kalender-ID (z. B. abc123@group.calendar.google.com)</p>';
}

// Feld: Google API Key
function je_kalender_google_api_key_field_cb()
{
    if (defined('JE_KALENDER_GOOGLE_API_KEY')) {
        echo '<input type="text" disabled value="(via wp-config.php definiert)" style="width: 400px; color: #666;" />';
        echo '<p class="description">Der Google API Key wurde über <code>wp-config.php</code> festgelegt und kann hier nicht geändert werden.</p>';
    } else {
        $value = get_option('je_kalender_google_api_key', '');
        echo '<input type="text" name="je_kalender_google_api_key" value="' . esc_attr($value) . '" style="width: 400px;" />';
        echo '<p class="description">Google API Key mit aktivierter <strong>Google Calendar API</strong>.</p>';
    }
}

// Feld: OpenCage API Key
function je_kalender_opencage_key_field_cb()
{
    if (defined('JE_KALENDER_OPENCAGE_KEY')) {
        echo '<input type="text" disabled value="(via wp-config.php definiert)" style="width: 400px; color: #666;" />';
        echo '<p class="description">Der OpenCage API Key wurde über <code>wp-config.php</code> festgelegt und kann hier nicht geändert werden.</p>';
    } else {
        $value = get_option('je_kalender_opencage_key', '');
        echo '<input type="text" name="je_kalender_opencage_key" value="' . esc_attr($value) . '" style="width: 400px;" />';
        echo '<p class="description">OpenCage Geocoding API Key für Kartenanzeige (<a href="https://opencagedata.com/" target="_blank">opencagedata.com</a>).</p>';
    }
}

// Kalender-ID holen
function je_kalender_get_calendar_id()
{
    return get_option('je_kalender_calendar_id', '');
}

function je_kalender_google_geocode_key_field_cb()
{
    if (defined('JE_KALENDER_GOOGLE_GEOCODE_KEY')) {
        echo '<input type="text" disabled value="(via wp-config.php definiert)" style="width: 400px; color: #666;" />';
        echo '<p class="description">Der Google Geocode API Key wurde über <code>wp-config.php</code> festgelegt und kann hier nicht geändert werden.</p>';
    } else {
        $value = get_option('je_kalender_google_geocode_key', '');
        echo '<input type="text" name="je_kalender_google_geocode_key" value="' . esc_attr($value) . '" style="width: 400px;" />';
        echo '<p class="description">Google API Key mit aktivierter <strong>Geocoding API</strong>.</p>';
    }
}
