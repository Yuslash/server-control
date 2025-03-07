<template>
  <p v-if="condition">data</p>
  <p v-else>no data</p>
  <button @click="handleCondition">change condition</button>
</template>

<script>

import { ref } from 'vue'

export default {

  setup() {
    const condition = ref(true)

    const handleCondition = () => {

      condition.value = !condition.value

    }

    return { condition, handleCondition }

  }
}
</script>