<?php

defined('ABSPATH') || exit;

add_action('wp_ajax_je_kalender_events', 'je_kalender_ajax_events');
add_action('wp_ajax_nopriv_je_kalender_events', 'je_kalender_ajax_events');
add_action('wp_ajax_je_kalender_geocode', 'je_kalender_ajax_geocode');
add_action('wp_ajax_nopriv_je_kalender_geocode', 'je_kalender_ajax_geocode');

/**
 * Liefert kommende Kalender-Events ueber einen serverseitigen Proxy.
 */
function je_kalender_ajax_events()
{
    check_ajax_referer('je_kalender_frontend', 'nonce');
    je_kalender_mark_frontend_nonce_verified();

    $calendar_id = je_kalender_get_calendar_id();
    $api_key = je_kalender_get_api_key();
    $events_limit = je_kalender_get_events_max_results();
    $max_results = isset($_GET['max'])
        ? max(1, min($events_limit, absint(wp_unslash($_GET['max']))))
        : 50;

    if (empty($calendar_id) || empty($api_key)) {
        wp_send_json_error(['message' => 'Kalender-ID oder API-Key fehlen.'], 400);
    }

    $cache_key = 'je_kal_events_' . md5($calendar_id . '|' . $events_limit);
    $cached_payload = je_kalender_normalize_events_cache_payload(get_transient($cache_key));

    if (
        false !== $cached_payload
        && !$cached_payload['complete']
        && empty($cached_payload['next_page_token'])
        && count($cached_payload['items']) < $max_results
    ) {
        $cached_payload = false;
    }

    if (
        false !== $cached_payload
        && ($cached_payload['complete'] || count($cached_payload['items']) >= $max_results)
    ) {
        wp_send_json_success([
            'items' => array_slice($cached_payload['items'], 0, $max_results),
            'complete' => $cached_payload['complete'],
        ]);
    }

    $events_payload = je_kalender_fetch_calendar_events($calendar_id, $api_key, $max_results, $cached_payload);

    if (is_wp_error($events_payload)) {
        wp_send_json_error(
            je_kalender_build_error_payload(
                $events_payload->get_error_message(),
                $events_payload->get_error_data()
            ),
            502
        );
    }

    set_transient($cache_key, $events_payload, je_kalender_get_events_cache_ttl());

    wp_send_json_success([
        'items' => array_slice($events_payload['items'], 0, $max_results),
        'complete' => $events_payload['complete'],
    ]);
}

/**
 * Normalisiert alte und neue Event-Cache-Inhalte.
 */
function je_kalender_normalize_events_cache_payload($payload)
{
    if (false === $payload) {
        return false;
    }

    if (is_array($payload) && isset($payload['items']) && is_array($payload['items'])) {
        return [
            'items' => $payload['items'],
            'complete' => !empty($payload['complete']),
            'next_page_token' => isset($payload['next_page_token']) ? sanitize_text_field($payload['next_page_token']) : '',
        ];
    }

    if (is_array($payload)) {
        return [
            'items' => $payload,
            'complete' => false,
            'next_page_token' => '',
        ];
    }

    return false;
}

/**
 * Ruft kommende Events paginiert von Google Calendar ab.
 */
