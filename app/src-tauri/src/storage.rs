use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{fs, time::{SystemTime, UNIX_EPOCH}};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatInput {
    pub id: Option<i64>,
    pub title: String,
    pub messages: Vec<MessageInput>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageInput {
    pub role: String,
    pub text: String,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredChat {
    pub id: i64,
    pub title: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub messages: Vec<StoredMessage>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredMessage {
    pub role: String,
    pub text: String,
    pub status: Option<String>,
}

fn now_unix() -> Result<i64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .map_err(|error| format!("System time is unavailable: {error}"))
}

fn initialise(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'bot')),
                text TEXT NOT NULL,
                status TEXT,
                UNIQUE(chat_id, position)
            );
            CREATE INDEX IF NOT EXISTS messages_by_chat ON messages(chat_id, position);
            ",
        )
        .map_err(|error| format!("Could not initialise chat history: {error}"))
}

fn database(app: &AppHandle) -> Result<Connection, String> {
    let directory = app
        .path()
        .app_local_data_dir()
        .map_err(|error| format!("Could not find Civra's local data folder: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Could not create Civra's local data folder: {error}"))?;
    let connection = Connection::open(directory.join("history.sqlite3"))
        .map_err(|error| format!("Could not open chat history: {error}"))?;
    initialise(&connection)?;
    Ok(connection)
}

fn read_chat(connection: &Connection, id: i64) -> Result<Option<StoredChat>, String> {
    let row = connection
        .query_row(
            "SELECT id, title, created_at, updated_at FROM chats WHERE id = ?1",
            [id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            },
        )
        .optional()
        .map_err(|error| format!("Could not read chat: {error}"))?;

    let Some((id, title, created_at, updated_at)) = row else {
        return Ok(None);
    };

    let mut statement = connection
        .prepare("SELECT role, text, status FROM messages WHERE chat_id = ?1 ORDER BY position")
        .map_err(|error| format!("Could not read chat messages: {error}"))?;
    let messages = statement
        .query_map([id], |row| {
            Ok(StoredMessage {
                role: row.get(0)?,
                text: row.get(1)?,
                status: row.get(2)?,
            })
        })
        .map_err(|error| format!("Could not read chat messages: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Could not read chat messages: {error}"))?;

    Ok(Some(StoredChat {
        id,
        title,
        created_at,
        updated_at,
        messages,
    }))
}

fn list(connection: &Connection) -> Result<Vec<StoredChat>, String> {
    let mut statement = connection
        .prepare("SELECT id FROM chats ORDER BY updated_at DESC, id DESC")
        .map_err(|error| format!("Could not list chats: {error}"))?;
    let ids = statement
        .query_map([], |row| row.get::<_, i64>(0))
        .map_err(|error| format!("Could not list chats: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Could not list chats: {error}"))?;
    ids.into_iter()
        .map(|id| read_chat(connection, id)?.ok_or_else(|| "Chat disappeared while loading".to_owned()))
        .collect()
}

fn save(connection: &mut Connection, chat: ChatInput) -> Result<StoredChat, String> {
    let title = chat.title.trim();
    if title.is_empty() {
        return Err("A chat name is required.".to_owned());
    }
    let now = now_unix()?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("Could not save chat: {error}"))?;
    let id = match chat.id {
        Some(id) => {
            let changed = transaction
                .execute(
                    "UPDATE chats SET title = ?1, updated_at = ?2 WHERE id = ?3",
                    params![title, now, id],
                )
                .map_err(|error| format!("Could not save chat: {error}"))?;
            if changed == 0 {
                return Err("This chat no longer exists.".to_owned());
            }
            id
        }
        None => {
            transaction
                .execute(
                    "INSERT INTO chats (title, created_at, updated_at) VALUES (?1, ?2, ?2)",
                    params![title, now],
                )
                .map_err(|error| format!("Could not create chat: {error}"))?;
            transaction.last_insert_rowid()
        }
    };
    transaction
        .execute("DELETE FROM messages WHERE chat_id = ?1", [id])
        .map_err(|error| format!("Could not update chat messages: {error}"))?;
    for (position, message) in chat.messages.iter().enumerate() {
        if message.role != "user" && message.role != "bot" {
            return Err("A chat message has an invalid sender.".to_owned());
        }
        transaction
            .execute(
                "INSERT INTO messages (chat_id, position, role, text, status) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, position as i64, message.role, message.text, message.status],
            )
            .map_err(|error| format!("Could not save chat message: {error}"))?;
    }
    transaction
        .commit()
        .map_err(|error| format!("Could not save chat: {error}"))?;
    read_chat(connection, id)?.ok_or_else(|| "Chat disappeared after saving.".to_owned())
}

