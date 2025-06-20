<template>
  <div class="rich-text-editor" :class="{ 'is-focused': isFocused, 'is-readonly': readonly }">
    <!-- Toolbar -->
    <div 
      v-if="showToolbar && !readonly" 
      :data-testid="'toolbar'"
      class="toolbar border-b border-base-300 p-2 bg-base-50 rounded-t-lg"
    >
      <div class="flex flex-wrap gap-1">
        <!-- Basic Formatting -->
        <template v-if="toolbarItems.includes('bold')">
          <button
            :data-testid="'bold-button'"
            type="button"
            class="btn btn-xs btn-ghost"
            :class="{ 'btn-active': isCommandActive('bold') }"
            @click="execCommand('bold')"
            title="Bold (Ctrl+B)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3V5H5V3H7ZM7 17V19H5V17H7ZM5 3C3.89543 3 3 3.89543 3 5V17C3 18.1046 3.89543 19 5 19H7V17V3H5Z"/>
              <path d="M11 3C9.34315 3 8 4.34315 8 6S9.34315 9 11 9H13C14.6569 9 16 10.3431 16 12S14.6569 15 13 15H11C9.34315 15 8 13.6569 8 12V11H10V12C10 12.5523 10.4477 13 11 13H13C13.5523 13 14 12.5523 14 12S13.5523 11 13 11H11C8.23858 11 6 8.76142 6 6S8.23858 1 11 1H13C15.7614 1 18 3.23858 18 6V7H16V6C16 4.34315 14.6569 3 13 3H11Z"/>
            </svg>
          </button>
        </template>

        <template v-if="toolbarItems.includes('italic')">
          <button
            :data-testid="'italic-button'"
            type="button"
            class="btn btn-xs btn-ghost"
            :class="{ 'btn-active': isCommandActive('italic') }"
            @click="execCommand('italic')"
            title="Italic (Ctrl+I)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 4L8 4V6L10 6V14L8 14V16L12 16V14L10 14V6L12 6V4L10 4Z"/>
            </svg>
          </button>
        </template>

        <template v-if="toolbarItems.includes('underline')">
          <button
            :data-testid="'underline-button'"
            type="button"
            class="btn btn-xs btn-ghost"
            :class="{ 'btn-active': isCommandActive('underline') }"
            @click="execCommand('underline')"
            title="Underline (Ctrl+U)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 3V11C6 13.2091 7.79086 15 10 15S14 13.2091 14 11V3H16V11C16 14.3137 13.3137 17 10 17S4 14.3137 4 11V3H6ZM4 19V21H16V19H4Z"/>
            </svg>
          </button>
        </template>

        <!-- Separator -->
        <div v-if="toolbarItems.some(item => ['bold', 'italic', 'underline'].includes(item)) && toolbarItems.some(item => !['bold', 'italic', 'underline'].includes(item))" class="divider divider-horizontal mx-1"></div>

        <!-- Lists -->
        <template v-if="toolbarItems.includes('unordered-list')">
          <button
            :data-testid="'unordered-list-button'"
            type="button"
            class="btn btn-xs btn-ghost"
            :class="{ 'btn-active': isCommandActive('insertUnorderedList') }"
            @click="execCommand('insertUnorderedList')"
            title="Bullet List"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 6C4.55228 6 5 5.55228 5 5S4.55228 4 4 4S3 4.44772 3 5S3.44772 6 4 6ZM8 4V6H17V4H8ZM4 11C4.55228 11 5 10.5523 5 10S4.55228 9 4 9S3 9.44772 3 10S3.44772 11 4 11ZM8 9V11H17V9H8ZM4 16C4.55228 16 5 15.5523 5 15S4.55228 14 4 14S3 14.4477 3 15S3.44772 16 4 16ZM8 14V16H17V14H8Z"/>
            </svg>
          </button>
        </template>

        <template v-if="toolbarItems.includes('ordered-list')">
          <button
            :data-testid="'ordered-list-button'"
            type="button"
            class="btn btn-xs btn-ghost"
            :class="{ 'btn-active': isCommandActive('insertOrderedList') }"
            @click="execCommand('insertOrderedList')"
            title="Numbered List"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4V2H4V4H5V5H2V4H3ZM2 7H3.5L2 8.5V9H5V8H3.5L5 6.5V6H2V7ZM2 11H4C4.55228 11 5 11.4477 5 12C5 12.5523 4.55228 13 4 13H3V14H5V15H2V11ZM8 4V6H17V4H8ZM8 9V11H17V9H8ZM8 14V16H17V14H8Z"/>
            </svg>
          </button>
        </template>

        <!-- Advanced Tools -->
        <template v-if="toolbarItems.includes('link')">
          <button
            :data-testid="'link-button'"
            type="button"
            class="btn btn-xs btn-ghost"
            @click="insertLink"
            title="Insert Link"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
            </svg>
          </button>
        </template>

        <!-- Headings -->
        <template v-if="toolbarItems.includes('heading')">
          <select
            :data-testid="'heading-button'"
            class="select select-xs"
            @change="formatHeading($event.target.value)"
          >
            <option value="">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </template>
      </div>
    </div>

    <!-- Editor Content -->
    <div
      :data-testid="'editor-content'"
      ref="editorRef"
      class="editor-content"
      :class="[
        'min-h-32 p-3 border border-base-300 focus:border-primary focus:outline-none',
        showToolbar && !readonly ? 'rounded-b-lg border-t-0' : 'rounded-lg',
        readonly ? 'bg-base-100' : 'bg-white'
      ]"
      :contenteditable="!readonly"
      :data-placeholder="placeholder"
      v-html="modelValue"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="handlePaste"
      @keydown="handleKeydown"
    ></div>

    <!-- Word/Character Count -->
    <div v-if="showWordCount || maxLength" class="flex justify-between items-center mt-2 text-sm text-base-content/60">
      <div v-if="showWordCount" :data-testid="'word-count'">
        {{ wordCount }} words
      </div>
      <div v-if="maxLength" :data-testid="'char-count'" :class="{ 'text-error': characterCount > maxLength }">
        {{ characterCount }}/{{ maxLength }}
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-2 text-error text-sm">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  readonly?: boolean
  showToolbar?: boolean
  mode?: 'minimal' | 'basic' | 'full'
  toolbarItems?: string[]
  maxLength?: number
  showWordCount?: boolean
  cleanPaste?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start typing...',
  readonly: false,
  showToolbar: true,
  mode: 'basic',
  toolbarItems: () => [],
  maxLength: undefined,
  showWordCount: false,
  cleanPaste: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': []
  'blur': []
}>()

