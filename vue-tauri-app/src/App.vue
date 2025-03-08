<script setup>
import { invoke } from "@tauri-apps/api/core";
import { onMounted, ref } from 'vue';

const message = ref("Loading...")
const fileContent = ref("Loading...")

const readUserFile = async () => {
  const jsonString = await invoke("read_file")
  fileContent.value = JSON.parse(jsonString)
}

const greetUser = async () => {

  message.value = await invoke("greet", { name: "fire boy" });

}

onMounted(() => {
  greetUser()
  readUserFile()
})

</script>


<template>
  <div id="app" class="text-white h-screen justify-center items-center flex flex-col gap-2">
    <span>{{ message }}</span>
    <h1>here will be the file content!:</h1>
    <div>{{ fileContent }}</div>
  </div>
</template>

<style>
#app{
  background-color: black;
}
</style>