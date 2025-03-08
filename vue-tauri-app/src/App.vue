<script setup>
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { onMounted, ref, onBeforeUnmount } from 'vue';

const message = ref("Loading...")
const fileContent = ref([])

let unlisten = null;

const readUserFile = async () => {
  try {
    const jsonString = await invoke("read_file");
    fileContent.value = JSON.parse(jsonString);
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

const greetUser = async () => {
  message.value = await invoke("greet", { name: "fire boy" });
};

onMounted(async () => {
  await greetUser();
  await readUserFile();
  
  // Add error handling for the listener
  try {
    unlisten = await listen('log_updated', (event) => {
      try {
        fileContent.value = JSON.parse(event.payload);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
      }
    });
  } catch (listenError) {
    console.error("Error setting up listener:", listenError);
  }
});

onBeforeUnmount(() => {
  if (unlisten) {
    unlisten();
  }
});
</script>


<template>
  <div id="app" class="text-white h-screen justify-center items-center flex flex-col gap-2">
    <span>{{ message }}</span>
    <h1>here will be the file content!:</h1>
    <ul v-if="fileContent.length > 0">
      <li v-for="(log, index) in fileContent" :key="index">
        <strong>Method:</strong> {{ log.method }} -
        <strong>Status:</strong> {{ log.responseStatus }} - 
        <strong>Response:</strong> {{ JSON.parse(log.responseBody).message || JSON.parse(log.responseBody).data?.message }}
      </li>
    </ul>
  </div>
</template>

<style>
#app{
  background-color: black;
}
</style>