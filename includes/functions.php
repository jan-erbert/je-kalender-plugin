<?php
// Funktionen zur Konfiguration

if (!defined('ABSPATH')) exit;

function je_kalender_get_api_key()
{
    if (defined('JE_KALENDER_GOOGLE_API_KEY') && !empty(JE_KALENDER_GOOGLE_API_KEY)) {
        return JE_KALENDER_GOOGLE_API_KEY;
    }
    return '';
}

function je_kalender_get_calendar_id()
{
    if (defined('JE_KALENDER_CALENDAR_ID') && !empty(JE_KALENDER_CALENDAR_ID)) {
        return JE_KALENDER_CALENDAR_ID;
    }
    return '';
}

function je_get_google_maps_api_key()
{
    return defined('JE_GOOGLE_MAPS_API_KEY') ? JE_GOOGLE_MAPS_API_KEY : '';
}

function je_get_google_map_id()
{
    return defined('JE_GOOGLE_MAP_ID') ? JE_GOOGLE_MAP_ID : '';
}
