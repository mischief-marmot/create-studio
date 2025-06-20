import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DynamicFieldArray from '~/components/form/DynamicFieldArray.vue'

describe('DynamicFieldArray', () => {
  it('should render with initial empty state', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [],
        fieldSchema: {
          name: { type: 'text', label: 'Name', required: true }
        },
        addButtonText: 'Add Item'
      }
    })

    expect(wrapper.find('[data-testid="add-button"]').text()).toBe('Add Item')
    expect(wrapper.findAll('[data-testid="field-group"]')).toHaveLength(0)
  })

  it('should render existing items', async () => {
    const items = [
      { name: 'Flour', quantity: 2, unit: 'cups' },
      { name: 'Sugar', quantity: 1, unit: 'cup' }
    ]

    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: items,
        fieldSchema: {
          name: { type: 'text', label: 'Name', required: true },
          quantity: { type: 'number', label: 'Quantity' },
          unit: { type: 'text', label: 'Unit' }
        },
        addButtonText: 'Add Ingredient'
      }
    })

    const fieldGroups = wrapper.findAll('[data-testid="field-group"]')
    expect(fieldGroups).toHaveLength(2)
    
    const firstGroup = fieldGroups[0]
    expect((firstGroup.find('input[name="name"]').element as HTMLInputElement).value).toBe('Flour')
    expect((firstGroup.find('input[name="quantity"]').element as HTMLInputElement).value).toBe('2')
    expect((firstGroup.find('input[name="unit"]').element as HTMLInputElement).value).toBe('cups')
  })

  it('should add new item when add button clicked', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [],
        fieldSchema: {
          name: { type: 'text', label: 'Name', required: true }
        },
        addButtonText: 'Add Item'
      }
    })

    await wrapper.find('[data-testid="add-button"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as any[]
    expect(emittedValue).toEqual([{ name: '' }])
    
    // Test that the component would show the new item if re-rendered with updated modelValue
    await wrapper.setProps({ modelValue: emittedValue })
    expect(wrapper.findAll('[data-testid="field-group"]')).toHaveLength(1)
  })

  it('should remove item when remove button clicked', async () => {
    const items = [
      { name: 'Flour' },
      { name: 'Sugar' }
    ]

    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: items,
        fieldSchema: {
          name: { type: 'text', label: 'Name', required: true }
        }
      }
    })

    const removeButtons = wrapper.findAll('[data-testid="remove-button"]')
    expect(removeButtons).toHaveLength(2)

    await removeButtons[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as any[]
    expect(emittedValue).toEqual([{ name: 'Sugar' }])
  })

  it('should update item when field value changes', async () => {
    const items = [{ name: 'Flour', quantity: 2 }]

    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: items,
        fieldSchema: {
          name: { type: 'text', label: 'Name', required: true },
          quantity: { type: 'number', label: 'Quantity' }
        }
      }
    })

    const nameInput = wrapper.find('input[name="name"]')
    await nameInput.setValue('All-purpose flour')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as any[]
    expect(emittedValue[0].name).toBe('All-purpose flour')
    expect(emittedValue[0].quantity).toBe(2)
  })

  it('should handle different field types', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [{}],
        fieldSchema: {
          name: { type: 'text', label: 'Name' },
          quantity: { type: 'number', label: 'Quantity' },
          required: { type: 'checkbox', label: 'Required' },
          category: { 
            type: 'select', 
            label: 'Category',
            options: [
              { value: 'ingredient', label: 'Ingredient' },
              { value: 'spice', label: 'Spice' }
            ]
          }
        }
      }
    })

    const fieldGroup = wrapper.find('[data-testid="field-group"]')
    expect(fieldGroup.find('input[type="text"]').exists()).toBe(true)
    expect(fieldGroup.find('input[type="number"]').exists()).toBe(true)
    expect(fieldGroup.find('input[type="checkbox"]').exists()).toBe(true)
    expect(fieldGroup.find('select').exists()).toBe(true)
  })

  it('should show validation errors for required fields', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [{ name: '' }],
        fieldSchema: {
          name: { type: 'text', label: 'Name', required: true }
        },
        showValidation: true
      }
    })

    const fieldGroup = wrapper.find('[data-testid="field-group"]')
    expect(fieldGroup.find('[data-testid="validation-error"]').exists()).toBe(true)
    expect(fieldGroup.find('[data-testid="validation-error"]').text()).toContain('Name is required')
  })

  it('should support custom field templates', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [{ instruction: 'Mix ingredients' }],
        fieldSchema: {
          instruction: { type: 'textarea', label: 'Instruction', rows: 3 }
        }
      }
    })

    const textarea = wrapper.find('textarea[name="instruction"]')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('rows')).toBe('3')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Mix ingredients')
  })

  it('should support drag and drop reordering', async () => {
    const items = [
      { name: 'First' },
      { name: 'Second' },
      { name: 'Third' }
    ]

    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: items,
        fieldSchema: {
          name: { type: 'text', label: 'Name' }
        },
        sortable: true
      }
    })

    const dragHandles = wrapper.findAll('[data-testid="drag-handle"]')
    expect(dragHandles).toHaveLength(3)

    // Simulate drag and drop reordering
    await wrapper.vm.moveItem(0, 2)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as any[]
    expect(emittedValue.map((item: any) => item.name)).toEqual(['Second', 'Third', 'First'])
  })

  it('should support minimum and maximum item limits', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [{ name: 'Item 1' }],
        fieldSchema: {
          name: { type: 'text', label: 'Name' }
        },
        minItems: 1,
        maxItems: 2
      }
    })

    // Should not show remove button when at minimum
    expect(wrapper.find('[data-testid="remove-button"]').exists()).toBe(false)

    // Add one more item
    await wrapper.find('[data-testid="add-button"]').trigger('click')
    const emittedValue = wrapper.emitted('update:modelValue')![0][0] as any[]
    await wrapper.setProps({ modelValue: emittedValue })
    
    // Now should show remove buttons
    expect(wrapper.findAll('[data-testid="remove-button"]')).toHaveLength(2)
    
    // Should not show add button when at maximum
    expect(wrapper.find('[data-testid="add-button"]').exists()).toBe(false)
  })

  it('should support nested field arrays', async () => {
    const wrapper = await mountSuspended(DynamicFieldArray, {
      props: {
        modelValue: [{ 
          step: 'Mix ingredients',
          substeps: [{ detail: 'Combine flour and sugar' }]
        }],
        fieldSchema: {
          step: { type: 'text', label: 'Step' },
          substeps: {
            type: 'array',
            label: 'Sub-steps',
            schema: {
              detail: { type: 'text', label: 'Detail' }
            }
          }
        }
      }
    })

    expect(wrapper.find('[data-testid="nested-array"]').exists()).toBe(true)
  })
})