<?php
// Datei: includes/install.php

// Sicherheitscheck
if (!defined('ABSPATH')) {
    exit;
}

// Tabelle für Kalender-Anträge anlegen
function je_kalender_create_table() {
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

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Benutzerrechte (Capabilities) hinzufügen
function je_kalender_add_custom_capabilities() {
    $role = get_role('administrator');
    if ($role) {
        $role->add_cap('je_kalender_beantragen');
    }
}

// Installationsfunktion
function je_kalender_install() {
    je_kalender_create_table();
    je_kalender_add_custom_capabilities();
}

// Hook bei Plugin-Aktivierung
register_activation_hook(__FILE__, 'je_kalender_install');