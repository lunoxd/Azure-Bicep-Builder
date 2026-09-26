pub mod commands;
pub mod generator;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_az_cli,
            commands::get_az_cli_info,
            commands::install_az_cli_in_app,
            commands::install_bicep_cli_in_app,
            commands::check_login_status,
            commands::azure_login,
            commands::set_subscription,
            commands::list_regions,
            commands::generate_bicep_code,
            commands::run_what_if,
            commands::deploy,
            commands::delete_resource_group,
            commands::check_region_compatibility,
            commands::http_post_form,
            commands::http_get_json,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
