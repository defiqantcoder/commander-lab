<script lang="ts">
  import { onMount } from 'svelte';
  import {
    AlertCircle,
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    Eye,
    EyeOff,
    Key,
    Loader2,
    Shield,
    Sparkles,
    Trash2,
    X
  } from 'lucide-svelte';
  import {
    getGeminiApiKey,
    setGeminiApiKey,
    clearGeminiApiKey,
    testGeminiApiKey,
    GEMINI_DEFAULT_MODEL
  } from '$lib/ai/gemini';

  let {
    open = false,
    onclose = () => {},
    onkeychange = (_hasKey: boolean) => {}
  }: {
    open: boolean;
    onclose: () => void;
    onkeychange?: (hasKey: boolean) => void;
  } = $props();

  let apiKeyInput = $state('');
  let showPassword = $state(false);
  let isTesting = $state(false);
  let testResult = $state<{ success: boolean; message: string } | null>(null);
  let saveFeedback = $state(false);
  let copiedFeedback = $state(false);

  // Sync with current stored key when opened
  $effect(() => {
    if (open) {
      apiKeyInput = getGeminiApiKey() || '';
      testResult = null;
      saveFeedback = false;
    }
  });

  function focusDialog(node: HTMLDialogElement): { destroy?: () => void } {
    node.focus();
    return {};
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
    }
  }

  async function handleTestKey(): Promise<void> {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      testResult = {
        success: false,
        message: 'Please enter a Google Gemini API key before testing.'
      };
      return;
    }

    isTesting = true;
    testResult = null;
    try {
      const result = await testGeminiApiKey(keyToTest);
      testResult = result;
    } catch (error) {
      testResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test Gemini API key.'
      };
    } finally {
      isTesting = false;
    }
  }

  function handleSaveKey(): void {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      setGeminiApiKey(trimmed);
      saveFeedback = true;
      onkeychange(true);
      setTimeout(() => (saveFeedback = false), 2500);
    } else {
      clearGeminiApiKey();
      onkeychange(false);
    }
  }

  function handleClearKey(): void {
    clearGeminiApiKey();
    apiKeyInput = '';
    testResult = null;
    saveFeedback = false;
    onkeychange(false);
  }

  async function handleCopyKey(): Promise<void> {
    if (!apiKeyInput) return;
    await navigator.clipboard.writeText(apiKeyInput);
    copiedFeedback = true;
    setTimeout(() => (copiedFeedback = false), 1800);
  }
</script>