function je_kalender_fetch_calendar_events($calendar_id, $api_key, $max_results, $cached_payload = false)
{
    $calendar_id_for_url = rawurlencode(rawurldecode($calendar_id));
    $items = false !== $cached_payload ? $cached_payload['items'] : [];
    $page_token = false !== $cached_payload ? $cached_payload['next_page_token'] : '';

    do {
        $remaining = $max_results - count($items);

        if ($remaining <= 0 || (false !== $cached_payload && empty($page_token))) {
            break;
        }

        $page_size = min(250, $remaining);
        $query_args = [
            'key' => $api_key,
            'timeMin' => gmdate('Y-m-d\TH:i:s\Z'),
            'orderBy' => 'startTime',
            'singleEvents' => 'true',
            'maxResults' => $page_size,
        ];

        if ($page_token) {
            $query_args['pageToken'] = $page_token;
        }

        $url = add_query_arg(
            $query_args,
            'https://www.googleapis.com/calendar/v3/calendars/' . $calendar_id_for_url . '/events'
        );
        $response = je_kalender_remote_get($url);

        if (is_wp_error($response)) {
            return new WP_Error(
                'je_kalender_calendar_unreachable',
                'Google Calendar API konnte nicht erreicht werden.',
                ['wp_error' => $response->get_error_message()]
            );
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $raw_body = wp_remote_retrieve_body($response);
        $body = json_decode($raw_body, true);

        if (is_array($body) && isset($body['error'])) {
            return new WP_Error(
                'je_kalender_calendar_google_error',
                je_kalender_get_google_error_message($body),
                [
                    'status_code' => $status_code,
                    'google_error' => je_kalender_sanitize_google_error($body['error']),
                ]
            );
        }

        if (200 !== $status_code || !is_array($body)) {
            return new WP_Error(
                'je_kalender_calendar_invalid_response',
                'Google Calendar API lieferte keine gueltige Antwort.',
                [
                    'status_code' => $status_code,
                    'response_body' => je_kalender_sanitize_debug_body($raw_body),
                ]
            );
        }

        if (!empty($body['items']) && is_array($body['items'])) {
            $items = array_merge($items, $body['items']);
        }

        $page_token = isset($body['nextPageToken']) ? sanitize_text_field($body['nextPageToken']) : '';
    } while ($page_token && count($items) < $max_results);

    return [
        'items' => array_slice($items, 0, $max_results),
        'complete' => empty($page_token),
        'next_page_token' => $page_token,
    ];
}

/**
 * Liefert Koordinaten fuer eine Adresse ueber den konfigurierten Geocoder.
 */
function je_kalender_ajax_geocode()
{
    check_ajax_referer('je_kalender_frontend', 'nonce');
    je_kalender_mark_frontend_nonce_verified();

    $address = isset($_GET['address']) ? sanitize_text_field(wp_unslash($_GET['address'])) : '';
    $provider = get_option('je_kalender_geocoding_provider', 'opencage');

    if (empty($address)) {
        wp_send_json_error(['message' => 'Adresse fehlt.'], 400);
    }

    $cache_key = 'je_kal_geo_' . md5($provider . '|' . mb_strtolower($address));
    $cached_coordinates = get_transient($cache_key);

    if (false !== $cached_coordinates) {
        wp_send_json_success($cached_coordinates);
    }

    if ('google' === $provider) {
        $coordinates = je_kalender_fetch_google_geocode($address);
    } else {
        $coordinates = je_kalender_fetch_opencage_geocode($address);
    }

    if (is_wp_error($coordinates)) {
        wp_send_json_error(
            je_kalender_build_error_payload(
                $coordinates->get_error_message(),
                [
                    'wp_error_code' => $coordinates->get_error_code(),
                    'wp_error_data' => $coordinates->get_error_data(),
                ]
            ),
            502
        );
    }

    set_transient($cache_key, $coordinates, je_kalender_get_geocoding_cache_ttl());
    wp_send_json_success($coordinates);
}

/**
 * Ermittelt Koordinaten ueber Google Geocoding.
 */
function je_kalender_fetch_google_geocode($address)
{
    $api_key = je_kalender_get_google_geocode_key();

    if (empty($api_key)) {
        return new WP_Error('je_kalender_missing_google_geocode_key', 'Google Geocoding API-Key fehlt.');
    }

    $url = add_query_arg(
        [
            'address' => $address,
            'key' => $api_key,
        ],
        'https://maps.googleapis.com/maps/api/geocode/json'
    );
    $response = je_kalender_remote_get($url);

    if (is_wp_error($response)) {
        return new WP_Error(
            'je_kalender_google_geocode_unreachable',
            'Google Geocoding konnte nicht erreicht werden.',
            ['wp_error' => $response->get_error_message()]
        );
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (!is_array($body) || 'OK' !== ($body['status'] ?? '') || empty($body['results'][0]['geometry']['location'])) {
        return new WP_Error('je_kalender_google_geocode_empty', 'Google Geocoding konnte die Adresse nicht finden.');
    }

    return [
        'lat' => (float) $body['results'][0]['geometry']['location']['lat'],
        'lng' => (float) $body['results'][0]['geometry']['location']['lng'],
    ];
}

/**
 * Ermittelt Koordinaten ueber OpenCage.
 */
function je_kalender_fetch_opencage_geocode($address)
{
    $api_key = je_kalender_get_opencage_key();

    if (empty($api_key)) {
        return new WP_Error('je_kalender_missing_opencage_key', 'OpenCage API-Key fehlt.');
    }

    $url = add_query_arg(
        [
            'q' => $address,
            'key' => $api_key,
        ],
        'https://api.opencagedata.com/geocode/v1/json'
    );
    $response = je_kalender_remote_get($url);

    if (is_wp_error($response)) {
        return new WP_Error(
            'je_kalender_opencage_unreachable',
            'OpenCage konnte nicht erreicht werden.',
            ['wp_error' => $response->get_error_message()]
        );
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (!is_array($body) || empty($body['results'][0]['geometry'])) {
        return new WP_Error('je_kalender_opencage_empty', 'OpenCage konnte die Adresse nicht finden.');
    }

    return [
        'lat' => (float) $body['results'][0]['geometry']['lat'],
        'lng' => (float) $body['results'][0]['geometry']['lng'],
    ];
}

/**
 * Fuehrt Remote-GETs mit Browser-kompatiblem Referrer aus.
 */
function je_kalender_remote_get($url)
{
    return wp_remote_get(
        $url,
        [
            'timeout' => 15,
            'headers' => [
                'Referer' => home_url('/'),
                'User-Agent' => 'JE Kalender/' . JE_KALENDER_PLUGIN_VERSION . '; ' . home_url('/'),
            ],
        ]
    );
}

/**
 * Gibt eine sichere Google-Fehlermeldung ohne API-Key-Daten zurueck.
 */
function je_kalender_get_google_error_message($body)
{
    if (!isset($body['error']) || !is_array($body['error'])) {
        return 'Google API meldete einen Fehler.';
    }

    $code = isset($body['error']['code']) ? absint($body['error']['code']) : 0;
    $status = isset($body['error']['status']) ? sanitize_text_field($body['error']['status']) : '';
    $message = isset($body['error']['message']) ? sanitize_text_field($body['error']['message']) : '';

    if ($message) {
        return trim(sprintf('Google API Fehler %d %s: %s', $code, $status, $message));
    }

    return trim(sprintf('Google API Fehler %d %s.', $code, $status));
}

/**
 * Baut eine sichere Fehlerantwort fuer Frontend-Diagnose.
 */
function je_kalender_build_error_payload($message, $debug = [])
{
    $payload = ['message' => $message];

    if (je_kalender_debug_enabled() && !empty($debug)) {
        $payload['debug'] = $debug;
    }

    return $payload;
}

/**
 * Prueft, ob Diagnoseinformationen ausgegeben werden duerfen.
 */
function je_kalender_debug_enabled()
{
    if (defined('JE_KALENDER_DEBUG') && JE_KALENDER_DEBUG) {
        return true;
    }

    if (!je_kalender_frontend_nonce_verified()) {
        return false;
    }

    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Frontend-Nonce wurde vor dem Debug-Check bereits verifiziert.
    return isset($_GET['debug']) && '1' === sanitize_text_field(wp_unslash($_GET['debug']));
}

/**
 * Markiert den Frontend-Nonce als erfolgreich geprueft.
 */
function je_kalender_mark_frontend_nonce_verified()
{
    $GLOBALS['je_kalender_frontend_nonce_verified'] = true;
}

/**
 * Prueft, ob der Frontend-Nonce bereits erfolgreich geprueft wurde.
 */
function je_kalender_frontend_nonce_verified()
{
    return !empty($GLOBALS['je_kalender_frontend_nonce_verified']);
}

/**
 * Sanitized Google-Fehlerdaten fuer Debug-Antworten.
 */
function je_kalender_sanitize_google_error($error)
{
    if (!is_array($error)) {
        return [];
    }

    return [
        'code' => isset($error['code']) ? absint($error['code']) : 0,
        'status' => isset($error['status']) ? sanitize_text_field($error['status']) : '',
        'message' => isset($error['message']) ? sanitize_text_field($error['message']) : '',
    ];
}

/**
 * Kuerzt und entschärft externe Antworttexte fuer Debug-Ausgaben.
 */
function je_kalender_sanitize_debug_body($body)
{
    $body = sanitize_textarea_field((string) $body);

    return mb_substr($body, 0, 1500);
}
