<?php

defined('ABSPATH') || exit;

/**
 * Gibt den Google Calendar API-Key aus Konstante oder Option zurueck.
 */
function je_kalender_get_api_key()
{
    if (defined('JE_KALENDER_GOOGLE_API_KEY') && !empty(JE_KALENDER_GOOGLE_API_KEY)) {
        return JE_KALENDER_GOOGLE_API_KEY;
    }

    return get_option('je_kalender_google_api_key', '');
}

/**
 * Gibt die Kalender-ID aus Konstante oder Option zurueck.
 */
function je_kalender_get_calendar_id()
{
    if (defined('JE_KALENDER_CALENDAR_ID') && !empty(JE_KALENDER_CALENDAR_ID)) {
        return JE_KALENDER_CALENDAR_ID;
    }

    return get_option('je_kalender_calendar_id', '');
}

/**
 * Gibt den OpenCage API-Key aus Konstante oder Option zurueck.
 */
function je_kalender_get_opencage_key()
{
    if (defined('JE_KALENDER_OPENCAGE_KEY') && !empty(JE_KALENDER_OPENCAGE_KEY)) {
        return JE_KALENDER_OPENCAGE_KEY;
    }

    return get_option('je_kalender_opencage_key', '');
}

/**
 * Gibt den Google Geocoding API-Key aus Konstante oder Option zurueck.
 */
function je_kalender_get_google_geocode_key()
{
    if (defined('JE_KALENDER_GOOGLE_GEOCODE_KEY') && !empty(JE_KALENDER_GOOGLE_GEOCODE_KEY)) {
        return JE_KALENDER_GOOGLE_GEOCODE_KEY;
    }

    return get_option('je_kalender_google_geocode_key', '');
}

/**
 * Gibt den Google Maps API-Key aus der alten Konstante zurueck.
 */
function je_get_google_maps_api_key()
{
    return defined('JE_GOOGLE_MAPS_API_KEY') ? JE_GOOGLE_MAPS_API_KEY : '';
}

/**
 * Gibt die Google Map-ID aus der alten Konstante zurueck.
 */
function je_get_google_map_id()
{
    return defined('JE_GOOGLE_MAP_ID') ? JE_GOOGLE_MAP_ID : '';
}

/**
 * Sanitized die Auswahl des Geocoding-Anbieters.
 */
function je_kalender_sanitize_geocoding_provider($provider)
{
    $provider = sanitize_text_field($provider);
    $allowed_providers = ['opencage', 'google'];

    if (in_array($provider, $allowed_providers, true)) {
        return $provider;
    }

    return 'opencage';
}

/**
 * Gibt die Cache-Dauer fuer Kalender-Events zurueck.
 */
function je_kalender_get_events_cache_ttl()
{
    return defined('JE_KALENDER_EVENTS_CACHE_TTL')
        ? absint(JE_KALENDER_EVENTS_CACHE_TTL)
        : 30 * MINUTE_IN_SECONDS;
}

/**
 * Gibt die maximal abrufbare Event-Anzahl pro Frontend-Anfrage zurueck.
 */
function je_kalender_get_events_max_results()
{
    return defined('JE_KALENDER_EVENTS_MAX_RESULTS')
        ? max(1, absint(JE_KALENDER_EVENTS_MAX_RESULTS))
        : 1000;
}

/**
 * Gibt die initiale Event-Anzahl fuer den Hauptkalender zurueck.
 */
function je_kalender_get_events_initial_results()
{
    return defined('JE_KALENDER_EVENTS_INITIAL_RESULTS')
        ? max(1, absint(JE_KALENDER_EVENTS_INITIAL_RESULTS))
        : 150;
}

/**
 * Gibt die Cache-Dauer fuer Geocoding-Ergebnisse zurueck.
 */
function je_kalender_get_geocoding_cache_ttl()
{
    return defined('JE_KALENDER_GEOCODING_CACHE_TTL')
        ? absint(JE_KALENDER_GEOCODING_CACHE_TTL)
        : 30 * DAY_IN_SECONDS;
}

/**
 * Leert Kalender- und Geocoding-Transients.
 */
function je_kalender_clear_cache()
{
    return je_kalender_delete_transients_by_prefix('je_kal_events_')
        + je_kalender_delete_transients_by_prefix('je_kal_geo_');
}

/**
 * Loescht Transients anhand eines Prefixes.
 */
function je_kalender_delete_transients_by_prefix($prefix)
{
    global $wpdb;

    $prefix = sanitize_key($prefix);
    $transient_like = $wpdb->esc_like('_transient_' . $prefix) . '%';
    $timeout_like = $wpdb->esc_like('_transient_timeout_' . $prefix) . '%';

    $deleted_transients = $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            $transient_like
        )
    );
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            $timeout_like
        )
    );

    return is_int($deleted_transients) ? $deleted_transients : 0;
}
