<script>
import TypeIcon from './TypeIcon.svelte';
import api from "./utils/api.js";
import { getHeaders } from "./utils/dataCleaner.js";
export let headers
export let activeTable
export let hoverNewField
export let dataTables
export let fetchData
export let displayedData
export let currentUser
export let token

let editFieldName
let fieldEdit
let settingDefault

const editThisFieldName = (field) => {
  editFieldName = field
  let id = field.replace(/ /g, "-")
  setTimeout(() => {
    document.querySelector(`#${id}`).focus()
  }, 10)
}

const changeFieldName = async (field, id) => {
  try {
    let domId = field.replace(/ /g, "-")
    let name = document.querySelector(`#${domId}`).value
    let update = await api.put(
      `database/${activeTable.replace(/ /g, "-")}/${id}`,
      token,
      { name }
    )
    editFieldName = ''
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    dataTables = await api.get('database', token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}

const changeDefault = async (field, id) => {
  try {
    let domId = field.replace(/ /g, "-")
    let defaultValue = document.querySelector(`#default-${domId}`).value
    let update = await api.put(
      `database/${activeTable.replace(/ /g, "-")}/${id}`,
      token,
      { default: defaultValue }
    )
    settingDefault = ''
    fieldEdit = ''
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    dataTables = await api.get('database', token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}

const changeType = async (field, id, type) => {
  try {
    let update = await api.put(
      `database/${activeTable.replace(/ /g, "-")}/${id}`,
      token,
      { type }
    )
    fieldEdit = ''
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    dataTables = await api.get('database', token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}

const newColHeader = async (table) => {
  try {
    const id = 'column' + Math.floor(Math.random() * Math.floor(100));
    let col = await api.put(
      `database/${table}`,
      token,
      { props: {
          name: id,
          type: "String"
        }
      }
    )
    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
    dataTables = await api.get('database', token)
    headers = getHeaders(dataTables, activeTable)
  } catch (err) {
    console.log(err)
  }
}
</script>

<thead class="justify-between sticky top-0 border-b-4 border-gray-300">
  <tr class="">
    <th class="p-2 bg-gray-200 border-l border-r border-gray-400 text-left bg-gray-200">
    </th>
    <th class="p-2 bg-gray-200 border-l border-r border-gray-400 text-left bg-gray-200">
      <span class="text-gray-900 text-base font-medium">id</span>
    </th>
      {#each headers as header}
        <th class="p-2 bg-gray-200 border-l border-r border-gray-400 text-left">
          <div class="flex items-center">
            <TypeIcon type={header.type}/>
            {#if editFieldName == header.name}
              <input id={header.name.replace(/ /g, "-")} class="focus:outline-none apperance-none bg-gray-200 flex-grow" value={header.name} />
              <svg on:click={() => changeFieldName(header.name, header._id)} class="cursor-pointer h-3 w-3 text-gray-900 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <span class="text-gray-900 text-base font-medium flex-grow">{header.name}</span>
              {#if header.owner == currentUser.username}
                <svg on:click={() => fieldEdit == header.name ? fieldEdit = '' : fieldEdit = header.name} class="cursor-pointer h-3 w-3 text-gray-900 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              {/if}
            {/if}
          </div>
          <div class={`flex flex-col absolute z-10 mt-4 p-2 bg-gray-700 rounded-md ${fieldEdit == header.name ? '' : 'hidden'}`}>
            <ul>
              <li on:click={() => editThisFieldName(header.name)} class="rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center text-white text-sm font-medium">
              <svg class="text-white h-4 w-4 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
                Edit Field Name
              </li>
              <li on:click={() => settingDefault = header.name} class={`rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${header.default ? 'text-white' : 'text-gray-400'} text-sm font-medium`}>
              <svg class="h-4 w-4 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                {#if settingDefault}
                  <input id={`default-${header.name.replace(/ /g, "-")}`} class="focus:outline-none apperance-none bg-white rounded-sm flex-grow" value={header.default} />
                  <svg on:click={() => changeDefault(header.name, header._id)} class="cursor-pointer h-3 w-3 text-gray-900 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {:else}
                  <span>{header.default || 'Set Default'}</span>
                {/if}
              </li>
              <li on:click={() => changeType(header.name, header._id, 'String')} class={`rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${header.type == 'String' ? 'text-white' : 'text-gray-400'} text-sm font-medium`}>
                <TypeIcon type="String" color={header.type == 'String' ? 'text-white' : 'text-gray-400'}/>
                String
              </li>
              <li on:click={() => changeType(header.name, header._id, 'Number')} class={`rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${header.type == 'Number' ? 'text-white' : 'text-gray-400'} text-sm font-medium`}>
                <TypeIcon type="Number" color={header.type == 'Number' ? 'text-white' : 'text-gray-400'}/>
                Number
              </li>
              <li on:click={() => changeType(header.name, header._id, 'Boolean')} class={`rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${header.type == 'Boolean' ? 'text-white' : 'text-gray-400'} text-sm font-medium`}>
                <TypeIcon type="Boolean" color={header.type == 'Boolean' ? 'text-white' : 'text-gray-400'}/>
                Boolean
              </li>
              <li on:click={() => changeType(header.name, header._id, 'Date')} class={`rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${header.type == 'Date' ? 'text-white' : 'text-gray-400'} text-sm font-medium`}>
                <TypeIcon type="Date" color={header.type == 'Date' ? 'text-white' : 'text-gray-400'}/>
                Date
              </li>
              <li on:click={() => changeType(header.name, header._id, 'Mixed')} class={`rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${header.type == 'Mixed' ? 'text-white' : 'text-gray-400'} text-sm font-medium`}>
                <TypeIcon type="Mixed" color={header.type == 'Mixed' ? 'text-white' : 'text-gray-400'}/>
                Mixed
              </li>
            </ul>
          </div>
        </th>
      {/each}
      <th on:mouseover={() => hoverNewField = true} on:mouseout={() => hoverNewField = false} on:click={() => newColHeader(activeTable)} class={`${headers[0].owner == currentUser.username ? '' : 'hidden'} p-2 bg-gray-200 border-l border-r border-gray-400 text-center cursor-pointer`}>
        <span class="text-gray-900 text-base font-medium px-4">+</span>
      </th>
  </tr>
</thead>
