<template>
  <div class="w-full max-w-md h-full bg-base-100 shadow-xl flex flex-col">
    
    <!-- Image section skeleton -->
    <div class="skeleton flex-shrink-0 rounded-b-3xl" style="height: 25%">
    </div>

    <!-- Content section skeleton -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 space-y-6">
          <!-- Step header skeleton -->
          <div class="space-y-3">
            <div class="skeleton h-8 w-24"></div>
            <div class="skeleton h-6 w-3/4"></div>
            <div class="space-y-2">
              <div class="skeleton h-4 w-full"></div>
              <div class="skeleton h-4 w-5/6"></div>
              <div class="skeleton h-4 w-2/3"></div>
            </div>
          </div>

          
        </div>
      </div>

      <!-- Bottom navigation skeleton -->
      <div class="flex-shrink-0 bg-base-200 border-t border-base-300">

        <!-- Navigation controls skeleton -->
        <div class="p-4">
          <div class="flex items-center justify-between">
            <!-- Back button -->
            <div class="skeleton w-16 h-10 rounded-lg"></div>

            <!-- Progress indicator -->
            <div class="flex-1 flex justify-center items-center space-x-1">
              <div v-for="i in 7" :key="i" class="skeleton w-2 h-2 rounded-full"></div>
            </div>

            <!-- Next button -->
            <div class="skeleton w-16 h-10 rounded-lg"></div>
          </div>
        </div>
      </div>
      <div class="py-4">
        <div class="h-10"></div>
      </div>
    </div>
  </div>
</template>
 