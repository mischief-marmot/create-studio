<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

// Redirect to leads tab by default
navigateTo('/crm/leads', { replace: true })
</script>
