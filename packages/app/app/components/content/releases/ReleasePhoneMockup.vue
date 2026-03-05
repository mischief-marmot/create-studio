<template>
  <div class="flex justify-center my-8">
    <div class="mockup-phone border-primary">
      <div class="camera" />
      <div class="display">
        <div class="artboard artboard-demo phone-1 bg-base-100 !w-[320px] !h-[568px] overflow-y-auto">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
