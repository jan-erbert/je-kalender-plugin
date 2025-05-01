<?php
// Funktionen zur Konfiguration

if (!defined('ABSPATH')) exit;

function je_kalender_get_api_key() {
    if (defined('JE_KALENDER_GOOGLE_API_KEY') && !empty(JE_KALENDER_GOOGLE_API_KEY)) {
        return JE_KALENDER_GOOGLE_API_KEY;
    }
    return '';
}

function je_kalender_get_calendar_id() {
    if (defined('JE_KALENDER_CALENDAR_ID') && !empty(JE_KALENDER_CALENDAR_ID)) {
        return JE_KALENDER_CALENDAR_ID;
    }
    return '';
}
