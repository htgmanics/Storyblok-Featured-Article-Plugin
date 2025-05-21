<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFieldPlugin } from '@storyblok/field-plugin/vue3'
import Select from 'primevue/select'

// Types
interface Category {
  uuid: string
  name: string
}

interface Article {
  id: string
  name: string
}

interface Content {
  categoryUuid?: string
  featuredArticle?: string
}

interface Story {
  uuid: string
  name: string
}

// API Service
const storyblokService = {
  async fetchStories({
    token,
    contentType,
    filterType,
    categoryUuid,
  }: {
    token: string
    contentType: string
    filterType: string
    categoryUuid?: string
  }): Promise<Story[]> {
    const baseUrl = 'https://api.storyblok.com/v2/cdn/stories'
    const params = new URLSearchParams({
      token,
      content_type: contentType,
      ...(categoryUuid && {
        [`filter_query[${filterType}][in]`]: categoryUuid,
      }),
    })

    const [publishedResponse, draftResponse] = await Promise.all([
      fetch(`${baseUrl}?${params.toString()}&version=published`),
      fetch(`${baseUrl}?${params.toString()}&version=draft`),
    ])

    const [publishedData, draftData] = await Promise.all([
      publishedResponse.json(),
      draftResponse.json(),
    ])

    const allStories = [
      ...(publishedData.stories || []),
      ...(draftData.stories || []),
    ]
    return Array.from(
      new Map(allStories.map((story) => [story.uuid, story])).values(),
    )
  },
}

// Component State
const plugin = useFieldPlugin()
const categories = ref<Category[]>([])
const articles = ref<Article[]>([])
const isLoading = ref(false)
const selectedCategory = ref<Category>()
const selectedArticle = ref<Article>()
const filteredCategories = ref<Category[]>([])
const filteredArticles = ref<Article[]>([])
const isInitializing = ref(true)

// Computed
const content = computed<Content>(() => {
  const c = plugin.data?.content
  return typeof c === 'object' && c !== null ? (c as Content) : {}
})

const isBlogContent = computed(() => {
  const component = plugin.data?.story.content.component
  return component === 'blogCategory' || component === 'blogCollection'
})

// Add this computed property to determine the filter type
const filterType = computed(() => {
  const component = plugin.data?.story.content.component
  return component === 'blogCollection' ? 'collections' : 'category'
})

// Add this after the content computed property
const logPluginContent = () => {
  console.group('Plugin Content')
  console.log('Raw plugin data:', plugin.data)
  console.log('Plugin content:', plugin.data?.content)
  const pluginContent = plugin.data?.content as Content | undefined
  console.log('Category UUID:', pluginContent?.categoryUuid)
  console.log('Featured Article:', pluginContent?.featuredArticle)
  console.groupEnd()
}

// Methods
const setValue = (newContent: Partial<Content>) => {
  plugin.actions?.setContent({
    ...(content.value || {}),
    ...newContent,
  })
}

