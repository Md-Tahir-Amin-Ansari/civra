mod model;
mod runtime;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(runtime::inference_state())
        .invoke_handler(tauri::generate_handler![
            storage::load_chats,
            storage::load_app_state,
            storage::set_setup_complete,
            storage::set_model_path,
            storage::save_chat,
            storage::rename_chat,
            storage::delete_chat,
            storage::delete_all_chats,
            model::verify_approved_model,
            runtime::runtime_status,
            runtime::choose_approved_model,
            runtime::load_native_engine,
            runtime::stream_native_reply,
            runtime::cancel_native_reply,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
