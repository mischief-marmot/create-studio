import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ImageUpload from '~/components/form/ImageUpload.vue'

// Mock File API
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('ImageUpload', () => {
  it('should render upload area when no image selected', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*'
      }
    })

    expect(wrapper.find('[data-testid="upload-area"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="image-preview"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Click to upload or drag and drop')
  })

  it('should show image preview when file is selected', async () => {
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: file,
        accept: 'image/*'
      }
    })

    expect(wrapper.find('[data-testid="image-preview"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="upload-area"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="remove-button"]').exists()).toBe(true)
  })

  it('should show preview for URL string', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: 'https://example.com/image.jpg',
        accept: 'image/*'
      }
    })

    expect(wrapper.find('[data-testid="image-preview"]').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/image.jpg')
  })

  it('should handle file selection via input', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*'
      }
    })

    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const input = wrapper.find('input[type="file"]')
    
    // Mock the file input change event
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as File
    expect(emittedValue).toBe(file)
  })

  it('should handle drag and drop', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*'
      }
    })

    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const dropzone = wrapper.find('[data-testid="upload-area"]')

    // Mock drag enter
    await dropzone.trigger('dragenter')
    expect(dropzone.classes()).toContain('border-primary')

    // Mock drag leave
    await dropzone.trigger('dragleave')
    expect(dropzone.classes()).not.toContain('border-primary')

    // Mock drop
    const dropEvent = new Event('drop') as any
    dropEvent.dataTransfer = {
      files: [file]
    }
    
    await dropzone.trigger('drop', dropEvent)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as File
    expect(emittedValue).toBe(file)
  })

  it('should validate file size', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*',
        maxSize: 1024 // 1KB
      }
    })

    const file = createMockFile('large.jpg', 2048, 'image/jpeg') // 2KB
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')![0][0]).toContain('File size too large')
  })

  it('should validate file type', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/jpeg,image/png'
      }
    })

    const file = createMockFile('document.pdf', 1024, 'application/pdf')
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')![0][0]).toContain('Invalid file type')
  })

  it('should remove selected file', async () => {
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: file,
        accept: 'image/*'
      }
    })

    await wrapper.find('[data-testid="remove-button"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe(null)
  })

  it('should show loading state during upload', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*',
        loading: true
      }
    })

    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    // Upload area should not exist when loading
    expect(wrapper.find('[data-testid="upload-area"]').exists()).toBe(false)
  })

  it('should display custom messages', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*',
        uploadText: 'Custom upload text',
        supportedFormats: 'JPG, PNG only'
      }
    })

    expect(wrapper.text()).toContain('Custom upload text')
    expect(wrapper.text()).toContain('JPG, PNG only')
  })

  it('should handle multiple files if enabled', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: [],
        accept: 'image/*',
        multiple: true
      }
    })

    const files = [
      createMockFile('test1.jpg', 1024, 'image/jpeg'),
      createMockFile('test2.png', 1024, 'image/png')
    ]
    
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: files,
      writable: false
    })

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as File[]
    expect(emittedValue).toHaveLength(2)
    expect(emittedValue[0]).toBe(files[0])
    expect(emittedValue[1]).toBe(files[1])
  })

  it('should show progress bar when uploading', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*',
        loading: true,
        progress: 45
      }
    })

    const progressBar = wrapper.find('[data-testid="progress-bar"]')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('value')).toBe('45')
  })

  it('should emit events for upload lifecycle', async () => {
    const wrapper = await mountSuspended(ImageUpload, {
      props: {
        modelValue: null,
        accept: 'image/*'
      }
    })

    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    
    // Simulate file selection
    await wrapper.vm.handleFileSelect([file])

    expect(wrapper.emitted('upload-start')).toBeTruthy()
    expect(wrapper.emitted('upload-start')![0][0]).toBe(file)

    // Simulate upload completion  
    await wrapper.vm.handleUploadComplete('https://example.com/uploaded.jpg')

    expect(wrapper.emitted('upload-complete')).toBeTruthy()
    expect(wrapper.emitted('upload-complete')![0][0]).toBe('https://example.com/uploaded.jpg')
  })
})