<?php

/**
 * Plugin Name: JE Kalender
 * Description: Google Kalender Integration mit Leaflet-Kartenanzeige für Veranstaltungen.
 * Version: 1.1.3
 * Author: Jan Erbert
 */

defined('ABSPATH') || exit;

define('JE_KALENDER_PLUGIN_FILE', __FILE__);
define('JE_KALENDER_PLUGIN_VERSION', '1.1.3');

// Pluginmodule laden
require_once plugin_dir_path(__FILE__) . 'includes/functions.php';
require_once plugin_dir_path(__FILE__) . 'includes/assets.php';
require_once plugin_dir_path(__FILE__) . 'includes/admin.php';
require_once plugin_dir_path(__FILE__) . 'includes/ajax.php';
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';
require_once plugin_dir_path(__FILE__) . 'includes/install.php';

register_activation_hook(__FILE__, 'je_kalender_install');
