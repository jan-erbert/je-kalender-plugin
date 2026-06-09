<?php

defined('ABSPATH') || exit;

add_action('admin_menu', 'je_kalender_admin_menu');
add_action('admin_init', 'je_kalender_register_settings');
add_action('admin_enqueue_scripts', 'je_kalender_enqueue_admin_assets');

/**
 * Registriert den Admin-Menueeintrag.
 */
function je_kalender_admin_menu()
{
    add_options_page(
        'JE Kalender Einstellungen',
        'JE Kalender',
        'manage_options',
        'je-kalender',
        'je_kalender_settings_page'
    );
}

/**
 * Laedt Admin-Assets nur auf der Plugin-Einstellungsseite.
 */
function je_kalender_enqueue_admin_assets($hook_suffix)
{
    if ('settings_page_je-kalender' !== $hook_suffix) {
        return;
    }

    wp_enqueue_script(
        'je-kalender-admin',
        plugin_dir_url(JE_KALENDER_PLUGIN_FILE) . 'je-kalender-admin.js',
        [],
        filemtime(plugin_dir_path(JE_KALENDER_PLUGIN_FILE) . 'je-kalender-admin.js'),
        true
    );
}

/**
 * Rendert die Einstellungsseite.
 */
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
    </div>
    <?php
}

/**
 * Registriert Plugin-Einstellungen.
 */
function je_kalender_register_settings()
{
    register_setting(
        'je_kalender_settings',
        'je_kalender_geocoding_provider',
        ['sanitize_callback' => 'je_kalender_sanitize_geocoding_provider']
    );
    register_setting(
        'je_kalender_settings',
        'je_kalender_google_geocode_key',
        ['sanitize_callback' => 'sanitize_text_field']
    );
    register_setting(
        'je_kalender_settings',
        'je_kalender_calendar_id',
        ['sanitize_callback' => 'sanitize_text_field']
    );
    register_setting(
        'je_kalender_settings',
        'je_kalender_google_api_key',
        ['sanitize_callback' => 'sanitize_text_field']
    );
    register_setting(
        'je_kalender_settings',
        'je_kalender_opencage_key',
        ['sanitize_callback' => 'sanitize_text_field']
    );

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

/**
 * Rendert das Feld fuer die Kalender-ID.
 */
function je_kalender_calendar_id_field_cb()
{
    $value = get_option('je_kalender_calendar_id', '');
    echo '<input type="text" name="je_kalender_calendar_id" value="' . esc_attr($value) . '" style="width: 400px;" />';
    echo '<p class="description">Deine Google Kalender-ID (z. B. abc123@group.calendar.google.com)</p>';
}

/**
 * Rendert das Feld fuer den Google Calendar API-Key.
 */
function je_kalender_google_api_key_field_cb()
{
    if (defined('JE_KALENDER_GOOGLE_API_KEY')) {
        echo '<input type="text" disabled value="(via wp-config.php definiert)" style="width: 400px; color: #666;" />';
        echo '<p class="description">Der Google API Key wurde über <code>wp-config.php</code> festgelegt und kann hier nicht geändert werden.</p>';
        return;
    }

    $value = get_option('je_kalender_google_api_key', '');
    echo '<input type="text" name="je_kalender_google_api_key" value="' . esc_attr($value) . '" style="width: 400px;" />';
    echo '<p class="description">Google API Key mit aktivierter <strong>Google Calendar API</strong>.</p>';
}

/**
 * Rendert das Feld fuer den OpenCage API-Key.
 */
function je_kalender_opencage_key_field_cb()
{
    if (defined('JE_KALENDER_OPENCAGE_KEY')) {
        echo '<input type="text" disabled value="(via wp-config.php definiert)" style="width: 400px; color: #666;" />';
        echo '<p class="description">Der OpenCage API Key wurde über <code>wp-config.php</code> festgelegt und kann hier nicht geändert werden.</p>';
        return;
    }

    $value = get_option('je_kalender_opencage_key', '');
    echo '<input type="text" name="je_kalender_opencage_key" value="' . esc_attr($value) . '" style="width: 400px;" />';
    echo '<p class="description">OpenCage Geocoding API Key für Kartenanzeige (<a href="https://opencagedata.com/" target="_blank" rel="noopener noreferrer">opencagedata.com</a>).</p>';
}

/**
 * Rendert das Feld fuer den Google Geocoding API-Key.
 */
function je_kalender_google_geocode_key_field_cb()
{
    if (defined('JE_KALENDER_GOOGLE_GEOCODE_KEY')) {
        echo '<input type="text" disabled value="(via wp-config.php definiert)" style="width: 400px; color: #666;" />';
        echo '<p class="description">Der Google Geocode API Key wurde über <code>wp-config.php</code> festgelegt und kann hier nicht geändert werden.</p>';
        return;
    }

    $value = get_option('je_kalender_google_geocode_key', '');
    echo '<input type="text" name="je_kalender_google_geocode_key" value="' . esc_attr($value) . '" style="width: 400px;" />';
    echo '<p class="description">Google API Key mit aktivierter <strong>Geocoding API</strong>.</p>';
}
