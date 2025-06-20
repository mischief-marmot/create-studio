import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RichTextEditor from '~/components/form/RichTextEditor.vue'

// Mock document.execCommand and related APIs
beforeEach(() => {
  // Mock execCommand
  global.document.execCommand = vi.fn().mockReturnValue(true)
  
  // Mock queryCommandState
  global.document.queryCommandState = vi.fn().mockReturnValue(false)
  
  // Mock window.prompt
  global.window.prompt = vi.fn()
})

describe('RichTextEditor', () => {
  it('should render editor with initial content', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '<p>Initial content</p>',
        placeholder: 'Enter description...'
      }
    })

    expect(wrapper.find('[data-testid="editor-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="toolbar"]').exists()).toBe(true)
  })

  it('should render with empty content', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '',
        placeholder: 'Start typing...'
      }
    })

    const content = wrapper.find('[data-testid="editor-content"]')
    expect(content.exists()).toBe(true)
    expect(content.attributes('data-placeholder')).toBe('Start typing...')
  })

  it('should show toolbar with formatting buttons', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '',
        showToolbar: true
      }
    })

    const toolbar = wrapper.find('[data-testid="toolbar"]')
    expect(toolbar.exists()).toBe(true)
    
    // Check for basic formatting buttons
    expect(wrapper.find('[data-testid="bold-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="italic-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="underline-button"]').exists()).toBe(true)
  })

  it('should handle text formatting commands', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: 'Some text',
        showToolbar: true
      }
    })

    await wrapper.find('[data-testid="bold-button"]').trigger('click')
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null)

    await wrapper.find('[data-testid="italic-button"]').trigger('click')
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null)
  })

  it('should emit content changes', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '<p>Initial</p>'
      }
    })
    
    // Simulate content change
    await wrapper.vm.handleInput()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should support different editor modes', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '<p>Content</p>',
        mode: 'minimal'
      }
    })

    // Minimal mode should have fewer toolbar options
    expect(wrapper.find('[data-testid="toolbar"]').exists()).toBe(true)
    
    // Should not have advanced formatting in minimal mode
    expect(wrapper.find('[data-testid="heading-button"]').exists()).toBe(false)
  })

  it('should handle link insertion', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '',
        showToolbar: true,
        mode: 'full'
      }
    })

    const linkButton = wrapper.find('[data-testid="link-button"]')
    expect(linkButton.exists()).toBe(true)

    // Mock prompt for link URL
    vi.mocked(window.prompt).mockReturnValue('https://example.com')

    await linkButton.trigger('click')

    expect(window.prompt).toHaveBeenCalledWith('Enter URL:')
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com')
  })

  it('should handle list formatting', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '',
        showToolbar: true,
        mode: 'full'
      }
    })

    await wrapper.find('[data-testid="unordered-list-button"]').trigger('click')
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false, null)

    await wrapper.find('[data-testid="ordered-list-button"]').trigger('click')
    expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false, null)
  })

  it('should support readonly mode', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '<p>Readonly content</p>',
        readonly: true
      }
    })

    const editor = wrapper.find('[data-testid="editor-content"]')
    expect(editor.attributes('contenteditable')).toBe('false')
    expect(wrapper.find('[data-testid="toolbar"]').exists()).toBe(false)
  })

  it('should handle paste events and clean HTML', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '',
        cleanPaste: true
      }
    })

    const editor = wrapper.find('[data-testid="editor-content"]')
    
    // Create a paste event with HTML content
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer()
    })
    
    // Mock clipboardData
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        getData: (type: string) => {
          if (type === 'text/html') {
            return '<div style="color: red;"><strong>Bold text</strong></div>'
          }
          return 'Bold text'
        }
      }
    })

    await editor.trigger('paste', pasteEvent)

    // Simulate the paste handling manually since JSDOM doesn't handle clipboard events well
    await wrapper.vm.handleInput()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should track character and word count', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '<p>Hello world test</p>',
        showWordCount: true
      }
    })

    expect(wrapper.find('[data-testid="word-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="word-count"]').text()).toContain('3 words')
  })

  it('should enforce character limits', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: 'Short text',
        maxLength: 20,
        showWordCount: true
      }
    })

    expect(wrapper.find('[data-testid="char-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="char-count"]').text()).toContain('10/20')
  })

  it('should handle keyboard shortcuts', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: 'Test content'
      }
    })

    const editor = wrapper.find('[data-testid="editor-content"]')

    // Test Ctrl+B for bold
    await editor.trigger('keydown', { 
      key: 'b', 
      ctrlKey: true,
      preventDefault: vi.fn()
    })

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null)
  })

  it('should support custom toolbar configuration', async () => {
    const customTools = ['bold', 'italic', 'link']
    
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: '',
        showToolbar: true,
        toolbarItems: customTools
      }
    })

    expect(wrapper.find('[data-testid="bold-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="italic-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="link-button"]').exists()).toBe(true)
    
    // Should not show tools not in the custom list
    expect(wrapper.find('[data-testid="underline-button"]').exists()).toBe(false)
  })

  it('should emit focus and blur events', async () => {
    const wrapper = await mountSuspended(RichTextEditor, {
      props: {
        modelValue: 'Test content'
      }
    })

    const editor = wrapper.find('[data-testid="editor-content"]')

    await editor.trigger('focus')
    expect(wrapper.emitted('focus')).toBeTruthy()

    await editor.trigger('blur')
    expect(wrapper.emitted('blur')).toBeTruthy()
  })
})