<script>
export let dataTables
export let activeTable
export let headers
export let fetchData
export let displayedData
export let currentUser
export let showAPIDocs

let editable;

const createNewTable = async () => {
  const id = 'Table ' + Math.floor(Math.random() * Math.floor(100));
  let newTable = await fetch(`/api/database`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: id,
        owner: currentUser.username
      })
  })
  let newTableResponse = await newTable.json()
  if (newTableResponse.status == 'duplicate') {
    createNewTable()
  }
  const dataResponse = await fetch(`api/database`)
  let data = await dataResponse.json();
  activeTable = id.toLowerCase()
  editable = id.toLowerCase()
  dataTables = data
}

const activate = async(table) => {
  activeTable = table.replace(/-/g, " ")
  const tableDataResposne = await fetchData(table)
  let data = await tableDataResposne.json()
  displayedData = data
  let tableHeaders = dataTables.filter((dt) => dt.name == table.replace(/-/g, " "))[0]
  if (tableHeaders) {
    headers = tableHeaders.props
    headers = headers.map((h) => {
			h.owner = tableHeaders.owner
			return h
		})
  } else {
    headers = []
  }
  console.log(table)
  console.log(displayedData)
  console.log(tableHeaders)
  console.log(headers)
}

const editTable = (table) => {
  editable = table
}
const changeTableName = async (table) => {
  try {
    let name = document.querySelector(`#${table}`).value
    let change = await fetch(`/api/database/${table}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    })
    const dataResponse = await fetch(`api/database`)
    let data = await dataResponse.json();
    let changeData = await change.json();
    console.log(changeData)
    editable = ''
    dataTables = data
    activeTable = name.toLowerCase()
  } catch (err) {
    console.log(err)
  }
}
const deleteTable = async (table) => {
  try {
    await fetch(`/api/database/${table}`, {
        method: 'DELETE',
    })
    const dataResponse = await fetch(`api/database`)
    let data = await dataResponse.json();
    editable = ''
    dataTables = data
    activeTable = dataTables[0].name
    const tableDataResposne = await fetchData(activeTable)
    data = await tableDataResposne.json()
    displayedData = data
  } catch (err) {
    console.log(err)
  }
}
const uploadFile = () => {
    document.getElementById('json-file').click()
  }

  const importJSON = async (table) => {
    try {
      let photo = document.getElementById("json-file").files[0];
      let formData = new FormData();

      formData.append("filename", photo);
      let data = await fetch(`/api/database/${table}/import`, {method: "POST", body: formData})
      data = await data.json()
      console.log(data)
      const dataResponse = await fetch(`api/database`)
      data = await dataResponse.json();
      dataTables = data
      const tableDataResposne = await fetchData(activeTable)
      data = await tableDataResposne.json()
      displayedData = data
    } catch (err) {
      console.log(err)
    }
  }

</script>

<div class="example flex flex-col bg-green-200 border-b-4 border-green-600 w-screen overflow-x-scroll">
  <div class="flex w-full justify-between">
  <div class="flex items-center ml-8 mt-4">
  <img class="h-16 w-16 object-cover mr-6" src="./mongo.png" />
  <p class="text-lg font-semibold text-green-600">Babel Database</p>
  </div>
  <div class="flex space-x-4 mr-8 mt-4">
    <ul class="flex space-x-4">
      <li on:click={() => showAPIDocs = !showAPIDocs} class="flex items-center cursor-pointer transform duration-150 hover:-translate-y-1">
        <svg class="h-4 w-4 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <span class="text-sm font-semibold text-green-600 truncate">API Docs</span>
      </li>
      <li on:click={createNewTable} class="flex items-center cursor-pointer transform duration-150 hover:-translate-y-1">
        <svg class="h-4 w-4 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"  stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="text-sm font-semibold text-green-600 truncate">Add Table</span>
      </li>
      <li on:click={uploadFile} class="flex items-center cursor-pointer transform duration-150 hover:-translate-y-1">
        <svg class="h-4 w-4 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span class="text-sm font-semibold text-green-600 truncate">Upload JSON</span>
      </li>
      <li class="hidden">
      <input on:change={() => importJSON(activeTable.replace(/ /g, "-"))} id="json-file" type="file" class="invisible"/>
      </li>
    </ul>
    <div class="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-green-200 text-lg p-2 mr-8 mt-4">{currentUser ? currentUser.username[0].toUpperCase() : ''}</div>
  </div>
  </div>
  <div class="px-20 pt-12">
    <ul class="flex items-center px-4">
      {#each dataTables as data}
        <li on:click={() => activate(data.name.replace(/ /g, "-"))} class={`w-auto border-r border-l border-t border-green-600 flex w-48 items-center justify-between py-1 px-2 rounded-tl-lg rounded-tr-lg text-sm font-medium bg-green-600 text-green-100 transform ${data.name == activeTable ? 'scale-125 z-20' : '-ml-1'} origin-bottom shadow-lg cursor-pointer`}>
          <div class="h-3 w-3 rounded-full bg-green-200 flex items-center justify-center text-green-600 text-xs p-2 mr-2">{data.owner[0].toUpperCase()}</div>
          {#if editable == data.name}
            <input class="apperance-none focus:outline-none w-auto bg-green-600 border-none" value={data.name[0].toUpperCase() + data.name.substring(1)} id={data.name.replace(/ /g, "-")} />
            <svg on:click={() => changeTableName(data.name.replace(/ /g, "-"))} class="h-3 w-3 text-green-200 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <span class="truncate">{data.name[0].toUpperCase() + data.name.substring(1)}</span>
            {#if data.name == activeTable && data.owner == currentUser.username}
            <div class="flex items-center">
              <svg on:click={() => editTable(data.name)} class="h-3 w-3 text-green-200 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <svg on:click={() => deleteTable(data.name.replace(/ /g, "-"))} class="h-3 w-3 text-green-200 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            {/if}
          {/if}
        </li>
      {/each}
    </ul>
  </div>
  </div>
  <style>
  /* Hide scrollbar for Chrome, Safari and Opera */
.example::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.example {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
  </style>
