# Claude GitHub Action Setup

The Claude Code GitHub Action has been installed in this repository. Follow these steps to complete the setup.

## What's Installed

A GitHub Action workflow (`.github/workflows/claude-code.yml`) that enables Claude to:
- Respond to `@claude` mentions in PR and issue comments
- Review and implement code changes in pull requests
- Answer questions about the codebase

## Required Setup Steps

### 1. Get an Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Add the Secret to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key from step 1
5. Click **Add secret**

### 3. Enable GitHub Actions (if not already enabled)

1. Go to **Settings** → **Actions** → **General**
2. Ensure **Allow all actions and reusable workflows** is selected
3. Under **Workflow permissions**, ensure:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## How to Use

### Interactive Mode (Respond to Comments)

Simply mention `@claude` in any PR or issue comment:

```
@claude can you review this PR for security issues?
```

```
@claude please implement the suggested changes from the code review
```

```
@claude what does the NutritionCard component do?
```

### On Pull Requests

The action automatically activates on:
- New pull requests (`opened`)
- Updated pull requests (`synchronize`)
- Comments mentioning `@claude`

## Customization

To customize Claude's behavior, uncomment and modify the `claude_args` section in `.github/workflows/claude-code.yml`:

```yaml
claude_args: |
  --model claude-sonnet-4-5-20250929
  --max-turns 10
  --system-prompt "Follow our TDD practices and coding standards"
```

## Alternative Authentication

If you prefer using AWS Bedrock or Google Vertex AI instead of direct Anthropic API:
- See [Cloud Providers Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/cloud-providers.md)

## Resources

- [Official Repository](https://github.com/anthropics/claude-code-action)
- [GitHub Marketplace](https://github.com/marketplace/actions/claude-code-action-official)
- [Documentation](https://docs.claude.com/en/docs/claude-code/github-actions)

## Testing

After setup, test the action by:
1. Creating a test issue
2. Adding a comment: `@claude hello, can you help me?`
3. Check the Actions tab to see the workflow run

## Troubleshooting

- **Action doesn't respond**: Check that the `ANTHROPIC_API_KEY` secret is set correctly
- **Permission errors**: Verify workflow permissions in Settings → Actions → General
- **Rate limits**: Monitor your API usage in the Anthropic Console
