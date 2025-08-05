# バージョン管理ガイドライン

Clipediaはセマンティックバージョニング（SemVer）に従います。

## バージョン形式

`MAJOR.MINOR.PATCH` (例: 1.2.3)

## 自動バージョンアップ

コミットメッセージに基づいて自動的にバージョンが決定されます：

### パッチバージョン (0.0.X)
デフォルトですべてのコミットはパッチバージョンを上げます。
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `style:` - コードスタイルの変更
- `refactor:` - リファクタリング
- `test:` - テストの追加・修正
- `chore:` - ビルドプロセスやツールの変更

### マイナーバージョン (0.X.0)
新機能の追加時：
- `feat:` - 新機能の追加
- `feature:` - 新機能の追加

### メジャーバージョン (X.0.0)
破壊的変更時：
- コミットメッセージに `BREAKING CHANGE` を含む
- コミットメッセージのタイプの後に `!` を付ける（例: `feat!:`, `fix!:`）

## 例

```bash
# パッチバージョンアップ (0.1.0 -> 0.1.1)
git commit -m "fix: Fix popup window auto-close issue"

# マイナーバージョンアップ (0.1.1 -> 0.2.0)
git commit -m "feat: Add export functionality"

# メジャーバージョンアップ (0.2.0 -> 1.0.0)
git commit -m "feat!: Change database schema"
# または
git commit -m "feat: New API

BREAKING CHANGE: API endpoints have been restructured"
```

## 手動でのバージョン管理

必要に応じて、以下のファイルのバージョンを手動で更新することも可能です：
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

ただし、通常は自動バージョン管理に任せることを推奨します。