{#if open}
  <div
    class="scrim"
    role="presentation"
    onclick={(event) => event.target === event.currentTarget && onclose()}
  >
    <dialog
      open
      tabindex="-1"
      use:focusDialog
      class="api-modal panel"
      aria-modal="true"
      aria-labelledby="api-modal-title"
      onkeydown={handleKeydown}
    >
      <header class="modal-header">
        <div class="title-group">
          <span class="eyebrow"><Sparkles size={11} /> AI ENGINE CONFIGURATION</span>
          <h2 id="api-modal-title">Google Gemini API Key</h2>
        </div>
        <button class="icon-button close-btn" onclick={onclose} aria-label="Close API settings">
          <X size={15} />
        </button>
      </header>

      <div class="modal-body">
        <div class="info-card">
          <div class="info-header">
            <span class="pill-badge"><Sparkles size={11} /> Google Gemini</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              class="studio-link"
            >
              Get key at Google AI Studio <ExternalLink size={12} />
            </a>
          </div>
          <p class="info-description">
            Power Commander Lab's deck architecture, archetype brainstorming, and synergy engine
            using <strong>{GEMINI_DEFAULT_MODEL}</strong>. Google AI Studio provides high-throughput
            API keys with generous free-tier quotas.
          </p>
        </div>

        <div class="field-group">
          <div class="field-label-row">
            <label for="gemini-key-input">API Key</label>
            <div class="label-actions">
              {#if apiKeyInput}
                <button
                  type="button"
                  class="text-btn"
                  onclick={handleCopyKey}
                  title="Copy key to clipboard"
                >
                  {#if copiedFeedback}<Check size={11} /> Copied{:else}<Copy size={11} /> Copy{/if}
                </button>
                <button
                  type="button"
                  class="text-btn danger"
                  onclick={handleClearKey}
                  title="Remove saved key"
                >
                  <Trash2 size={11} /> Clear
                </button>
              {/if}
            </div>
          </div>

          <div class="input-wrapper">
            <div class="key-icon-adornment">
              <Key size={14} />
            </div>
            <input
              id="gemini-key-input"
              class="api-input"
              type={showPassword ? 'text' : 'password'}
              bind:value={apiKeyInput}
              placeholder="AIzaSy..."
              autocomplete="off"
              spellcheck="false"
              aria-label="Google Gemini API key"
            />
            <button
              type="button"
              class="visibility-toggle"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide API key' : 'Show API key'}
              title={showPassword ? 'Hide API key' : 'Show API key'}
            >
              {#if showPassword}
                <EyeOff size={15} />
              {:else}
                <Eye size={15} />
              {/if}
            </button>
          </div>
        </div>

        {#if testResult}
          <div class="status-banner" class:success={testResult.success} class:error={!testResult.success}>
            {#if testResult.success}
              <CheckCircle2 size={16} class="status-icon" />
            {:else}
              <AlertCircle size={16} class="status-icon" />
            {/if}
            <div class="status-text">
              <strong>{testResult.success ? 'Verification Succeeded' : 'Verification Failed'}</strong>
              <p>{testResult.message}</p>
            </div>
          </div>
        {/if}

        <div class="security-note">
          <Shield size={13} />
          <span>
            Keys are saved strictly to your browser's <code>localStorage</code> and transmitted
            directly to Google API endpoints. No intermediate servers or telemetry.
          </span>
        </div>
      </div>

      <footer class="modal-footer">
        <div class="footer-left">
          {#if saveFeedback}
            <span class="save-toast"><Check size={13} /> Saved to localStorage</span>
          {/if}
        </div>
        <div class="footer-actions">
          <button
            type="button"
            class="subtle-button"
            onclick={handleTestKey}
            disabled={isTesting || !apiKeyInput.trim()}
          >
            {#if isTesting}
              <Loader2 size={13} class="spin" /> Testing...
            {:else}
              <Sparkles size={13} /> Test Connection
            {/if}
          </button>
          <button
            type="button"
            class="primary-button"
            onclick={handleSaveKey}
            disabled={!apiKeyInput.trim()}
          >
            <Check size={13} /> Save Key
          </button>
        </div>
      </footer>
    </dialog>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    z-index: 100;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(8px);
  }

  .api-modal {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(540px, 100%);
    max-height: min(600px, 92vh);
    overflow: hidden;
    margin: 0;
    padding: 0;
    border: 1px solid #27272a;
    border-radius: 12px;
    background: #111114;
    color: #f4f4f5;
    box-shadow: 0 24px 90px rgba(0, 0, 0, 0.65);
    animation: rise-in 0.2s ease both;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #27272a;
    background: #151519;
  }

  .title-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--mono, monospace);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #38bdf8;
    text-transform: uppercase;
  }

  .title-group h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #fafafa;
  }

  .close-btn {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid #27272a;
    border-radius: 6px;
    background: #18181c;
    color: #a1a1aa;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: #ffffff;
    border-color: #3f3f46;
    background: #27272a;
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }

  .info-card {
    padding: 14px 16px;
    border: 1px solid #27272a;
    border-radius: 8px;
    background: #16161b;
  }

  .info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.28);
    color: #38bdf8;
    font-size: 11px;
    font-weight: 500;
  }

  .studio-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #38bdf8;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .studio-link:hover {
    color: #7dd3fc;
    text-decoration: underline;
  }

  .info-description {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: #a1a1aa;
  }

  .info-description strong {
    color: #e4e4e7;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .field-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-label-row label {
    font-size: 12px;
    font-weight: 500;
    color: #d4d4d8;
  }

  .label-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .text-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    color: #71717a;
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    transition: color 0.15s ease;
  }

  .text-btn:hover {
    color: #d4d4d8;
  }

  .text-btn.danger:hover {
    color: #f87171;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .key-icon-adornment {
    position: absolute;
    left: 11px;
    color: #71717a;
    pointer-events: none;
    display: grid;
    place-items: center;
  }

  .api-input {
    width: 100%;
    height: 38px;
    padding: 0 40px 0 34px;
    border: 1px solid #27272a;
    border-radius: 7px;
    background: #0d0d10;
    color: #fafafa;
    font-family: var(--mono, monospace);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .api-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
  }

  .visibility-toggle {
    position: absolute;
    right: 6px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: #71717a;
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .visibility-toggle:hover {
    color: #e4e4e7;
  }

  .status-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 7px;
    font-size: 12px;
    line-height: 1.45;
  }

  .status-banner.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .status-banner.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .status-text strong {
    display: block;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .status-text p {
    margin: 0;
    opacity: 0.9;
  }

  .security-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    background: #141418;
    color: #71717a;
    font-size: 11px;
    line-height: 1.45;
  }

  .security-note code {
    font-family: var(--mono, monospace);
    color: #a1a1aa;
    background: #1f1f23;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid #27272a;
    background: #151519;
  }

  .footer-left {
    display: flex;
    align-items: center;
  }

  .save-toast {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #4ade80;
    font-size: 12px;
    font-weight: 500;
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .subtle-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #27272a;
    border-radius: 6px;
    background: #1c1c22;
    color: #e4e4e7;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .subtle-button:hover:not(:disabled) {
    background: #27272f;
    border-color: #3f3f46;
  }

  .subtle-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .primary-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 6px;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    color: #ffffff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
    transition: all 0.15s ease;
  }

  .primary-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    box-shadow: 0 2px 12px rgba(2, 132, 199, 0.4);
  }

  .primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