#[tauri::command]
pub fn load_chats(app: AppHandle) -> Result<Vec<StoredChat>, String> {
    list(&database(&app)?)
}

#[tauri::command]
pub fn save_chat(app: AppHandle, chat: ChatInput) -> Result<StoredChat, String> {
    save(&mut database(&app)?, chat)
}

#[tauri::command]
pub fn rename_chat(app: AppHandle, id: i64, title: String) -> Result<StoredChat, String> {
    let mut connection = database(&app)?;
    let existing = read_chat(&connection, id)?.ok_or_else(|| "This chat no longer exists.".to_owned())?;
    save(
        &mut connection,
        ChatInput {
            id: Some(id),
            title,
            messages: existing
                .messages
                .into_iter()
                .map(|message| MessageInput {
                    role: message.role,
                    text: message.text,
                    status: message.status,
                })
                .collect(),
        },
    )
}

#[tauri::command]
pub fn delete_chat(app: AppHandle, id: i64) -> Result<(), String> {
    let connection = database(&app)?;
    connection
        .execute("DELETE FROM chats WHERE id = ?1", [id])
        .map_err(|error| format!("Could not delete chat: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn delete_all_chats(app: AppHandle) -> Result<(), String> {
    let connection = database(&app)?;
    connection
        .execute("DELETE FROM chats", [])
        .map_err(|error| format!("Could not delete chats: {error}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn memory_database() -> Connection {
        let connection = Connection::open_in_memory().expect("open memory database");
        initialise(&connection).expect("initialise schema");
        connection
    }

    #[test]
    fn saves_loads_renames_and_deletes_a_chat() {
        let mut connection = memory_database();
        let created = save(
            &mut connection,
            ChatInput {
                id: None,
                title: "Electricity bill".to_owned(),
                messages: vec![MessageInput {
                    role: "user".to_owned(),
                    text: "Explain this bill".to_owned(),
                    status: None,
                }],
            },
        )
        .expect("save chat");
        assert_eq!(created.messages.len(), 1);

        let renamed = save(
            &mut connection,
            ChatInput {
                id: Some(created.id),
                title: "My electricity bill".to_owned(),
                messages: created
                    .messages
                    .into_iter()
                    .chain(std::iter::once(StoredMessage {
                        role: "bot".to_owned(),
                        text: "I can help.".to_owned(),
                        status: Some("done".to_owned()),
                    }))
                    .map(|message| MessageInput {
                        role: message.role,
                        text: message.text,
                        status: message.status,
                    })
                    .collect(),
            },
        )
        .expect("rename chat");
        assert_eq!(renamed.title, "My electricity bill");
        assert_eq!(renamed.messages.len(), 2);
        assert_eq!(list(&connection).expect("list chats").len(), 1);

        connection
            .execute("DELETE FROM chats WHERE id = ?1", [created.id])
            .expect("delete chat");
        assert!(list(&connection).expect("list chats").is_empty());
    }

    #[test]
    fn rejects_an_invalid_message_sender() {
        let mut connection = memory_database();
        let result = save(
            &mut connection,
            ChatInput {
                id: None,
                title: "Bad message".to_owned(),
                messages: vec![MessageInput {
                    role: "system".to_owned(),
                    text: "Not supported".to_owned(),
                    status: None,
                }],
            },
        );
        assert!(result.is_err());
        assert!(list(&connection).expect("list chats").is_empty());
    }
}
