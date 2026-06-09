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
