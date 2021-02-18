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
    let record = await api.destroy(`${activeTable.replace(/ /g, "-")}/${id}`, token)
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
      <td class={`border border-gray-300 text-left ${hoverNewField ? '' : 'hidden'}`}>
        <span class="text-center ml-2 text-base">
        </span>
      </td>
    </tr>
  </tbody>
</table>
