<script>
import TableHeader from "./TableHeader.svelte"
import api from "./utils/api.js";
import { getHeaders } from "./utils/dataCleaner.js"
import camelcase from "camelcase"
export let token
export let currentUser
export let headers
export let activeTable
export let displayedData
export let newColHeader
export let dataTables
export let settingDefault
export let fieldEdit
import { io } from 'socket.io-client';
export let treeView

const reload = async () => {
  try {
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}

const socket = io();
socket.io.connect(window.location.hostname);
socket.on('breadUpdate', reload);

let hoverNewField = false

const updateField = async (field, id) => {
  try {
    let update = await api.put(
      `${activeTable.replace(/ /g, "-")}`,
      token,
      {
        updates: { [camelcase(field)]: event.target.value },
        filters: { _id: id }
      }
    )
  } catch (err) {
    console.log(err)
  }
}

const deleteRecord = async (id) => {
  try {
    let record = await api.destroy(`${activeTable.replace(/ /g, "-")}?id=${id}`, token)
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}

const newRecord = async () => {
  try {
    let record = await api.post(`${activeTable.replace(/ /g, "-")}`, token, { })
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}
</script>

<table class="min-w-full">
  <TableHeader bind:fieldEdit={fieldEdit} bind:settingDefault={settingDefault} token={token} currentUser={currentUser} bind:hoverNewField={hoverNewField} bind:headers={headers} bind:activeTable={activeTable} bind:dataTables={dataTables} bind:displayedData={displayedData}/>
  <tbody class="bg-gray-200">
    {#each displayedData as data}
      <tr class="bg-white">
        <td class="bg-white border border-gray-300 text-left">
          <span on:click={() => treeView = data} class="flex items-center justify-center">
            <svg class="cursor-pointer text-gray-700 hover:text-gray-900 h-4 w-4" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
              <path d="M384 144c0-44.2-35.8-80-80-80s-80 35.8-80 80c0 36.4 24.3 67.1 57.5 76.8c-.6 16.1-4.2 28.5-11 36.9c-15.4 19.2-49.3 22.4-85.2 25.7c-28.2 2.6-57.4 5.4-81.3 16.9v-144c32.5-10.2 56-40.5 56-76.3c0-44.2-35.8-80-80-80S0 35.8 0 80c0 35.8 23.5 66.1 56 76.3v199.3C23.5 365.9 0 396.2 0 432c0 44.2 35.8 80 80 80s80-35.8 80-80c0-34-21.2-63.1-51.2-74.6c3.1-5.2 7.8-9.8 14.9-13.4c16.2-8.2 40.4-10.4 66.1-12.8c42.2-3.9 90-8.4 118.2-43.4c14-17.4 21.1-39.8 21.6-67.9c31.6-10.8 54.4-40.7 54.4-75.9zM80 64c8.8 0 16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16s7.2-16 16-16zm0 384c-8.8 0-16-7.2-16-16s7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16zm224-320c8.8 0 16 7.2 16 16s-7.2 16-16 16s-16-7.2-16-16s7.2-16 16-16z"/>
            </svg>
          </span>
        </td>
        <td class="bg-white border border-gray-300 text-left">
          <span on:click={() => deleteRecord(data._id)} class="flex items-center justify-center">
            <svg class="h-4 w-4 text-gray-700 hover:text-gray-900 cursor-pointer" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </span>
        </td>
        <td class="bg-white border border-gray-300 text-left">
          <span class="text-center ml-2 text-base">
            {data._id}
          </span>
        </td>
        {#each headers as header}
          <td class="border border-gray-300 text-left">
            <span class="text-center ml-2 text-base">
              {#if header.bcrypt}
                ************
              {:else}
                <input on:keyup={() => updateField(header.name, data._id)} class="apperance-none focus:outline-none w-11/12" value={data[camelcase(header.name[0].toLowerCase() + header.name.substring(1))] || ''} />
              {/if}
            </span>
          </td>
        {/each}
        <td class={`border border-gray-300 text-left ${hoverNewField ? '' : 'hidden'}`}>
          <span class="text-center ml-2 text-base">
          </span>
        </td>
      </tr>
    {/each}
    <tr on:click={newRecord} class="bg-white hover:bg-gray-100 cursor-pointer">
      <td class="border border-gray-300 text-left">
        <span class="text-center ml-2 text-base">
          +
        </span>
      </td>
      {#each headers as header}
        <td class="border border-gray-300 text-left">
          <span class="text-center ml-2 text-base">

          </span>
        </td>
      {/each}
      <td class="border border-gray-300 text-left">
        <span class="text-center ml-2 text-base">

        </span>
      </td>
      <td class="border border-gray-300 text-left">
        <span class="text-center ml-2 text-base">

        </span>
      </td>
      <td class={`border border-gray-300 text-left ${hoverNewField ? '' : 'hidden'}`}>
        <span class="text-center ml-2 text-base">
        </span>
      </td>
    </tr>
  </tbody>
</table>
