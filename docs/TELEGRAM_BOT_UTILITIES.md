# Telegram Bot Utilities Documentation

## 📚 Overview

This document describes the advanced utilities available for the MusicVerse AI Telegram bot. These utilities provide a consistent, powerful, and easy-to-use API for building rich bot interfaces.

## 🎨 Message Formatter (`message-formatter.ts`)

The message formatter provides tools for creating beautifully formatted messages with consistent styling.

### Basic Usage

```typescript
import { buildMessage, createSection } from '../utils/message-formatter.ts';

const message = buildMessage({
  title: 'Welcome to MusicVerse',
  emoji: '🎵',
  description: 'Create professional music with AI',
  sections: [
    {
      title: 'Features',
      content: ['Generate tracks', 'Manage projects', 'Share music'],
      emoji: '✨',
      style: 'list'
    }
  ],
  footer: 'Get started below 👇'
});
```

### Available Functions

#### Text Formatting

- **`escapeMarkdownV2(text)`** - Enhanced escaping for MarkdownV2
- **`createHeader(text, emoji?, level?)`** - Create formatted headers (levels 1-3)
- **`createSection(section)`** - Create a message section with title and content
- **`createList(items, options?)`** - Create bulleted or numbered lists
- **`createKeyValue(pairs, options?)`** - Display key-value pairs
- **`createDivider(type?, length?)`** - Create visual separators
- **`truncateText(text, maxLength, options?)`** - Smart text truncation

#### Visual Elements

- **`createProgressBar(options)`** - Create ASCII progress bars
- **`createStatus(status, message)`** - Create status indicators (✅ ❌ ⏳ etc.)
- **`createBadge(text, emoji?)`** - Create inline badges

#### Formatting Helpers

- **`formatDuration(seconds)`** - Format seconds to "1ч 30м" or "2м 15с"
- **`formatFileSize(bytes)`** - Format bytes to "10.5 МБ"
- **`formatRelativeTime(timestamp)`** - Format to "2 дн назад"

### Pre-built Templates

```typescript
import { 
  createWelcomeMessage,
  createTrackInfoMessage,
  createErrorMessage,
  createSuccessMessage,
  createLoadingMessage
} from '../utils/message-formatter.ts';

// Welcome message
const welcome = createWelcomeMessage('John');

// Track info
const trackInfo = createTrackInfoMessage({
  title: 'My Song',
  artist: 'AI Artist',
  duration: 180,
  style: 'Rock'
});

// Error with suggestions
const error = createErrorMessage(
  'Failed to generate track',
  ['Check your description', 'Try again', 'Contact support']
);

// Success with details
const success = createSuccessMessage(
  'Track created!',
  'Your track is ready to listen',
  { 'Duration': '3:00', 'Style': 'Rock' }
);

// Loading with progress
const loading = createLoadingMessage(
  'Generating track',
  { current: 50, total: 100 }
);
```

### Message Templates

```typescript
const message = buildMessage({
  title: 'Track Status',
  emoji: '🎵',
  description: 'Your generation is in progress',
  sections: [
    {
      title: 'Details',
      content: createKeyValue({ 
        'Model': 'V5',
        'Type': 'Instrumental'
      }),
      emoji: 'ℹ️'
    },
    {
      title: 'Tips',
      content: ['Wait 1-3 minutes', 'Check notifications'],
      emoji: '💡',
      style: 'list'
    }
  ],
  footer: 'We'll notify you when ready'
});
```

## 🎮 Button Builder (`button-builder.ts`)

The button builder provides a fluent API for creating inline keyboards.

### Basic Usage

```typescript
import { ButtonBuilder } from '../utils/button-builder.ts';

const keyboard = new ButtonBuilder()
  .addButton({
    text: 'Create Track',
    emoji: '🎼',
    action: { type: 'callback', data: 'create_track' }
  })
  .addRow(
    {
      text: 'Library',
      emoji: '📚',
      action: { type: 'callback', data: 'library' }
    },
    {
      text: 'Projects',
      emoji: '📁',
      action: { type: 'callback', data: 'projects' }
    }
  )
  .build();

await sendMessage(chatId, 'Choose action:', keyboard);
```

### Button Actions

```typescript
// Callback button
{
  text: 'Action',
  emoji: '🎵',
  action: { type: 'callback', data: 'action_id' }
}

// URL button
{
  text: 'Open Link',
  action: { type: 'url', url: 'https://example.com' }
}

// Web App button
{
  text: 'Open App',
  action: { type: 'webapp', url: 'https://app.example.com' }
}

// Inline query button
{
  text: 'Share',
  action: { type: 'switch_inline', query: 'track_123' }
}
```

