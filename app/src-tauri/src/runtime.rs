use libloading::Library;
use serde::Serialize;
use std::{
    ffi::{c_char, c_void, CString},
    path::{Path, PathBuf},
    sync::{mpsc, Arc, Mutex},
};
use tauri::{AppHandle, Emitter, Manager, State};

const RUNTIME_FILE_NAME: &str = "litert-lm.dll";
const RUNTIME_VERSION: &str = "0.17.1";
type OpaqueHandle = *mut c_void;
type CreateEngineSettings = unsafe extern "C" fn(
    *const c_char,
    *const c_char,
    *const c_char,
    *const c_char,
) -> OpaqueHandle;
type DeleteHandle = unsafe extern "C" fn(OpaqueHandle);
type SetMaxTokens = unsafe extern "C" fn(OpaqueHandle, i32);
type SetThreadCount = unsafe extern "C" fn(OpaqueHandle, i32);
type CreateEngine = unsafe extern "C" fn(OpaqueHandle) -> OpaqueHandle;
type CreateHandle = unsafe extern "C" fn() -> OpaqueHandle;
type SetHandle = unsafe extern "C" fn(OpaqueHandle, OpaqueHandle);
type SetJson = unsafe extern "C" fn(OpaqueHandle, *const c_char);
type CreateConversation = unsafe extern "C" fn(OpaqueHandle, OpaqueHandle) -> OpaqueHandle;
type StreamCallback = unsafe extern "C" fn(*mut c_void, OpaqueHandle);
type SendStream = unsafe extern "C" fn(
    OpaqueHandle,
    *const c_char,
    *const c_char,
    OpaqueHandle,
    StreamCallback,
    *mut c_void,
) -> i32;
type GetChunkText = unsafe extern "C" fn(OpaqueHandle) -> *const c_char;
type GetChunkError = unsafe extern "C" fn(OpaqueHandle) -> *const c_char;
type IsChunkFinal = unsafe extern "C" fn(OpaqueHandle) -> bool;
type CancelConversation = unsafe extern "C" fn(OpaqueHandle);

/// Direct bindings to the small, stable portion of LiteRT-LM's native API that
/// Civra currently needs. The `Library` stays owned here so these copied
/// function pointers can never outlive their DLL.
#[allow(dead_code)] // Wired into the chat command in the next native-inference slice.
struct NativeRuntime {
    _library: Library,
    create_engine_settings: CreateEngineSettings,
    delete_engine_settings: DeleteHandle,
    set_max_tokens: SetMaxTokens,
    set_thread_count: SetThreadCount,
    create_engine: CreateEngine,
    delete_engine: DeleteHandle,
    create_session_config: CreateHandle,
    delete_session_config: DeleteHandle,
    create_conversation_config: CreateHandle,
    delete_conversation_config: DeleteHandle,
    set_conversation_session_config: SetHandle,
    set_conversation_messages: SetJson,
    create_conversation: CreateConversation,
    delete_conversation: DeleteHandle,
    send_stream: SendStream,
    get_chunk_text: GetChunkText,
    get_chunk_error: GetChunkError,
    is_chunk_final: IsChunkFinal,
    cancel_conversation: CancelConversation,
}

