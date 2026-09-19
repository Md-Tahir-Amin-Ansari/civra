use libloading::Library;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const RUNTIME_FILE_NAME: &str = "litert-lm.dll";
const RUNTIME_VERSION: &str = "0.17.1";
const REQUIRED_SYMBOLS: &[&[u8]] = &[
    b"litert_lm_engine_settings_create\0",
    b"litert_lm_engine_settings_delete\0",
    b"litert_lm_engine_create\0",
    b"litert_lm_engine_delete\0",
    b"litert_lm_conversation_create\0",
    b"litert_lm_conversation_delete\0",
    b"litert_lm_conversation_send_message_stream\0",
    b"litert_lm_conversation_cancel_process\0",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub available: bool,
    pub version: &'static str,
    pub detail: String,
}

fn runtime_path(resource_dir: &Path) -> PathBuf {
    resource_dir.join(RUNTIME_FILE_NAME)
}

fn inspect_runtime(path: &Path) -> RuntimeStatus {
    if !path.is_file() {
        return RuntimeStatus {
            available: false,
            version: RUNTIME_VERSION,
            detail: "Civra's local AI runtime is not installed yet.".to_owned(),
        };
    }

    // This opens the library solely to confirm the native interface Civra was
    // built against. It does not load a model, allocate an engine, or send data.
    let library = match unsafe { Library::new(path) } {
        Ok(library) => library,
        Err(_) => {
            return RuntimeStatus {
                available: false,
                version: RUNTIME_VERSION,
                detail: "Civra's local AI runtime could not be started.".to_owned(),
            }
        }
    };

    for symbol in REQUIRED_SYMBOLS {
        let present = unsafe { library.get::<unsafe extern "C" fn()>(symbol) }.is_ok();
        if !present {
            return RuntimeStatus {
                available: false,
                version: RUNTIME_VERSION,
                detail: "Civra's local AI runtime is incompatible with this app version."
                    .to_owned(),
            };
        }
    }

    RuntimeStatus {
        available: true,
        version: RUNTIME_VERSION,
        detail: "Civra's local AI runtime is ready.".to_owned(),
    }
}

#[tauri::command]
pub fn runtime_status(app: AppHandle) -> Result<RuntimeStatus, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|error| format!("Civra could not locate its local runtime: {error}"))?;
    Ok(inspect_runtime(&runtime_path(&resource_dir)))
}

#[cfg(test)]
mod tests {
    use super::{inspect_runtime, runtime_path, RUNTIME_FILE_NAME, RUNTIME_VERSION};
    use std::path::Path;

    #[test]
    fn finds_the_runtime_beside_the_app_resources() {
        assert_eq!(
            runtime_path(Path::new("C:/Civra/resources")),
            Path::new("C:/Civra/resources").join(RUNTIME_FILE_NAME)
        );
    }

    #[test]
    fn reports_a_missing_runtime_without_loading_a_model() {
        let status = inspect_runtime(Path::new("C:/Civra/no-such-litert-runtime.dll"));
        assert!(!status.available);
        assert_eq!(status.version, RUNTIME_VERSION);
    }
}