### Preset Button Groups

```typescript
const keyboard = new ButtonBuilder()
  .addPreset('navigation')  // Main menu navigation
  .addPreset('media_player', { trackId: '123', page: 0, total: 5 })
  .addPreset('track_actions', { trackId: '123' })
  .addPreset('pagination', { page: 2, total: 10, prefix: 'lib_page' })
  .addPreset('confirmation', { 
    confirmData: 'confirm_delete',
    cancelData: 'cancel',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })
  .addPreset('back_home')
  .build();
```

### Quick Helpers

```typescript
import { 
  quickButtons,
  buttonGrid,
  navigationKeyboard,
  trackActionKeyboard,
  paginationKeyboard,
  mediaPlayerKeyboard,
  confirmationKeyboard,
  webAppButton,
  shareButton,
  mergeKeyboards,
  addBackButton
} from '../utils/button-builder.ts';

// Quick single buttons
const kb1 = quickButtons(
  { text: 'Action 1', data: 'act1', emoji: '🎵' },
  { text: 'Action 2', data: 'act2', emoji: '🎸' }
);

// Button grid
const kb2 = buttonGrid([
  [{ text: 'A', data: 'a' }, { text: 'B', data: 'b' }],
  [{ text: 'C', data: 'c' }, { text: 'D', data: 'd' }]
]);

// Pre-built keyboards
const nav = navigationKeyboard();
const track = trackActionKeyboard('track_123', { withNavigation: true });
const pages = paginationKeyboard(2, 10, 'page');
const player = mediaPlayerKeyboard('track_123', 0, 5);
const confirm = confirmationKeyboard('delete', 'cancel');
const webapp = webAppButton('Open App', '/studio');
const share = shareButton('track_123');

// Merge keyboards
const combined = mergeKeyboards(kb1, kb2);

// Add back button
const withBack = addBackButton(kb1, 'nav_main', 'Back to Menu');
```

## 📮 Message Manager (`message-manager.ts`)

The message manager handles message lifecycle, auto-replace, auto-delete, and cleanup.

### Basic Usage

```typescript
import { trackMessage, messageManager } from '../utils/message-manager.ts';

// Track a message with automatic expiration
const result = await sendMessage(chatId, 'Hello!', keyboard);
if (result?.result?.message_id) {
  await trackMessage(
    chatId,
    result.result.message_id,
    'temp',           // type: menu | notification | status | content | temp
    'temp',           // category
    { 
      expiresIn: 30000,  // 30 seconds
      persistent: false
    }
  );
}
```

### Message Types and Categories

**Types:**
- `menu` - Menu messages (auto-replaces previous menus)
- `notification` - Notification messages
- `status` - Status updates (auto-replaces previous status)
- `content` - Content messages
- `temp` - Temporary messages

**Categories:**
- `main_menu`, `library`, `projects`, `settings`
- `generation`, `upload`, `analysis`
- `help`, `error`, `success`, `loading`
- `temp`

### Auto-Replace Logic

```typescript
// Send a menu message - automatically replaces previous menu
const result = await sendMessage(chatId, menuMessage, keyboard);
await trackMessage(chatId, result.result.message_id, 'menu', 'main_menu', {
  persistent: true  // Keep until explicit action
});

// Send status update - automatically replaces previous status
const statusResult = await sendMessage(chatId, statusMessage);
await trackMessage(chatId, statusResult.result.message_id, 'status', 'generation', {
  expiresIn: 120000  // 2 minutes
});
```

### Manual Message Management

```typescript
// Delete a specific message
await messageManager.deleteTrackedMessage(chatId, messageId);

// Delete all messages in a category
await messageManager.deleteCategory(chatId, 'loading');

// Delete all temporary messages
await messageManager.deleteTemporary(chatId);

// Delete expired messages
await messageManager.deleteExpired(chatId);

// Clear all messages for a chat
await messageManager.clearChat(chatId, { keepPersistent: true });

// Mark message as persistent
messageManager.markPersistent(chatId, messageId);

// Update message metadata
messageManager.updateMetadata(chatId, messageId, { data: 'value' });
```

### Helper Functions

```typescript
import { 
  sendTemporaryMessage,
  cleanupTemporary,
  replaceInCategory
} from '../utils/message-manager.ts';

// Send a temporary message (auto-deletes after 10s)
await sendTemporaryMessage(
  chatId,
  async () => await sendMessage(chatId, 'Processing...'),
  10000
);

// Clean up all temporary messages
await cleanupTemporary(chatId);

// Replace messages in category except one
await replaceInCategory(chatId, 'loading', newMessageId);
```

## 📝 Text Processor (`text-processor.ts`)