const fetchCategories = async () => {
  try {
    if (import.meta.env.DEV) {
      categories.value = [
        { uuid: 'cat1', name: 'Category 1' },
        { uuid: 'cat2', name: 'Category 2' },
      ]
      return
    }

    const token = plugin.data?.token
    if (!token) {
      console.error('No token available in plugin data')
      return
    }

    // Handle content type mapping
    const componentType = plugin.data?.story.content.component as string
    const contentType =
      componentType === 'blogIndexPage' ? 'blogCategory' : componentType

    // If we're in a blog content, use the current story's UUID
    const currentContentUuid = isBlogContent.value
      ? plugin.data?.story.uuid
      : (plugin.data?.content as Content | undefined)?.categoryUuid

    // If we're not in a blog content, fetch all categories
    const stories = await storyblokService.fetchStories({
      token,
      contentType,
      filterType: filterType.value,
    })
    categories.value = stories.map((story) => ({
      uuid: story.uuid,
      name: story.name,
    }))

    if (currentContentUuid) {
      // Set the current content as selected
      setValue({
        categoryUuid: currentContentUuid as string,
        featuredArticle:
          (plugin.data?.content as Content | undefined)?.featuredArticle ||
          undefined,
      })
    }
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const fetchArticles = async ({
  filterType,
  categoryUuid,
}: {
  filterType: string
  categoryUuid: string
}) => {
  try {
    if (import.meta.env.DEV) {
      articles.value = [
        { id: 'art1', name: 'Article 1' },
        { id: 'art2', name: 'Article 2' },
      ]
      return
    }

    const token = plugin.data?.token
    if (!token) {
      console.error('No token available in plugin data')
      return
    }

    const stories = await storyblokService.fetchStories({
      token,
      contentType: 'articlePage',
      filterType,
      categoryUuid,
    })
    articles.value = stories.map((story) => ({
      id: story.uuid,
      name: story.name,
    }))
  } catch (error) {
    console.error('Error loading articles:', error)
  } finally {
    isLoading.value = false
  }
}

// Search handlers
const searchCategories = (event: { query: string }) => {
  const query = event.query.toLowerCase()
  const filtered = categories.value.filter((category) =>
    category.name.toLowerCase().includes(query),
  )
  filteredCategories.value = [
    { uuid: '', name: 'Select a category' },
    ...filtered,
  ]
}

const searchArticles = (event: { query: string }) => {
  const query = event.query.toLowerCase()
  const filtered = articles.value.filter((article) =>
    article.name.toLowerCase().includes(query),
  )
  filteredArticles.value = [{ id: '', name: 'Select an article' }, ...filtered]
}

// Modify the initializeSelections function
const initializeSelections = () => {
  // Initialize category selection
  if (content.value.categoryUuid) {
    const category = categories.value.find(
      (cat) => cat.uuid === content.value.categoryUuid,
    )
    if (category) {
      selectedCategory.value = category
      // Initialize filtered categories with current selection
      filteredCategories.value = [
        { uuid: '', name: 'Select a category' },
        ...categories.value,
      ]
    }
  }

  // Initialize article selection
  if (content.value.featuredArticle) {
    const article = articles.value.find(
      (art) => art.id === content.value.featuredArticle,
    )
    if (article) {
      selectedArticle.value = article
      // Initialize filtered articles with current selection
      filteredArticles.value = [
        { id: '', name: 'Select an article' },
        ...articles.value,
      ]
    }
  }
}

// Modify the watch for plugin.type to set isInitializing to false after initialization
watch(
  () => plugin.type,
  async (type) => {
    if (type === 'loaded') {
      // Log initial plugin content
      // logPluginContent()

      // First, fetch categories
      await fetchCategories()

      // If we're in a blog content, fetch articles immediately using the current story's UUID
      if (isBlogContent.value) {
        const currentContentUuid = plugin.data?.story.uuid
        if (currentContentUuid) {
          await fetchArticles({
            filterType: filterType.value,
            categoryUuid: currentContentUuid as string,
          })
        }
      } else if (content.value.categoryUuid) {
        // If we have a saved category, fetch its articles
        await fetchArticles({
          filterType: filterType.value,
          categoryUuid: content.value.categoryUuid,
        })
      }

      // Initialize selections after data is loaded
      initializeSelections()
      // Set isInitializing to false after initialization is complete
      isInitializing.value = false
    }
  },
  { immediate: true },
)

// Modify the watch for plugin data changes to include logging
watch(
  () => plugin.data?.content,
  (newContent) => {
    if (newContent && plugin.type === 'loaded') {
      // Re-initialize selections when content changes
      initializeSelections()
    }
  },
  { deep: true },
)

// Keep the watch for categoryUuid as is
watch(
  () => content.value.categoryUuid,
  async (newCategoryUuid) => {
    if (!newCategoryUuid) {
      articles.value = []
      return
    }
    isLoading.value = true

    await fetchArticles({
      filterType: filterType.value,
      categoryUuid: newCategoryUuid,
    })
    // Initialize selections after new articles are loaded
    initializeSelections()
  },
)

// Modify the watch for selectedCategory
watch(selectedCategory, (newValue) => {
  if (isInitializing.value) return

  // Clear the selected article when category changes

  if (newValue) {
    // selectedArticle.value = undefined
    setValue({
      categoryUuid: newValue.uuid,
      featuredArticle: undefined,
    })
  } else {
    // Also clear values when category is deselected
    setValue({
      categoryUuid: undefined,
      featuredArticle: undefined,
    })
  }
})

// Modify the watch for selectedArticle
watch(selectedArticle, (newValue) => {
  if (isInitializing.value) return
  if (newValue) {
    setValue({
      featuredArticle: newValue.id,
    })
  }
})

// Add these methods before the template
const handleCategoryDeselect = () => {
  selectedCategory.value = undefined
  setValue({
    categoryUuid: undefined,
    featuredArticle: undefined,
  })
}

const handleArticleDeselect = () => {
  selectedArticle.value = undefined
  setValue({
    featuredArticle: undefined,
  })
}

// Add this with other methods
const handleCategorySelect = (category: Category) => {
  selectedArticle.value = undefined
  setValue({
    categoryUuid: category.uuid,
    featuredArticle: undefined,
  })
}
</script>

<template>
  <div
    v-if="plugin.type === 'loaded'"
    class="featured-article-plugin"
    role="form"
  >
    <!-- Category Selection - only show if not in blog content -->
    <fieldset
      v-if="!isBlogContent"
      class="field-group"
    >
      <legend class="field-label required">Featured Category</legend>
      <Select
        v-model="selectedCategory"
        :options="categories"
        filter
        optionLabel="name"
        placeholder="Select a Category"
        showClear
        size="small"
        @change="(e) => {
          if (!e.value) {
            handleCategoryDeselect();
          }
        }"
      />
    </fieldset>
    <!-- Featured Article Selection -->
    <fieldset class="field-group">
      <legend class="field-label">Featured Article</legend>
      <Select
        v-model="selectedArticle"
        :options="articles"
        filter
        optionLabel="name"
        placeholder="Select an article"
        showClear
        size="small"
        @change="(e) => {
          if (!e.value) {
            handleArticleDeselect();
          }
        }"
      />
    </fieldset>
  </div>
</template>

<style>
.field-group {
  margin-bottom: 1.5rem;
}

.field-label {
  margin-bottom: 0.5rem;
  color: var(--sb-color-text-primary);
  font-size: var(--sb-font-size-base, 0.75rem);
  font-weight: var(--sb-font-weight-medium, 500);
}

fieldset {  
  border-radius: var(--sb-border-radius-base, 4px); 
}

.field-label.required {
  &::after {
    content: '*';
    color: var(--sb-color-text-red, #ff6159);
    margin-left: 0.25rem;
  }
}

.p-select {
  width: 100%;
}
.p-select-label{
  white-space: normal!important;
}
</style>
