use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::{BufReader, Read},
    path::Path,
};

/// The sole model artifact Civra accepts during the MVP. Keeping this in the
/// native layer means a future file picker or downloader cannot accidentally
/// treat an arbitrary LiteRT-LM file as a supported Civra model.
pub const APPROVED_MODEL_FILE_NAME: &str = "gemma-4-E2B-it.litertlm";
pub const APPROVED_MODEL_SHA256: &str =
    "181938105E0EEFD105961417E8DA75903EACDA102C4FCE9CE90F50B97139A63C";
pub const APPROVED_MODEL_SIZE_BYTES: u64 = 2_588_147_712;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelVerification {
    pub valid: bool,
    pub reason: Option<String>,
    pub expected_file_name: &'static str,
    pub expected_size_bytes: u64,
    pub expected_sha256: &'static str,
    pub actual_size_bytes: Option<u64>,
    pub actual_sha256: Option<String>,
}

impl ModelVerification {
    fn failed(reason: impl Into<String>, actual_size_bytes: Option<u64>) -> Self {
        Self {
            valid: false,
            reason: Some(reason.into()),
            expected_file_name: APPROVED_MODEL_FILE_NAME,
            expected_size_bytes: APPROVED_MODEL_SIZE_BYTES,
            expected_sha256: APPROVED_MODEL_SHA256,
            actual_size_bytes,
            actual_sha256: None,
        }
    }
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let file = File::open(path)
        .map_err(|error| format!("Civra could not open the model file: {error}"))?;
    let mut reader = BufReader::with_capacity(1024 * 1024, file);
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];

    loop {
        let read = reader
            .read(&mut buffer)
            .map_err(|error| format!("Civra could not read the model file: {error}"))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }

    Ok(format!("{:X}", hasher.finalize()))
}

#[tauri::command]
pub fn verify_approved_model(path: String) -> Result<ModelVerification, String> {
    let path = Path::new(&path);
    let metadata = match path.metadata() {
        Ok(metadata) if metadata.is_file() => metadata,
        Ok(_) => {
            return Ok(ModelVerification::failed(
                "The selected model path is not a file.",
                None,
            ))
        }
        Err(_) => {
            return Ok(ModelVerification::failed(
                "The approved model file was not found.",
                None,
            ))
        }
    };
    let actual_size_bytes = metadata.len();

    if path.file_name().and_then(|name| name.to_str()) != Some(APPROVED_MODEL_FILE_NAME) {
        return Ok(ModelVerification::failed(
            "This is not the approved Civra model file.",
            Some(actual_size_bytes),
        ));
    }

    if actual_size_bytes != APPROVED_MODEL_SIZE_BYTES {
        return Ok(ModelVerification::failed(
            "The approved model file is incomplete or has an unexpected size.",
            Some(actual_size_bytes),
        ));
    }

    let actual_sha256 = sha256_file(path)?;
    let valid = actual_sha256 == APPROVED_MODEL_SHA256;
    Ok(ModelVerification {
        valid,
        reason: (!valid).then_some(
            "The model file did not match Civra's approved integrity check.".to_string(),
        ),
        expected_file_name: APPROVED_MODEL_FILE_NAME,
        expected_size_bytes: APPROVED_MODEL_SIZE_BYTES,
        expected_sha256: APPROVED_MODEL_SHA256,
        actual_size_bytes: Some(actual_size_bytes),
        actual_sha256: Some(actual_sha256),
    })
}

#[cfg(test)]
mod tests {
    use super::sha256_file;
    use std::{
        fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    #[test]
    fn hashes_files_in_uppercase_sha256() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be after epoch")
            .as_nanos();
        let path = PathBuf::from(std::env::temp_dir()).join(format!("civra-sha256-{unique}.txt"));
        fs::write(&path, b"abc").expect("fixture should be written");

        let hash = sha256_file(&path).expect("fixture should be hashable");
        fs::remove_file(path).expect("fixture should be removed");

        assert_eq!(
            hash,
            "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD"
        );
    }
}
