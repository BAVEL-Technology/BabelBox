<script>
import camelcase from "camelcase"
export let showAPIDocs
export let activeTable
export let headers
</script>

<div class={`fixed z-50 h-screen w-1/2 transform duration-300 flex flex-col ${showAPIDocs ? 'translate-x-0' : '-translate-x-full'} bg-gray-800`}>
  <p class="text-xl font-semibold text-green-200 p-4">API Docs for {activeTable ? activeTable[0].toUpperCase() + activeTable.substring(1) : ''}</p>
  <p class="text-lg font-semibold text-green-200 px-4 pb-4">🍞 BREAD Based API Routes</p>
  <ul class="flex flex-col space-y-3 px-4 font-mono text-green-200 text-xs">
    <li class="break-words">API_URL: https://babelboxdb.herokuapp.com/api</li>
    <li class="break-words">Browse: GET &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}</li>
    <li class="break-words">Read: GET &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
    <li class="break-words">Edit: PUT &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
    <li class="break-words">
      Body: &lcub; <br>
      {#each headers as header, i}
        &nbsp; &nbsp; {camelcase(header.name)}: {header.type} {#if i != (headers.length - 1)},<br>{/if}
      {/each}
      <br>
      &emsp; &rcub;
    </li>
    <li class="break-words">Add: POST &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
    <li class="break-words">
      Body: &lcub; <br>
      {#each headers as header, i}
        &nbsp; &nbsp; {camelcase(header.name)}: {header.type} {#if i != (headers.length - 1)},<br>{/if}
      {/each}
      <br>
      &emsp; &rcub;
    </li>
    <li class="break-words">Delete: DELETE &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
  </ul>
  <p class="text-xl font-semibold text-green-200 p-4">API Docs for Database</p>
  <p class="text-lg font-semibold text-green-200 px-4 pb-4">🚀</p>
</div>