The text processor provides advanced text manipulation and validation.

### MarkdownV2 Processing

```typescript
import { 
  escapeMarkdownV2,
  escapeCodeBlock,
  escapeInlineCode,
  stripMarkdown,
  isValidMarkdown,
  sanitizeMarkdown
} from '../utils/text-processor.ts';

// Escape text for MarkdownV2
const escaped = escapeMarkdownV2('Hello! This is a test [link].');

// Escape for code blocks
const codeEscaped = escapeCodeBlock('function test() { return `value`; }');

// Strip all markdown
const plain = stripMarkdown('*Bold* and _italic_ text');

// Validate markdown
if (isValidMarkdown(text)) {
  // Text is valid
}

// Sanitize and fix common issues
const fixed = sanitizeMarkdown(text);
```

### HTML Processing

```typescript
import { 
  htmlToMarkdown,
  stripHtml
} from '../utils/text-processor.ts';

// Convert HTML to MarkdownV2
const markdown = htmlToMarkdown('<b>Bold</b> and <i>italic</i>');

// Strip all HTML tags
const plain = stripHtml('<p>Text with <span>HTML</span></p>');
```

### Text Validation

```typescript
import { 
  isSafeText,
  isValidLength,
  hasValidCharacters
} from '../utils/text-processor.ts';

// Check for malicious content
if (!isSafeText(userInput)) {
  // Reject input
}

// Validate length for Telegram
if (!isValidLength(text, 4096)) {
  // Text too long
}

// Check for valid characters
if (!hasValidCharacters(text)) {
  // Contains invalid characters
}
```

### Text Transformation

```typescript
import { 
  smartTruncate,
  splitIntoChunks,
  addLineNumbers,
  highlightText,
  normalizeWhitespace,
  cleanSunoTags,
  formatList,
  createTable
} from '../utils/text-processor.ts';

// Smart truncation
const short = smartTruncate(longText, 100, {
  ellipsis: '...',
  breakWords: false,
  preserveMarkdown: true
});

// Split into chunks for Telegram limit
const chunks = splitIntoChunks(veryLongText, 4000, {
  preserveLines: true,
  addContinuation: true
});

// Add line numbers
const numbered = addLineNumbers(code, 1);

// Highlight search query
const highlighted = highlightText(text, 'search term', 'bold');

// Normalize whitespace
const normalized = normalizeWhitespace(messyText);

// Clean Suno-style tags from lyrics
const cleanLyrics = cleanSunoTags(lyrics);

// Format list
const list = formatList(['Item 1', 'Item 2'], 'numbered');

// Create table
const table = createTable(
  ['Name', 'Value', 'Status'],
  [
    ['Track 1', '100', 'Done'],
    ['Track 2', '50', 'Processing']
  ],
  { alignNumbers: true }
);
```

## 💡 Best Practices

### 1. Message Tracking

Always track messages that should be auto-deleted or replaced:

```typescript
const result = await sendMessage(chatId, message, keyboard, 'MarkdownV2');
if (result?.result?.message_id) {
  await trackMessage(chatId, result.result.message_id, 'menu', 'main_menu', {
    persistent: true
  });
}
```

### 2. Error Handling

Use consistent error messages:

```typescript
try {
  // Your code
} catch (error) {
  const errorMsg = createErrorMessage(
    'Operation failed',
    ['Try again', 'Check connection', 'Contact support']
  );
  
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Retry',
      emoji: '🔄',
      action: { type: 'callback', data: 'retry' }
    })
    .addPreset('back_home')
    .build();
  
  await sendMessage(chatId, errorMsg, keyboard, 'MarkdownV2');
}
```

### 3. Loading States

Show loading states for long operations:

```typescript
const loadingMsg = createLoadingMessage('Processing your request');
const result = await sendMessage(chatId, loadingMsg, undefined, 'MarkdownV2');

// Track as temporary
if (result?.result?.message_id) {
  await trackMessage(chatId, result.result.message_id, 'status', 'loading', {
    expiresIn: 30000
  });
}

// Perform operation
await longOperation();

// Success message will auto-replace loading message
const successMsg = createSuccessMessage('Done!', 'Operation completed');
await sendMessage(chatId, successMsg);
```

### 4. Input Validation

Always validate user input:

```typescript
if (!isSafeText(userInput)) {
  const errorMsg = createErrorMessage(
    'Invalid input',
    ['Use only regular text', 'Avoid special characters']
  );
  await sendMessage(chatId, errorMsg);
  return;
}

const escaped = escapeMarkdownV2(userInput);
// Use escaped text
```

### 5. Button Organization

Keep buttons organized and consistent:

