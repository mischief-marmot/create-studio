<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">
          ← Back to Dashboard
        </NuxtLink>
        <h1 class="text-3xl font-bold">Create New Card</h1>
      </div>

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h2 class="card-title mb-4">Card Details</h2>

            <!-- Card Type -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Card Type *</span>
              </label>
              <select
                v-model="formData.type"
                class="select select-bordered"
                required
              >
                <option value="">Select a type</option>
                <option value="recipe">Recipe</option>
                <option value="howto">How-To Guide</option>
                <option value="faq">FAQ</option>
                <option value="article">Article</option>
              </select>
            </div>

            <!-- Title -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Title *</span>
              </label>
              <input
                v-model="formData.title"
                type="text"
                placeholder="Enter card title"
                class="input input-bordered"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea
                v-model="formData.description"
                class="textarea textarea-bordered h-24"
                placeholder="Enter card description"
              ></textarea>
            </div>

            <!-- Recipe-specific fields -->
            <template v-if="formData.type === 'recipe'">
              <div class="grid grid-cols-3 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Prep Time (min)</span>
                  </label>
                  <input
                    v-model.number="formData.prepTime"
                    type="number"
                    class="input input-bordered"
                    min="0"
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Cook Time (min)</span>
                  </label>
                  <input
                    v-model.number="formData.cookTime"
                    type="number"
                    class="input input-bordered"
                    min="0"
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Servings</span>
                  </label>
                  <input
                    v-model.number="formData.servings"
                    type="number"
                    class="input input-bordered"
                    min="1"
                  />
                </div>
              </div>
            </template>

            <!-- Image Upload -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Image</span>
              </label>
              <ClientOnly>
                <FormImageUpload
                  v-model="formData.image"
                  accept="image/*"
                  :max-size="5000000"
                  class="w-full"
                />
              </ClientOnly>
            </div>

            <!-- Ingredients -->
            <template v-if="formData.type === 'recipe'">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Ingredients</span>
                </label>
                <ClientOnly>
                  <FormDynamicFieldArray
                    v-model="formData.ingredients"
                    :field-schema="ingredientSchema"
                    add-button-text="Add Ingredient"
                    :min-items="1"
                    field-grid-class="grid-cols-1 md:grid-cols-3 gap-2"
                    :show-index="false"
                  />
                </ClientOnly>
              </div>
            </template>

            <!-- Instructions -->
            <template
              v-if="formData.type === 'recipe' || formData.type === 'howto'"
            >
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Instructions</span>
                </label>
                <ClientOnly>
                  <FormDynamicFieldArray
                    v-model="formData.instructions"
                    :field-schema="instructionSchema"
                    add-button-text="Add Step"
                    :min-items="1"
                    field-grid-class="grid-cols-1"
                    index-label="Step"
                  />
                </ClientOnly>
              </div>
            </template>

            <!-- HowTo-specific fields -->
            <template v-if="formData.type === 'howto'">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Estimated Duration (minutes)</span>
                </label>
                <input
                  v-model.number="formData.totalTime"
                  type="number"
                  class="input input-bordered"
                  placeholder="e.g., 30"
                  min="0"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Supplies Needed</span>
                </label>
                <ClientOnly>
                  <FormDynamicFieldArray
                    v-model="formData.supplies"
                    :field-schema="supplySchema"
                    add-button-text="Add Supply"
                    field-grid-class="grid-cols-1 md:grid-cols-2 gap-2"
                    :show-index="false"
                  />
                </ClientOnly>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Tools Required</span>
                </label>
                <ClientOnly>
                  <FormDynamicFieldArray
                    v-model="formData.tools"
                    :field-schema="toolSchema"
                    add-button-text="Add Tool"
                    field-grid-class="grid-cols-1 md:grid-cols-2 gap-2"
                    :show-index="false"
                  />
                </ClientOnly>
              </div>
            </template>

            <!-- FAQ fields -->
            <template v-if="formData.type === 'faq'">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Questions & Answers</span>
                </label>
                <ClientOnly>
                  <FormDynamicFieldArray
                    v-model="formData.questions"
                    :field-schema="faqSchema"
                    add-button-text="Add Question"
                    :min-items="1"
                    field-grid-class="grid-cols-1"
                    index-label="Q"
                  />
                </ClientOnly>
              </div>
            </template>

            <!-- ItemList fields -->
            <template v-if="formData.type === 'itemlist'">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">List Items</span>
                </label>
                <ClientOnly>
                  <FormDynamicFieldArray
                    v-model="formData.items"
                    :field-schema="itemListSchema"
                    add-button-text="Add Item"
                    :min-items="1"
                    field-grid-class="grid-cols-1"
                    :sortable="true"
                  />
                </ClientOnly>
              </div>
            </template>

            <!-- Action Buttons -->
            <div class="card-actions justify-end mt-6">
              <button
                type="button"
                class="btn btn-ghost"
                @click="$router.push('/dashboard')"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!canSave || isLoading"
                @click="saveCard"
              >
                <span
                  v-if="isLoading"
                  class="loading loading-spinner loading-sm"
                ></span>
                {{ isLoading ? "Creating..." : "Create Card" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h2 class="card-title mb-4">Preview</h2>
            <ClientOnly>
              <div v-if="jsonLdSchema">
                <!-- Try to use the preview component, with fallback -->
                <Suspense>
                  <template #default>
                    <PreviewStructuredDataPreview
                      :schema="jsonLdSchema"
                      theme="default"
                      class="w-full"
                    />
                  </template>
                  <template #fallback>
                    <div class="bg-base-200 p-4 rounded">
                      <h3 class="font-semibold mb-2">{{ jsonLdSchema.name || formData.title }}</h3>
                      <p class="text-sm opacity-70 mb-4">{{ jsonLdSchema.description || formData.description }}</p>
                      <div class="text-xs">
                        <strong>Type:</strong> {{ jsonLdSchema['@type'] }}<br>
                        <strong>Context:</strong> {{ jsonLdSchema['@context'] }}
                      </div>
                    </div>
                  </template>
                </Suspense>
                
                <!-- JSON-LD viewer -->
                <details class="mt-4">
                  <summary class="cursor-pointer text-sm opacity-70">View JSON-LD</summary>
                  <pre class="bg-base-200 p-4 rounded mt-2 text-xs overflow-auto">{{ JSON.stringify(jsonLdSchema, null, 2) }}</pre>
                </details>
              </div>
              <div v-else class="text-center text-base-content/60 py-8">
                <p>{{ formData.title && formData.type ? 'Generating preview...' : 'Fill in the form to see a preview' }}</p>
                <div v-if="formData.title && formData.type" class="text-xs mt-2 opacity-50">
                  Type: {{ formData.type }}, Title: {{ formData.title }}
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardFormData } from "~/types/schemas";
import { generateJsonLd } from "~/utils/json-ld-generator";

definePageMeta({
  middleware: "auth",
});

const router = useRouter();
const { createCard } = useCards();
const { addToast } = useToasts();

const isLoading = ref(false);

const formData = ref<CardFormData>({
  type: "",
  title: "",
  description: "",
  image: null,
  ingredients: [{ name: "", amount: "", unit: "" }],
  instructions: [{ name: "", text: "" }],
  prepTime: undefined,
  cookTime: undefined,
  totalTime: undefined,
  servings: undefined,
  supplies: [],
  tools: [],
  questions: [{ question: "", answer: "" }],
  items: [{ name: "", description: "" }],
});

// Watch for changes in prep and cook time to calculate total time
watch(
  [() => formData.value.prepTime, () => formData.value.cookTime],
  ([prep, cook]: [number | undefined, number | undefined]) => {
    const prepNum = Number(prep) || 0;
    const cookNum = Number(cook) || 0;
    formData.value.totalTime = prepNum + cookNum || undefined;
  }
);

const ingredientSchema = {
  name: {
    label: "Ingredient",
    type: "text" as const,
    placeholder: "e.g., All-purpose flour",
    required: true,
  },
  amount: {
    label: "Amount",
    type: "text" as const,
    placeholder: "2",
  },
  unit: {
    label: "Unit",
    type: "text" as const,
    placeholder: "cups",
  },
};

const instructionSchema = {
  name: {
    label: "Step Name",
    type: "text" as const,
    placeholder: "e.g., Mix dry ingredients",
  },
  text: {
    label: "Instructions",
    type: "textarea" as const,
    placeholder: "Describe the step in detail...",
    required: true,
    rows: 3,
  },
};

const supplySchema = {
  name: {
    label: "Supply Name",
    type: "text" as const,
    placeholder: "e.g., Wood glue",
    required: true,
  },
  quantity: {
    label: "Quantity",
    type: "number" as const,
    placeholder: "1",
    min: 1,
  },
};

const toolSchema = {
  name: {
    label: "Tool Name",
    type: "text" as const,
    placeholder: "e.g., Screwdriver",
    required: true,
  },
  requiredQuantity: {
    label: "Quantity",
    type: "number" as const,
    placeholder: "1",
    min: 1,
  },
};

const faqSchema = {
  question: {
    label: "Question",
    type: "text" as const,
    placeholder: "e.g., What is the best flour to use?",
    required: true,
  },
  answer: {
    label: "Answer",
    type: "textarea" as const,
    placeholder: "Provide a detailed answer...",
    required: true,
    rows: 3,
  },
};

const itemListSchema = {
  name: {
    label: "Item Name",
    type: "text" as const,
    placeholder: "e.g., Prepare ingredients",
    required: true,
  },
  description: {
    label: "Description",
    type: "textarea" as const,
    placeholder: "Describe this item in detail...",
    rows: 2,
  },
};

const canSave = computed(() => {
  return formData.value.title.trim() && formData.value.type;
});

// Generate JSON-LD schema for preview
const jsonLdSchema = computed(() => {
  if (!formData.value.title || !formData.value.type) return null;

  try {
    return generateJsonLd(formData.value);
  } catch (error) {
    console.error("Error generating JSON-LD:", error);
    return null;
  }
});

const saveCard = async () => {
  if (!canSave.value) return;

  isLoading.value = true;

  try {
    const result = await createCard(formData.value);
    addToast({
      title: "Success",
      description: "Card created successfully",
      type: "success",
    });
    router.push(`/cards/${result.card.id}`);
  } catch (error) {
    console.error("Failed to create card:", error);
    addToast({
      title: "Error",
      description: "Failed to create card. Please try again.",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
