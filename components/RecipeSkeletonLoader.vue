<template>
  <div class="w-full max-w-md h-full bg-base-100 flex flex-col">
    
    <!-- Image section skeleton -->
    <div class="skeleton flex-shrink-0 -mb-6" style="height: 25%">
    </div>

    <!-- Content section skeleton with rounded top corners overlapping image -->
    <div class="flex-1 overflow-hidden flex flex-col relative z-10 bg-base-100 rounded-t-3xl">
      <!-- Draggable Handle skeleton -->
      <div class="absolute top-0 left-0 right-0 h-8 flex items-start justify-center pt-2 z-20">
        <div class="w-12 h-1 bg-base-content/20 rounded-full"></div>
      </div>
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
              <div class="skeleton w-32 h-10 rounded-lg"></div>
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
 