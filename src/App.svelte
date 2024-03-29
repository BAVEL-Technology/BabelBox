<script>
import { onMount } from "svelte";
import api from "./utils/api.js";
import { getHeaders } from "./utils/dataCleaner.js"
import Header from "./Header.svelte";
import TableHeader from "./TableHeader.svelte";
import camelcase from "camelcase";
import LoggedIn from "./LoggedIn.svelte"
import ApiDocs from "./ApiDocs.svelte"
import Table from "./Table.svelte"
import JSONTree from 'svelte-json-tree'
	let dataTables = []
	let displayedData = []
	let headers = []
	let activeTable
	let loggedin = false
	let currentUser
	let showAPIDocs = false
	let token
	let settingDefault = ''
	let fieldEdit
	let viewGrid = true
	let treeView = ''

	const checkUser = async () => {
		token = window.sessionStorage.getItem('api_key')
		return api.get('/r/admins', token)
	}

	const loadData = async () => {
		try {
			dataTables = await api.get('database', token)
			activeTable = dataTables[1].name
			headers = getHeaders(dataTables, dataTables[1].name)
			displayedData = await api.get(dataTables[1].name.replace(/ /g, "-"), token)
		} catch (err) {
			console.log(err)
		}
	}

	onMount(async () => {
		if (!window.sessionStorage.getItem('api_key')) {
			let findToken = await api.findToken()
			findToken = await findToken.json()
			console.log(findToken)
			if (findToken.message) return false
			window.sessionStorage.setItem('api_key', findToken.token)
		}
		try {
			let user = await checkUser()
			if (user && user.username) {
				currentUser = user
				loggedin = true
				loadData()
			}
		} catch (err) {
			console.log(err)
		}
	})

	const newColHeader = async () => {
	  try {
	    const id = 'column' + Math.floor(Math.random() * Math.floor(100));
	    let col = await api.put(
	      `database/${activeTable.replace(/ /g, "-")}`,
	      token,
	      { props: {
	          name: id,
	          type: "String"
	        }
	      }
	    )
	    displayedData = await api.get(activeTable.replace(/ /g, "-"), token)
	    headers = getHeaders(dataTables, activeTable)
	  } catch (err) {
	    console.log(err)
	  }
	}

	const changeDefault = async (field, id) => {
	  try {
	    let domId = field.replace(/ /g, "-")
	    let defaultValue = document.querySelector(`#default-${domId}`).value
			console.log(defaultValue)
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

</script>

<body class="h-screen">
		{#if settingDefault}
			<div class="bg-transparent h-screen w-screen z-50 fixed flex items-center justify-center">
				<div class="rounded-lg bg-white p-12 flex flex-col items-center justify-center space-y-4">
				<p class="text-md font-semibold text-gray-900">Set default value. Use "()" notation for functions.</p>
					<textarea id={`default-${settingDefault.name}`} class="focus:outline-none border-2 border-green-200 text-gray-900 apperance-none bg-white rounded-lg w-full p-2">{settingDefault.def}</textarea>
					<div class="w-full flex justify-end">
					<div on:click={() => settingDefault = ''} class="bg-red-600 text-white cursor-pointer p-2 rounded-lg flex items-center justify-center mr-6">Cancel</div>
						<div on:click={() => changeDefault(settingDefault.name, settingDefault._id)} class="bg-green-600 text-white cursor-pointer p-2 rounded-lg flex items-center justify-center">Save</div>
					</div>
				</div>
			</div>
			<!-- <input id={`default-${header.name.replace(/ /g, "-")}`} class="focus:outline-none apperance-none bg-white rounded-sm flex-grow" value={header.default} />
			<svg on:click={() => changeDefault(header.name, header._id)} class="cursor-pointer h-3 w-3 text-gray-900 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg> -->
		{/if}
		<ApiDocs headers={headers} activeTable={activeTable} showAPIDocs={showAPIDocs}/>
		{#if !loggedin}
			<LoggedIn bind:currentUser={currentUser} loadData={loadData} checkUser={checkUser} bind:loggedin={loggedin}/>
		{/if}
		<Header token={token} bind:showAPIDocs={showAPIDocs} currentUser={currentUser} dataTables={dataTables} bind:activeTable={activeTable} bind:headers={headers} bind:displayedData={displayedData}/>
		<div class="pb-6 w-screen h-full flex justify-center overflow-x-scroll">
		{#if headers.length > 0}
			{#if viewGrid}
				<Table bind:treeView={treeView} bind:fieldEdit={fieldEdit} bind:settingDefault={settingDefault} bind:dataTables={dataTables} newColHeader={newColHeader} bind:displayedData={displayedData} token={token} bind:headers={headers} activeTable={activeTable} currentUser={currentUser}/>
			{:else}
			<div class="w-full self-start py-4 px-12" style='--json-tree-font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";'>
				<JSONTree value={displayedData} />
			</div>
			{/if}
		{:else}
			<div class="w-3/4 h-full flex items-center -mt-24 justify-center">
				<div class="flex flex-col absolute -ml-48">
					<p class="text-3xl w-96 my-12 text-center font-semibold">You don't have any fields yet! Get crafting!</p>
					<div on:click={newColHeader} class="bg-green-200 text-gray-900 font-semibold text-lg p-2 flex items-center justify-center rounded-lg cursor-pointer transform duration-150 shadow-md hover:-translate-y-1 hover:shadow-lg">Create First Field</div>
				</div>
				<img class="h-3/4 object-scale" src="./empty.png" />
			</div>
		{/if}
		</div>
		<div class={`fixed bottom-0 w-screen h-96 rounded-lg bg-white p-6 transform duration-300 ${treeView ? 'translate-y-0' : 'translate-y-full'} flex flex-col justify-start space-y-4 border-green-600 border-2 overflow-y-scroll`}>
			<div class="w-full flex justify-end">
				<svg class="h-6 w-6" on:click={() => treeView = ''} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
			<JSONTree value={treeView} />
		</div>
</body>

<style global lang="postcss">

  /* only apply purgecss on utilities, per Tailwind docs */
  /* purgecss start ignore */
  @tailwind base;
  @tailwind components;
  /* purgecss end ignore */

  @tailwind utilities;

</style>