```typescript
const keyboard = new ButtonBuilder()
  // Main actions first
  .addButton({
    text: 'Primary Action',
    emoji: '✨',
    action: { type: 'callback', data: 'primary' }
  })
  // Secondary actions in rows
  .addRow(
    {
      text: 'Action 1',
      emoji: '🎵',
      action: { type: 'callback', data: 'act1' }
    },
    {
      text: 'Action 2',
      emoji: '🎸',
      action: { type: 'callback', data: 'act2' }
    }
  })
  // Navigation at the bottom
  .addPreset('back_home')
  .build();
```

## 🎯 Common Patterns

### Pattern 1: Command with Error Handling

```typescript
export async function handleMyCommand(chatId: number, userId: number) {
  try {
    // Validate user
    const profile = await getProfile(userId);
    if (!profile) {
      const errorMsg = createErrorMessage(
        'Profile not found',
        ['Open the app to register']
      );
      const keyboard = webAppButton('Open App', '');
      await sendMessage(chatId, errorMsg, keyboard, 'MarkdownV2');
      return;
    }
    
    // Show loading
    const loadingMsg = createLoadingMessage('Processing');
    const loadingResult = await sendMessage(chatId, loadingMsg, undefined, 'MarkdownV2');
    
    // Perform operation
    const data = await fetchData();
    
    // Show result
    const resultMsg = buildMessage({
      title: 'Results',
      emoji: '✨',
      sections: [
        {
          title: 'Data',
          content: createKeyValue(data),
          emoji: 'ℹ️'
        }
      ]
    });
    
    const keyboard = new ButtonBuilder()
      .addButton({
        text: 'Action',
        emoji: '🎵',
        action: { type: 'callback', data: 'action' }
      })
      .addPreset('back_home')
      .build();
    
    const result = await sendMessage(chatId, resultMsg, keyboard, 'MarkdownV2');
    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, 'content', 'my_command', {
        expiresIn: 300000  // 5 minutes
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    const errorMsg = createErrorMessage(
      'Operation failed',
      ['Try again', 'Contact support']
    );
    await sendMessage(chatId, errorMsg);
  }
}
```

### Pattern 2: List with Pagination

```typescript
export async function handleList(chatId: number, page: number = 0) {
  const items = await fetchItems();
  const perPage = 5;
  const total = Math.ceil(items.length / perPage);
  const pageItems = items.slice(page * perPage, (page + 1) * perPage);
  
  const itemList = pageItems.map((item, i) => 
    `${i + 1}\\. ${escapeMarkdownV2(item.name)}`
  );
  
  const message = buildMessage({
    title: 'Item List',
    emoji: '📋',
    description: `Page ${page + 1} of ${total}`,
    sections: [
      {
        title: 'Items',
        content: itemList.join('\n'),
        emoji: '•'
      }
    ]
  });
  
  const keyboard = paginationKeyboard(page, total, 'list_page');
  await sendMessage(chatId, message, keyboard, 'MarkdownV2');
}
```

### Pattern 3: Confirmation Dialog

```typescript
export async function handleDelete(chatId: number, itemId: string) {
  const message = buildMessage({
    title: 'Confirm Deletion',
    emoji: '⚠️',
    description: 'Are you sure you want to delete this item?',
    sections: [
      {
        title: 'Warning',
        content: 'This action cannot be undone',
        emoji: '❗'
      }
    ]
  });
  
  const keyboard = confirmationKeyboard(
    `confirm_delete_${itemId}`,
    'cancel_delete',
    { confirmText: 'Delete', cancelText: 'Cancel' }
  );
  
  const result = await sendMessage(chatId, message, keyboard, 'MarkdownV2');
  if (result?.result?.message_id) {
    await trackMessage(chatId, result.result.message_id, 'temp', 'temp', {
      expiresIn: 60000  // 1 minute
    });
  }
}
```

## 🔧 Troubleshooting

### Issue: MarkdownV2 Parse Error

**Problem:** Message fails to send with parse error.

**Solution:** Ensure all text is properly escaped:
```typescript
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
const safe = escapeMarkdownV2(userInput);
```

### Issue: Buttons Not Working

**Problem:** Callback queries not received.

**Solution:** Check callback_data is properly set:
```typescript
{
  text: 'Button',
  action: { type: 'callback', data: 'action_id' }  // Not 'callback_data'
}
```

### Issue: Messages Not Auto-Deleting

**Problem:** Old messages remain in chat.

**Solution:** Ensure messages are tracked:
```typescript
await trackMessage(chatId, messageId, 'temp', 'temp', {
  expiresIn: 30000
});
```

---

For more examples, see the command implementations in `supabase/functions/telegram-bot/commands/`.
