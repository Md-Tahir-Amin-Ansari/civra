mod model;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            storage::load_chats,
            storage::load_app_state,
            storage::set_setup_complete,
            storage::save_chat,
            storage::rename_chat,
            storage::delete_chat,
            storage::delete_all_chats,
            model::verify_approved_model,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
