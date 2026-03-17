<script setup lang="ts">
import { shallowRef } from 'vue';
import { type Driver } from '@/driver';
import LandingPage from '@/components/LandingPage.vue';
import GroupPage from '@/components/GroupPage.vue';

const driver = shallowRef<Driver | null>(null);

function onConnect(d: Driver) {
  driver.value = d;
}

function onClose() {
  const url = new URL(location.href);
  url.searchParams.delete('token');
  history.replaceState(null, '', url);

  driver.value?.close();
  driver.value = null;
}

// const cameraButton = useTemplateRef('cameraButton');
// async function onCapture(e: Event) {
//   const files = cameraButton.value?.files;
//   if (files?.length) {
//     console.log(e);
//     console.log(files);

//     const file = files[0];

//     const worker = await createWorker('eng');
//     console.log(worker);
//     const ret = await worker.recognize(file);
//     console.log(ret);

//     const matches = ret.data.text.matchAll(/\b\d+(\.|\,)\d\d\b/g)

//     for (const match of matches) {
//       console.log(match[0]);
//     }
//   }
// }
</script>

<template>
  <LandingPage v-if="!driver" @connect="onConnect" />
  <GroupPage v-else :driver="driver" @close="onClose" />

  <!-- <input type="file" accept="image/*"
         capture="environment"
         ref="cameraButton"
         style="opacity: 0; width: 0; height: 0;"
         @change="onCapture" />

  <Button @mouseup="cameraButton?.click()">
    <Icon :src="icon_photo_camera" />
  </Button> -->
</template>

<style scoped lang="scss"></style>
