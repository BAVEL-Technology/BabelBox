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
	let dataTables = []
	let displayedData = []
	let headers = []
	let activeTable
	let loggedin = false
	let currentUser
	let showAPIDocs = false
	let token

	const checkUser = async () => {
		token = window.sessionStorage.getItem('api_key')
		return api.get('users', token)
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

	onMount(async function() {
		if (!window.sessionStorage.getItem('api_key')) return false
		try {
			let user = await checkUser()
			if (user.username) {
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

</script>

<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
<body class="h-screen">
		<ApiDocs headers={headers} activeTable={activeTable} showAPIDocs={showAPIDocs}/>
		<LoggedIn bind:currentUser={currentUser} loadData={loadData} checkUser={checkUser} bind:loggedin={loggedin}/>
		<Header token={token} bind:showAPIDocs={showAPIDocs} currentUser={currentUser} dataTables={dataTables} bind:activeTable={activeTable} bind:headers={headers} bind:displayedData={displayedData}/>
		<div class="pb-6 w-screen h-full flex justify-center overflow-x-scroll">
		{#if headers.length > 0}
			<Table bind:dataTables={dataTables} newColHeader={newColHeader} bind:displayedData={displayedData} token={token} bind:headers={headers} activeTable={activeTable} currentUser={currentUser}/>
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
</body>
