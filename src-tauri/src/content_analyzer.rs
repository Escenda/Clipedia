use regex::Regex;

pub struct ContentAnalyzer;

impl ContentAnalyzer {
    pub fn analyze(content: &str) -> Vec<String> {
        let mut tags = Vec::new();

        // URL検出
        if Self::is_url(content) {
            tags.push("url".to_string());
        }

        // Email検出
        if Self::is_email(content) {
            tags.push("email".to_string());
        }

        // 電話番号検出
        if Self::is_phone(content) {
            tags.push("phone".to_string());
        }

        // ファイルパス検出
        if Self::is_file_path(content) {
            tags.push("path".to_string());
        }

        // JSON検出
        if Self::is_json(content) {
            tags.push("json".to_string());
        }

        // Markdown検出
        if Self::is_markdown(content) {
            tags.push("markdown".to_string());
        }

        // コード検出
        if Self::is_code(content) {
            tags.push("code".to_string());

            // プログラミング言語を特定
            if let Some(lang) = Self::detect_language(content) {
                tags.push(format!("code:{lang}"));
            }
        }

        tags
    }

    fn is_url(content: &str) -> bool {
        let url_regex = Regex::new(r"^https?://[^\s]+$").unwrap();
        url_regex.is_match(content.trim())
    }

    fn is_email(content: &str) -> bool {
        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
        email_regex.is_match(content.trim())
    }

    fn is_phone(content: &str) -> bool {
        let phone_regex = Regex::new(r"^[\+\d]?[\d\s\-\(\)]+$").unwrap();
        let cleaned = content.trim();
        phone_regex.is_match(cleaned) && cleaned.chars().filter(|c| c.is_numeric()).count() >= 7
    }

    fn is_file_path(content: &str) -> bool {
        let path_regex = Regex::new(r"^[A-Za-z]:[\\\/]|^[\/~]").unwrap();
        path_regex.is_match(content.trim())
    }

    fn is_json(content: &str) -> bool {
        let trimmed = content.trim();
        (trimmed.starts_with('{') && trimmed.ends_with('}'))
            || (trimmed.starts_with('[') && trimmed.ends_with(']'))
    }

    fn is_markdown(content: &str) -> bool {
        let markdown_patterns = [
            r"^#{1,6}\s",     // Headers
            r"\*\*[^*]+\*\*", // Bold
            r"\*[^*]+\*",     // Italic
            r"\[.+\]\(.+\)",  // Links
            r"^[\*\-]\s",     // Lists
            r"```",           // Code blocks
        ];

        markdown_patterns
            .iter()
            .any(|pattern| Regex::new(pattern).unwrap().is_match(content))
    }

    fn is_code(content: &str) -> bool {
        let code_patterns = [
            r"(function|const|let|var|class|def|import|export)",
            r"(if|else|for|while|return)",
            r"[\{\}\[\]\(\);]",
            r"(public|private|protected|static)",
        ];

        let matches = code_patterns
            .iter()
            .filter(|pattern| Regex::new(pattern).unwrap().is_match(content))
            .count();

        matches >= 2
    }

    fn detect_language(content: &str) -> Option<String> {
        let language_patterns = vec![
            (
                "rust",
                vec![r"fn\s+\w+", r"let\s+mut", r"impl\s+", r"use\s+\w+::"],
            ),
            (
                "javascript",
                vec![
                    r"const\s+\w+\s*=",
                    r"=>\s*\{",
                    r"function\s+\w+\(",
                    r"\.then\(",
                ],
            ),
            (
                "typescript",
                vec![
                    r":\s*(string|number|boolean)",
                    r"interface\s+\w+",
                    r"type\s+\w+\s*=",
                ],
            ),
            (
                "python",
                vec![r"def\s+\w+\(", r"import\s+\w+", r":\s*$", r"if\s+__name__"],
            ),
            (
                "java",
                vec![
                    r"public\s+class",
                    r"private\s+\w+",
                    r"@Override",
                    r"new\s+\w+\(",
                ],
            ),
            (
                "go",
                vec![r"func\s+\w+\(", r"package\s+\w+", r":=", r"go\s+func"],
            ),
            (
                "cpp",
                vec![r"#include\s*<", r"std::", r"nullptr", r"template\s*<"],
            ),
            (
                "csharp",
                vec![r"using\s+System", r"namespace\s+\w+", r"public\s+override"],
            ),
        ];

        for (lang, patterns) in language_patterns {
            let matches = patterns
                .iter()
                .filter(|pattern| Regex::new(pattern).unwrap().is_match(content))
                .count();

            if matches >= 2 {
                return Some(lang.to_string());
            }
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_url_detection() {
        assert!(ContentAnalyzer::analyze("https://github.com").contains(&"url".to_string()));
        assert!(ContentAnalyzer::analyze("http://example.com/path").contains(&"url".to_string()));
        assert!(!ContentAnalyzer::analyze("not a url").contains(&"url".to_string()));
    }

    #[test]
    fn test_email_detection() {
        assert!(ContentAnalyzer::analyze("test@example.com").contains(&"email".to_string()));
        assert!(!ContentAnalyzer::analyze("not an email").contains(&"email".to_string()));
    }

    #[test]
    fn test_code_detection() {
        let rust_code = "fn main() {\n    println!(\"Hello\");\n}";
        let tags = ContentAnalyzer::analyze(rust_code);
        assert!(tags.contains(&"code".to_string()));
        assert!(tags.contains(&"code:rust".to_string()));
    }
}
