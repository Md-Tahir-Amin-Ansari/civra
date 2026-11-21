// One-time local feasibility probe for the LiteRT-LM Windows C API.
// This is research-only; Civra's product bridge is implemented separately.
#include <windows.h>

#include <iostream>
#include <condition_variable>
#include <mutex>
#include <string>

using OpaqueHandle = void*;
using CreateSettings = OpaqueHandle(__cdecl*)(const char*, const char*, const char*, const char*);
using DeleteHandle = void(__cdecl*)(OpaqueHandle);
using SetMaxTokens = void(__cdecl*)(OpaqueHandle, int);
using SetThreadCount = void(__cdecl*)(OpaqueHandle, int);
using CreateEngine = OpaqueHandle(__cdecl*)(OpaqueHandle);
using CreateConversationConfig = OpaqueHandle(__cdecl*)();
using SetConversationSessionConfig = void(__cdecl*)(OpaqueHandle, OpaqueHandle);
using CreateSessionConfig = OpaqueHandle(__cdecl*)();
using CreateConversation = OpaqueHandle(__cdecl*)(OpaqueHandle, OpaqueHandle);
using SendStream = int(__cdecl*)(OpaqueHandle, const char*, const char*, OpaqueHandle,
                                 void(__cdecl*)(void*, void*), void*);
using GetChunkText = const char*(__cdecl*)(void*);
using GetChunkError = const char*(__cdecl*)(void*);
using IsChunkFinal = bool(__cdecl*)(void*);

struct StreamResult {
  std::mutex mutex;
  std::condition_variable ready;
  bool complete = false;
  std::string error;
  std::string text;
};

GetChunkText get_chunk_text = nullptr;
GetChunkError get_chunk_error = nullptr;
IsChunkFinal is_chunk_final = nullptr;

void __cdecl on_chunk(void* callback_data, void* chunk) {
  auto* result = static_cast<StreamResult*>(callback_data);
  std::lock_guard<std::mutex> lock(result->mutex);
  if (const char* error = get_chunk_error(chunk)) {
    result->error = error;
  }
  if (const char* text = get_chunk_text(chunk)) {
    result->text += text;
  }
  if (is_chunk_final(chunk) || !result->error.empty()) {
    result->complete = true;
    result->ready.notify_one();
  }
}

template <typename Function>
Function require(HMODULE library, const char* name) {
  auto function = reinterpret_cast<Function>(GetProcAddress(library, name));
  if (!function) {
    std::cerr << "Missing required symbol: " << name << "\n";
    std::exit(2);
  }
  return function;
}

int main(int argc, char** argv) {
  if (argc != 3) {
    std::cerr << "Usage: native_engine_probe <litert-lm.dll> <model.litertlm>\n";
    return 2;
  }

  const std::string runtime_path = argv[1];
  const std::string model_path = argv[2];
  HMODULE library = LoadLibraryA(runtime_path.c_str());
  if (!library) {
    std::cerr << "Could not load LiteRT-LM DLL. Windows error: " << GetLastError() << "\n";
    return 3;
  }

  const auto create_settings = require<CreateSettings>(library, "litert_lm_engine_settings_create");
  const auto delete_settings = require<DeleteHandle>(library, "litert_lm_engine_settings_delete");
  const auto set_max_tokens = require<SetMaxTokens>(library, "litert_lm_engine_settings_set_max_num_tokens");
  const auto set_thread_count = require<SetThreadCount>(library, "litert_lm_engine_settings_set_num_threads");
  const auto create_engine = require<CreateEngine>(library, "litert_lm_engine_create");
  const auto delete_engine = require<DeleteHandle>(library, "litert_lm_engine_delete");
  const auto create_session_config = require<CreateSessionConfig>(library, "litert_lm_session_config_create");
  const auto delete_session_config = require<DeleteHandle>(library, "litert_lm_session_config_delete");
  const auto create_conversation_config = require<CreateConversationConfig>(library, "litert_lm_conversation_config_create");
  const auto delete_conversation_config = require<DeleteHandle>(library, "litert_lm_conversation_config_delete");
  const auto set_conversation_session = require<SetConversationSessionConfig>(library, "litert_lm_conversation_config_set_session_config");
  const auto create_conversation = require<CreateConversation>(library, "litert_lm_conversation_create");
  const auto delete_conversation = require<DeleteHandle>(library, "litert_lm_conversation_delete");
  const auto send_stream = require<SendStream>(library, "litert_lm_conversation_send_message_stream");
  get_chunk_text = require<GetChunkText>(library, "litert_lm_stream_chunk_get_text");
  get_chunk_error = require<GetChunkError>(library, "litert_lm_stream_chunk_get_error");
  is_chunk_final = require<IsChunkFinal>(library, "litert_lm_stream_chunk_is_final");

  OpaqueHandle settings = create_settings(model_path.c_str(), "cpu", nullptr, nullptr);
  if (!settings) {
    std::cerr << "LiteRT-LM did not create CPU engine settings.\n";
    FreeLibrary(library);
    return 4;
  }
  set_thread_count(settings, 8);
  set_max_tokens(settings, 16384);

  std::cout << "Creating 16K CPU engine through the native C API with 8 threads...\n";
  OpaqueHandle engine = create_engine(settings);
  delete_settings(settings);
  if (!engine) {
    std::cerr << "LiteRT-LM did not create the CPU engine.\n";
    FreeLibrary(library);
    return 5;
  }

  std::cout << "NATIVE_C_API_ENGINE_INIT_OK\n";

  OpaqueHandle session_config = create_session_config();
  OpaqueHandle conversation_config = create_conversation_config();
  if (!session_config || !conversation_config) {
    std::cerr << "LiteRT-LM did not create conversation configuration.\n";
    if (conversation_config) delete_conversation_config(conversation_config);
    if (session_config) delete_session_config(session_config);
    delete_engine(engine);
    FreeLibrary(library);
    return 6;
  }
  set_conversation_session(conversation_config, session_config);
  delete_session_config(session_config);
  OpaqueHandle conversation = create_conversation(engine, conversation_config);
  delete_conversation_config(conversation_config);
  if (!conversation) {
    std::cerr << "LiteRT-LM did not create a conversation.\n";
    delete_engine(engine);
    FreeLibrary(library);
    return 7;
  }

  StreamResult result;
  const char* message = R"({"role":"user","content":"Reply with exactly: native bridge works."})";
  const int status = send_stream(conversation, message, "{}", nullptr, on_chunk, &result);
  if (status != 0) {
    std::cerr << "LiteRT-LM did not start streaming. Status: " << status << "\n";
    delete_conversation(conversation);
    delete_engine(engine);
    FreeLibrary(library);
    return 8;
  }

  {
    std::unique_lock<std::mutex> lock(result.mutex);
    if (!result.ready.wait_for(lock, std::chrono::seconds(60), [&result] { return result.complete; })) {
      std::cerr << "LiteRT-LM streaming did not finish within 60 seconds.\n";
      delete_conversation(conversation);
      delete_engine(engine);
      FreeLibrary(library);
      return 9;
    }
  }
  if (!result.error.empty()) {
    std::cerr << "LiteRT-LM streaming error: " << result.error << "\n";
    delete_conversation(conversation);
    delete_engine(engine);
    FreeLibrary(library);
    return 10;
  }
  std::cout << "NATIVE_C_API_STREAM_OK\n" << result.text << "\n";
  delete_conversation(conversation);
  delete_engine(engine);
  FreeLibrary(library);
  std::cout << "NATIVE_C_API_ENGINE_RELEASE_OK\n";
  return 0;
}
