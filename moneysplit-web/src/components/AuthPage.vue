<template>
  <div class="auth-page">
    <Card v-if="phase === 'before-login'">
      <template #content>
        <Button @click="login()">Start</Button>
      </template>
    </Card>

    <Card v-if="phase === 'before-register'">
      <template #content>
        <Flex column class="gap-2">
          <label for="displayName">Display name</label>
          <InputText v-model="displayName" id="displayName" />
        </Flex>

        <div class="mt-2" />

        <Button @click="register()"
                :disabled="!displayName.trim()">Submit</Button>
      </template>
    </Card>

    <Card v-if="phase === 'done'">
      <template #content>
        auth complete
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { Button, Card, InputText } from 'primevue';
import { assert } from 'moneysplit-common';
import Flex from '@/ui/Flex.vue';

const phase = shallowRef<'before-login' | 'login' | 'before-register' | 'register' | 'done'>('before-login');

const displayName = shallowRef('')

onMounted(() => login());

async function login() {
  phase.value = 'login';

  try {
    const result = await navigator.credentials.get({
      publicKey: {
        rpId: 'mfro.me',
        challenge: window.crypto.getRandomValues(new Uint8Array(8)),
      },
    });

    console.log(result);
    phase.value = 'done';
  } catch (e) {
    console.log(e);
    phase.value = 'before-register';
  }
}

async function register() {
  assert(phase.value === 'before-register', 'invalid register');
  phase.value = 'register';

  const encoder = new TextEncoder();

  const result = await navigator.credentials.create({
    publicKey: {
      challenge: window.crypto.getRandomValues(new Uint8Array(8)),
      rp: { id: 'mfro.me', name: 'mfro.me website' },
      user: {
        displayName: displayName.value,
        id: encoder.encode('mfro'),
        name: 'max'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }
      ],
      authenticatorSelection: {
        requireResidentKey: true,
        residentKey: 'required',
      },
    }
  });

  console.log(result);
  phase.value = 'done';
}
</script>
