use serde::{Deserialize, Serialize};

/// Compaction begins well below the model's tested 16K ceiling so there is
/// room for the current prompt, formatting overhead, and the generated reply.
pub const COMPACTION_TRIGGER_TOKENS: usize = 12_000;
pub const COMPACTION_TARGET_TOKENS: usize = 8_000;
const MIN_RECENT_MESSAGES: usize = 6;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct ContextMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ContextBudget {
    pub estimated_tokens: usize,
    pub trigger_tokens: usize,
    pub target_tokens: usize,
    pub needs_compaction: bool,
    /// Number of oldest history messages that may be replaced by one locally
    /// generated summary. Messages at and after this index remain verbatim.
    pub compact_through_index: usize,
    pub retained_messages: usize,
    pub retained_estimated_tokens: usize,
}

/// This is deliberately an estimate rather than a tokenizer claim. LiteRT-LM
/// does not currently expose the approved model's tokenizer through Civra's C
/// bridge. UTF-8 bytes divided by three is conservative for ordinary English
/// and avoids severely undercounting multibyte text. Per-message overhead
/// covers role labels and the chat template.
fn estimate_message_tokens(message: &ContextMessage) -> usize {
    message.content.len().div_ceil(3) + message.role.len().div_ceil(3) + 8
}

fn parse_message(json: &str, label: &str) -> Result<ContextMessage, String> {
    let message: ContextMessage = serde_json::from_str(json)
        .map_err(|_| format!("Civra could not inspect the {label} for context limits."))?;
    if !matches!(message.role.as_str(), "user" | "model") {
        return Err(format!("The {label} has an unsupported sender."));
    }
    Ok(message)
}

pub fn plan_context(history_json: &str, message_json: &str) -> Result<ContextBudget, String> {
    let history: Vec<ContextMessage> = serde_json::from_str(history_json)
        .map_err(|_| "Civra could not inspect this chat's local history.".to_owned())?;
    if history
        .iter()
        .any(|message| !matches!(message.role.as_str(), "user" | "model"))
    {
        return Err("This chat contains an unsupported message sender.".to_owned());
    }
    let current = parse_message(message_json, "new message")?;
    let current_tokens = estimate_message_tokens(&current);
    let history_tokens: Vec<usize> = history.iter().map(estimate_message_tokens).collect();
    let estimated_tokens = history_tokens.iter().sum::<usize>() + current_tokens;

    if estimated_tokens < COMPACTION_TRIGGER_TOKENS {
        return Ok(ContextBudget {
            estimated_tokens,
            trigger_tokens: COMPACTION_TRIGGER_TOKENS,
            target_tokens: COMPACTION_TARGET_TOKENS,
            needs_compaction: false,
            compact_through_index: 0,
            retained_messages: history.len(),
            retained_estimated_tokens: estimated_tokens,
        });
    }

    // Keep at least the latest three user/assistant exchanges. Then retain as
    // many additional recent messages as fit under the post-summary target.
    let minimum_start = history.len().saturating_sub(MIN_RECENT_MESSAGES);
    let mut start = history.len();
    let mut retained_tokens = current_tokens;
    while start > 0 {
        let candidate = history_tokens[start - 1];
        if start - 1 < minimum_start && retained_tokens + candidate > COMPACTION_TARGET_TOKENS {
            break;
        }
        retained_tokens += candidate;
        start -= 1;
    }

    // Never split immediately after a user message: the compacted prefix and
    // verbatim suffix should each end/start on a complete exchange boundary.
    if start > 0 && start < history.len() && history[start - 1].role == "user" {
        retained_tokens += history_tokens[start - 1];
        start -= 1;
    }

    Ok(ContextBudget {
        estimated_tokens,
        trigger_tokens: COMPACTION_TRIGGER_TOKENS,
        target_tokens: COMPACTION_TARGET_TOKENS,
        needs_compaction: start > 0,
        compact_through_index: start,
        retained_messages: history.len() - start,
        retained_estimated_tokens: retained_tokens,
    })
}

#[tauri::command]
pub fn inspect_context_budget(
    history_json: String,
    message_json: String,
) -> Result<ContextBudget, String> {
    plan_context(&history_json, &message_json)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn message(role: &str, size: usize) -> ContextMessage {
        ContextMessage {
            role: role.to_owned(),
            content: "x".repeat(size),
        }
    }

    fn json(messages: &[ContextMessage]) -> String {
        serde_json::to_string(messages).expect("serialize history")
    }

    #[test]
    fn leaves_small_conversations_untouched() {
        let history = vec![message("user", 40), message("model", 80)];
        let current = serde_json::to_string(&message("user", 20)).unwrap();
        let plan = plan_context(&json(&history), &current).unwrap();
        assert!(!plan.needs_compaction);
        assert_eq!(plan.compact_through_index, 0);
        assert_eq!(plan.retained_messages, 2);
    }

    #[test]
    fn selects_an_old_complete_prefix_and_keeps_recent_turns() {
        let mut history = Vec::new();
        for _ in 0..12 {
            history.push(message("user", 1_800));
            history.push(message("model", 1_800));
        }
        let current = serde_json::to_string(&message("user", 300)).unwrap();
        let plan = plan_context(&json(&history), &current).unwrap();
        assert!(plan.needs_compaction);
        assert!(plan.compact_through_index > 0);
        assert_eq!(plan.compact_through_index % 2, 0);
        assert!(plan.retained_messages >= MIN_RECENT_MESSAGES);
        assert!(plan.retained_estimated_tokens < plan.estimated_tokens);
    }

    #[test]
    fn counts_multibyte_text_by_utf8_size() {
        let english = message("user", 300);
        let hindi = ContextMessage {
            role: "user".to_owned(),
            content: "न".repeat(300),
        };
        assert!(estimate_message_tokens(&hindi) > estimate_message_tokens(&english));
    }

    #[test]
    fn rejects_unknown_roles() {
        let history = json(&[message("system", 10)]);
        let current = serde_json::to_string(&message("user", 10)).unwrap();
        assert!(plan_context(&history, &current).is_err());
    }
}
