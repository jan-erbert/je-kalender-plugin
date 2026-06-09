<?php

defined('ABSPATH') || exit;

/**
 * Legt die Tabelle fuer Kalender-Antraege an.
 */
function je_kalender_create_table()
{
    global $wpdb;
    $table_name = $wpdb->prefix . 'je_kalender_antraege';

    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        event_time TIME NULL,
        all_day TINYINT(1) DEFAULT 0,
        description TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}

/**
 * Ergaenzt die Plugin-Capability fuer Administratoren.
 */
function je_kalender_add_custom_capabilities()
{
    $role = get_role('administrator');
    if ($role) {
        $role->add_cap('je_kalender_beantragen');
    }
}

/**
 * Fuehrt die Installationslogik bei Plugin-Aktivierung aus.
 */
function je_kalender_install()
{
    je_kalender_create_table();
    je_kalender_add_custom_capabilities();
}