#[allow(dead_code)] // The loaded-engine owner is intentionally introduced before streaming.
impl NativeRuntime {
    fn load(path: &Path) -> Result<Self, String> {
        let library = unsafe { Library::new(path) }
            .map_err(|_| "Civra's local AI runtime could not be started.".to_owned())?;

        unsafe {
            Ok(Self {
                create_engine_settings: *library
                    .get(b"litert_lm_engine_settings_create\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                delete_engine_settings: *library
                    .get(b"litert_lm_engine_settings_delete\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                set_max_tokens: *library
                    .get(b"litert_lm_engine_settings_set_max_num_tokens\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                set_thread_count: *library
                    .get(b"litert_lm_engine_settings_set_num_threads\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                create_engine: *library.get(b"litert_lm_engine_create\0").map_err(|_| {
                    "Civra's local AI runtime is incompatible with this app version."
                })?,
                delete_engine: *library.get(b"litert_lm_engine_delete\0").map_err(|_| {
                    "Civra's local AI runtime is incompatible with this app version."
                })?,
                create_session_config: *library.get(b"litert_lm_session_config_create\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                delete_session_config: *library.get(b"litert_lm_session_config_delete\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                create_conversation_config: *library
                    .get(b"litert_lm_conversation_config_create\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                delete_conversation_config: *library
                    .get(b"litert_lm_conversation_config_delete\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                set_conversation_session_config: *library
                    .get(b"litert_lm_conversation_config_set_session_config\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                set_conversation_messages: *library
                    .get(b"litert_lm_conversation_config_set_messages\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                create_conversation: *library.get(b"litert_lm_conversation_create\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                delete_conversation: *library.get(b"litert_lm_conversation_delete\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                send_stream: *library
                    .get(b"litert_lm_conversation_send_message_stream\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                get_chunk_text: *library.get(b"litert_lm_stream_chunk_get_text\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                get_chunk_error: *library.get(b"litert_lm_stream_chunk_get_error\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                is_chunk_final: *library.get(b"litert_lm_stream_chunk_is_final\0").map_err(
                    |_| "Civra's local AI runtime is incompatible with this app version.",
                )?,
                cancel_conversation: *library
                    .get(b"litert_lm_conversation_cancel_process\0")
                    .map_err(|_| {
                        "Civra's local AI runtime is incompatible with this app version."
                    })?,
                _library: library,
            })
        }
    }

    fn create_cpu_engine(self, model_path: &Path, max_tokens: i32) -> Result<NativeEngine, String> {
        let model_path = CString::new(model_path.to_string_lossy().as_bytes())
            .map_err(|_| "The model path contains an unsupported character.")?;
        let cpu = CString::new("cpu").expect("static CPU backend has no NUL byte");
        let settings = unsafe {
            (self.create_engine_settings)(
                model_path.as_ptr(),
                cpu.as_ptr(),
                std::ptr::null(),
                std::ptr::null(),
            )
        };
        if settings.is_null() {
            return Err("Civra could not configure the local AI engine.".to_owned());
        }

        unsafe {
            (self.set_thread_count)(settings, recommended_cpu_threads());
            (self.set_max_tokens)(settings, max_tokens);
        }
        let handle = unsafe { (self.create_engine)(settings) };
        unsafe { (self.delete_engine_settings)(settings) };
        if handle.is_null() {
            return Err(
                "Civra could not load the local AI model. Close unused apps and try again."
                    .to_owned(),
            );
        }

        Ok(NativeEngine {
            runtime: self,
            handle,
        })
    }
}

/// LiteRT-LM's default CPU-thread policy was unreliable for a 16K native
/// stream on the research machine. Cap explicit parallelism to avoid both that
/// default and excessive contention on high-core-count desktops.
fn recommended_cpu_threads() -> i32 {
    std::thread::available_parallelism()
        .map(|count| count.get())
        .unwrap_or(1)
        .clamp(1, 8) as i32
}

/// Owns one loaded model engine. Its Drop implementation is the single place
/// native engine memory is released, preventing an accidental model reload per
/// message or a leaked engine after a failure.
#[allow(dead_code)] // Constructed by the forthcoming conversation manager.
struct NativeEngine {
    runtime: NativeRuntime,
    handle: OpaqueHandle,
}

// LiteRT-LM engine access is serialized through InferenceState. The DLL is
// used only on the worker thread holding that mutex.
unsafe impl Send for NativeEngine {}

pub struct InferenceState {
    engine: Arc<Mutex<Option<NativeEngine>>>,
    active: Arc<Mutex<Option<(usize, CancelConversation)>>>,
}

pub fn inference_state() -> InferenceState {
    InferenceState {
        engine: Arc::new(Mutex::new(None)),
        active: Arc::new(Mutex::new(None)),
    }
}

#[tauri::command]
pub fn choose_approved_model() -> Option<String> {
    rfd::FileDialog::new()
        .add_filter("Civra model", &["litertlm"])
        .pick_file()
        .map(|path| path.to_string_lossy().into_owned())
}

impl Drop for NativeEngine {
    fn drop(&mut self) {
        if !self.handle.is_null() {
            unsafe { (self.runtime.delete_engine)(self.handle) };
            self.handle = std::ptr::null_mut();
        }
    }
}

enum StreamEvent {
    Text(String),
    Error(String),
    Finished,
}

struct StreamCollector {
    sender: mpsc::Sender<StreamEvent>,
    get_chunk_text: GetChunkText,
    get_chunk_error: GetChunkError,
    is_chunk_final: IsChunkFinal,
}

unsafe extern "C" fn collect_stream_chunk(callback_data: *mut c_void, chunk: OpaqueHandle) {
    let collector = unsafe { &*(callback_data as *const StreamCollector) };
    if let Some(error) = unsafe { c_string((collector.get_chunk_error)(chunk)) } {
        let _ = collector.sender.send(StreamEvent::Error(error));
        return;
    }
    if let Some(text) = unsafe { c_string((collector.get_chunk_text)(chunk)) } {
        let _ = collector.sender.send(StreamEvent::Text(text));
    }
    if unsafe { (collector.is_chunk_final)(chunk) } {
        let _ = collector.sender.send(StreamEvent::Finished);
    }
}

unsafe fn c_string(value: *const c_char) -> Option<String> {
    (!value.is_null()).then(|| unsafe {
        std::ffi::CStr::from_ptr(value)
            .to_string_lossy()
            .into_owned()
    })
}

#[allow(dead_code)] // The following call is wired to Tauri streaming events next.
impl NativeEngine {
    /// Rebuilds a conversation from persisted history, then streams one new
    /// user message. The loaded model engine is reused; only chat state is
    /// recreated when a conversation is not already resident in memory.
    fn stream_reply<F>(
        &self,
        history_json: &str,
        message_json: &str,
        active: &Arc<Mutex<Option<(usize, CancelConversation)>>>,
        mut on_chunk: F,
    ) -> Result<(), String>
    where
        F: FnMut(String),
    {
        let history = CString::new(history_json)
            .map_err(|_| "Civra could not prepare this chat's local history.")?;
        let message =
            CString::new(message_json).map_err(|_| "Civra could not prepare this message.")?;
        let context = CString::new("{}").expect("static JSON has no NUL byte");
        let session = unsafe { (self.runtime.create_session_config)() };
        let config = unsafe { (self.runtime.create_conversation_config)() };
        if session.is_null() || config.is_null() {
            if !session.is_null() {
                unsafe { (self.runtime.delete_session_config)(session) };
            }
            if !config.is_null() {
                unsafe { (self.runtime.delete_conversation_config)(config) };
            }
            return Err("Civra could not prepare a local conversation.".to_owned());
        }

        unsafe {
            (self.runtime.set_conversation_session_config)(config, session);
            (self.runtime.delete_session_config)(session);
            (self.runtime.set_conversation_messages)(config, history.as_ptr());
        }
        let conversation = unsafe { (self.runtime.create_conversation)(self.handle, config) };
        unsafe { (self.runtime.delete_conversation_config)(config) };
        if conversation.is_null() {
            return Err("Civra could not start this local conversation.".to_owned());
        }

        let (sender, receiver) = mpsc::channel();
        let collector = StreamCollector {
            sender,
            get_chunk_text: self.runtime.get_chunk_text,
            get_chunk_error: self.runtime.get_chunk_error,
            is_chunk_final: self.runtime.is_chunk_final,
        };
        let status = unsafe {
            (self.runtime.send_stream)(
                conversation,
                message.as_ptr(),
                context.as_ptr(),
                std::ptr::null_mut(),
                collect_stream_chunk,
                &collector as *const StreamCollector as *mut c_void,
            )
        };
        if status != 0 {
            unsafe { (self.runtime.delete_conversation)(conversation) };
            return Err("Civra could not start this reply.".to_owned());
        }
        if let Ok(mut current) = active.lock() {
            *current = Some((conversation as usize, self.runtime.cancel_conversation));
        }

        let result = loop {
            match receiver.recv() {
                Ok(StreamEvent::Text(text)) => on_chunk(text),
                Ok(StreamEvent::Error(error)) => break Err(error),
                Ok(StreamEvent::Finished) => break Ok(()),
                Err(_) => break Err("Civra's local model stopped responding.".to_owned()),
            }
        };
        if let Ok(mut current) = active.lock() {
            *current = None;
            unsafe { (self.runtime.delete_conversation)(conversation) };
        }
        result
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InferenceChunk {
    request_id: String,
    chunk: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InferenceFinished {
    request_id: String,
    error: Option<String>,
}

#[tauri::command]
pub async fn load_native_engine(
    app: AppHandle,
    state: State<'_, InferenceState>,
    model_path: String,
    first_use: bool,
) -> Result<(), String> {
    let engines = state.engine.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if first_use {
            let verified = crate::model::verify_approved_model(model_path.clone())?;
            if !verified.valid {
                return Err(verified.reason.unwrap_or_else(|| {
                    "The selected model did not pass Civra's integrity check.".to_owned()
                }));
            }
        } else {
            crate::storage::check_saved_model(&app, &model_path)?;
        }
        let runtime = NativeRuntime::load(&runtime_path(
            &app.path()
                .resource_dir()
                .map_err(|error| error.to_string())?,
        ))?;
        let engine = runtime.create_cpu_engine(Path::new(&model_path), 16_384)?;
        if first_use {
            crate::storage::remember_verified_model(&app, &model_path)?;
        }
        *engines
            .lock()
            .map_err(|_| "Civra's local AI engine is busy.")? = Some(engine);
        Ok(())
    })
    .await
    .map_err(|error| format!("Civra's local AI loader stopped unexpectedly: {error}"))?
}

#[tauri::command]
pub fn stream_native_reply(
    app: AppHandle,
    state: State<'_, InferenceState>,
    request_id: String,
    history_json: String,
    message_json: String,
) -> Result<(), String> {
    let engines = state.engine.clone();
    let active = state.active.clone();
    std::thread::spawn(move || {
        let result = engines
            .lock()
            .map_err(|_| "Civra's local AI engine is busy.".to_owned())
            .and_then(|guard| {
                let engine = guard
                    .as_ref()
                    .ok_or_else(|| "The local AI model is not ready.".to_owned())?;
                engine.stream_reply(&history_json, &message_json, &active, |chunk| {
                    let _ = app.emit(
                        "inference-chunk",
                        InferenceChunk {
                            request_id: request_id.clone(),
                            chunk,
                        },
                    );
                })
            });
        let _ = app.emit(
            "inference-finished",
            InferenceFinished {
                request_id,
                error: result.err(),
            },
        );
    });
    Ok(())
}

#[tauri::command]
pub fn cancel_native_reply(state: State<'_, InferenceState>) -> Result<(), String> {
    let current = state
        .active
        .lock()
        .map_err(|_| "Civra could not stop this reply.")?;
    if let Some((conversation, cancel)) = *current {
        unsafe { cancel(conversation as OpaqueHandle) };
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub available: bool,
    pub version: &'static str,
    pub detail: String,
}

fn runtime_path(resource_dir: &Path) -> PathBuf {
    let installed = resource_dir.join(RUNTIME_FILE_NAME);
    if installed.is_file() {
        return installed;
    }
    #[cfg(debug_assertions)]
    {
        let staged = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("runtime")
            .join(RUNTIME_FILE_NAME);
        if staged.is_file() {
            return staged;
        }
    }
    installed
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
    let runtime = match NativeRuntime::load(path) {
        Ok(runtime) => runtime,
        Err(detail) => {
            return RuntimeStatus {
                available: false,
                version: RUNTIME_VERSION,
                detail,
            }
        }
    };
    drop(runtime);

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
    use super::{
        inspect_runtime, recommended_cpu_threads, runtime_path, NativeRuntime, RUNTIME_FILE_NAME,
        RUNTIME_VERSION,
    };
    use std::path::Path;

    #[test]
    fn finds_the_runtime_beside_the_app_resources() {
        assert_eq!(
            runtime_path(
                Path::new(env!("CARGO_MANIFEST_DIR"))
                    .join("runtime")
                    .as_path()
            ),
            Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("runtime")
                .join(RUNTIME_FILE_NAME)
        );
    }

    #[test]
    fn reports_a_missing_runtime_without_loading_a_model() {
        let status = inspect_runtime(Path::new("C:/Civra/no-such-litert-runtime.dll"));
        assert!(!status.available);
        assert_eq!(status.version, RUNTIME_VERSION);
    }

    #[test]
    fn uses_a_bounded_explicit_cpu_thread_count() {
        assert!((1..=8).contains(&recommended_cpu_threads()));
    }

    #[test]
    #[ignore = "requires the approved local model and staged LiteRT-LM DLL"]
    fn streams_from_the_approved_model_through_rust() {
        let path = std::env::var("CIVRA_TEST_MODEL_PATH").expect("set CIVRA_TEST_MODEL_PATH");
        let runtime = NativeRuntime::load(&runtime_path(Path::new(env!("CARGO_MANIFEST_DIR"))))
            .expect("load staged native runtime");
        let engine = runtime
            .create_cpu_engine(Path::new(&path), 16_384)
            .expect("load 16K CPU engine");
        let active = std::sync::Arc::new(std::sync::Mutex::new(None));
        let mut text = String::new();
        engine
            .stream_reply(
                "[]",
                r#"{"role":"user","content":"Reply with exactly: native bridge works."}"#,
                &active,
                |chunk| text.push_str(&chunk),
            )
            .expect("stream native reply");
        assert!(text.contains("native"));
        assert!(text.contains("works"));

        let mut follow_up = String::new();
        engine
            .stream_reply(
                r#"[{"role":"user","content":"My secret word is apricot."},{"role":"model","content":"I will remember apricot."}]"#,
                r#"{"role":"user","content":"What was my secret word? Answer with only that word."}"#,
                &active,
                |chunk| {
                    let value: serde_json::Value =
                        serde_json::from_str(&chunk).expect("LiteRT chunk is JSON");
                    if let Some(parts) = value.get("content").and_then(|content| content.as_array()) {
                        for part in parts {
                            if let Some(text) = part.get("text").and_then(|text| text.as_str()) {
                                follow_up.push_str(text);
                            }
                        }
                    }
                },
            )
            .expect("stream a reply with restored chat history");
        assert!(
            follow_up.to_lowercase().contains("apricot"),
            "unexpected restored-history response: {follow_up}"
        );
    }
}