const editorRef = ref<HTMLElement>()
const isFocused = ref(false)
const errorMessage = ref('')

// Default toolbar configurations
const toolbarConfigs = {
  minimal: ['bold', 'italic'],
  basic: ['bold', 'italic', 'underline', 'link', 'unordered-list'],
  full: ['bold', 'italic', 'underline', 'link', 'unordered-list', 'ordered-list', 'heading']
}

const toolbarItems = computed(() => {
  if (props.toolbarItems.length > 0) {
    return props.toolbarItems
  }
  return toolbarConfigs[props.mode] || toolbarConfigs.basic
})

const textContent = computed(() => {
  if (!props.modelValue) return ''
  const temp = document.createElement('div')
  temp.innerHTML = props.modelValue
  return temp.textContent || temp.innerText || ''
})

const wordCount = computed(() => {
  const words = textContent.value.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length
})

const characterCount = computed(() => {
  return textContent.value.length
})

function execCommand(command: string, value: string | null = null) {
  document.execCommand(command, false, value)
  editorRef.value?.focus()
  handleInput()
}

function isCommandActive(command: string): boolean {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

function insertLink() {
  const url = window.prompt('Enter URL:')
  if (url) {
    execCommand('createLink', url)
  }
}

function formatHeading(tagName: string) {
  if (tagName) {
    execCommand('formatBlock', `<${tagName}>`)
  } else {
    execCommand('formatBlock', '<p>')
  }
}

function handleInput() {
  const content = editorRef.value?.innerHTML || ''
  
  // Check length limit
  if (props.maxLength && characterCount.value > props.maxLength) {
    errorMessage.value = `Content exceeds maximum length of ${props.maxLength} characters`
  } else {
    errorMessage.value = ''
  }

  emit('update:modelValue', content)
}

function handleFocus() {
  isFocused.value = true
  emit('focus')
}

function handleBlur() {
  isFocused.value = false
  emit('blur')
}

function handlePaste(event: ClipboardEvent) {
  if (!props.cleanPaste) return

  event.preventDefault()

  const clipboardData = event.clipboardData
  if (!clipboardData) return

  let pastedText = clipboardData.getData('text/plain')
  
  // If HTML is available and clean paste is enabled, clean it
  const pastedHTML = clipboardData.getData('text/html')
  if (pastedHTML && props.cleanPaste) {
    pastedText = cleanHTML(pastedHTML)
  }

  // Insert the cleaned text
  execCommand('insertText', pastedText)
}

function cleanHTML(html: string): string {
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Remove all styling attributes and keep only basic formatting
  const allowedTags = ['strong', 'b', 'em', 'i', 'u', 'p', 'br', 'ul', 'ol', 'li']
  const walker = document.createTreeWalker(
    temp,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const element = node as Element
        if (allowedTags.includes(element.tagName.toLowerCase())) {
          // Remove all attributes except href for links
          Array.from(element.attributes).forEach(attr => {
            if (!(element.tagName.toLowerCase() === 'a' && attr.name === 'href')) {
              element.removeAttribute(attr.name)
            }
          })
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_REJECT
      }
    }
  )

  const cleanNodes: Node[] = []
  let node
  while (node = walker.nextNode()) {
    cleanNodes.push(node)
  }

  return temp.textContent || temp.innerText || ''
}

function handleKeydown(event: KeyboardEvent) {
  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault()
        execCommand('bold')
        break
      case 'i':
        event.preventDefault()
        execCommand('italic')
        break
      case 'u':
        event.preventDefault()
        execCommand('underline')
        break
      case 'k':
        event.preventDefault()
        insertLink()
        break
    }
  }
}

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && editorRef.value.innerHTML !== newValue) {
    editorRef.value.innerHTML = newValue
  }
})

// Expose methods for testing
defineExpose({
  handleInput,
  execCommand,
  insertLink,
  formatHeading
})
</script>

<style scoped>
.editor-content {
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.editor-content:empty:before {
  content: attr(data-placeholder);
  color: hsl(var(--bc) / 0.4);
  pointer-events: none;
}

.editor-content:focus {
  outline: 2px solid hsl(var(--p));
  outline-offset: -2px;
}

.editor-content p {
  margin: 0.5em 0;
}

.editor-content p:first-child {
  margin-top: 0;
}

.editor-content p:last-child {
  margin-bottom: 0;
}

.editor-content ul,
.editor-content ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.editor-content h1,
.editor-content h2,
.editor-content h3 {
  margin: 0.8em 0 0.4em 0;
  font-weight: bold;
}

.editor-content h1 {
  font-size: 1.5em;
}

.editor-content h2 {
  font-size: 1.3em;
}

.editor-content h3 {
  font-size: 1.1em;
}

.editor-content a {
  color: hsl(var(--p));
  text-decoration: underline;
}

.toolbar {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.is-readonly .editor-content {
  cursor: default;
}
</style>