<script>
import { onMount } from "svelte";
import Header from "./Header.svelte";
import TableHeader from "./TableHeader.svelte";
import camelcase from "camelcase";
import LoggedIn from "./LoggedIn.svelte"
	let dataTables = []
	let displayedData = []
	let headers = []
	let activeTable
	let hoverNewField = false
	let loggedin = false
	let currentUser

	const checkUser = async () => {
	 	return await fetch(`/api/users`, {
	      method: 'GET',
	      headers: {
	        'Accept': 'application/json',
	        'Content-Type': 'application/json',
					'token': window.sessionStorage.getItem('api_key')
	      }
	  })
	}

	const loadData = async () => {
		const dataResponse = await fetch('api/database');
		let data = await dataResponse.json();
		dataTables = data
		activeTable = dataTables[1].name
		headers = dataTables[1].props
		headers = headers.map((h) => {
			h.owner = dataTables[1].owner
			return h
		})
		const tableDataResposne = await fetchData(dataTables[1].name.replace(/ /g, "-"))
		data = await tableDataResposne.json()
		displayedData = data
		console.log(data)
		console.log(dataTables)
	}

	onMount(async function() {
		if (!window.sessionStorage.getItem('api_key')) return false
		let user = await checkUser()
		user = await user.json();
	  console.log(user)
		if (user.username) {
			currentUser = user
			loggedin = true
			loadData()
		}
	})

	const fetchData = async (table) => {
		return fetch(`api/${table}`);
	}

	const updateField = async (field, id) => {
		console.log(id)
		await fetch(`/api/${activeTable.replace(/ /g, "-")}/${id}`, {
				method: 'PUT',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					[camelcase(field)]: event.target.value
				})
		})
		const tableDataResposne = await fetchData(activeTable.replace(/ /g, "-"))
		let data = await tableDataResposne.json()
		displayedData = data
		let tableHeaders = dataTables.filter((dt) => dt.name == activeTable)[0]
		if (tableHeaders) {
			headers = tableHeaders.props
			headers = headers.map((h) => {
				h.owner = tableHeaders.owner
				return h
			})
		} else {
			headers = []
		}
	}

	const newRecord = async () => {
		console.log(activeTable.replace(/ /g, "-"))
		await fetch(`/api/${activeTable.replace(/ /g, "-")}`, {
	      method: 'POST',
	      headers: {
	        'Accept': 'application/json',
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({ })
	  })
		const tableDataResposne = await fetchData(activeTable.replace(/ /g, "-"))
	  let data = await tableDataResposne.json()
	  displayedData = data
	  let tableHeaders = dataTables.filter((dt) => dt.name == activeTable)[0]
	  if (tableHeaders) {
	    headers = tableHeaders.props
			headers = headers.map((h) => {
				h.owner = tableHeaders.owner
				return h
			})
	  } else {
	    headers = []
	  }
	  console.log(displayedData)
	}

	const newColHeader = async () => {
	  await fetch(`/api/database/${activeTable.replace(/ /g, "-")}`, {
	      method: 'PUT',
	      headers: {
	        'Accept': 'application/json',
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({ props: {
	          name: 'Awesome column',
	          type: "String"
	        }
	      })
	  })
	  const dataResponse = await fetch(`api/database`)
	  let data = await dataResponse.json();
	  dataTables = data
	  let tableHeaders = dataTables.filter((dt) => dt.name == activeTable)[0]
	  if (tableHeaders) {
	    headers = tableHeaders.props
			headers = headers.map((h) => {
				h.owner = tableHeaders.owner
				return h
			})
	  } else {
	    headers = []
	  }
	}

</script>

<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
<body class="h-screen">
		<LoggedIn bind:currentUser={currentUser} loadData={loadData} checkUser={checkUser} bind:loggedin={loggedin}/>
		<Header currentUser={currentUser} dataTables={dataTables} bind:activeTable={activeTable} bind:headers={headers} fetchData={fetchData} bind:displayedData={displayedData}/>
		<div class="w-screen h-full flex justify-center overflow-x-scroll">
		{#if headers.length > 0}
			<table class="min-w-full">
				<TableHeader currentUser={currentUser} fetchData={fetchData} bind:hoverNewField={hoverNewField} bind:headers={headers} bind:activeTable={activeTable} bind:dataTables={dataTables} bind:displayedData={displayedData}/>
				<tbody class="bg-gray-200">
					{#each displayedData as data}
						<tr class="bg-white">
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
											<input on:keyup={() => updateField(header.name, data._id)} class="apperance-none focus:outline-none" value={data[camelcase(header.name.toLowerCase())] || ''} />
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
						<td class={`border border-gray-300 text-left ${hoverNewField ? '' : 'hidden'}`}>
							<span class="text-center ml-2 text-base">
							</span>
						</td>
					</tr>
				</tbody>
		</table>
		{:else}
			<div class="w-3/4 h-full flex items-center justify-center">
				<div class="flex flex-col absolute -ml-48">
					<p class="text-3xl w-96 my-12 text-center font-semibold">You don't have any fields yet! Get Cooking!</p>
					<div on:click={newColHeader} class="bg-green-200 text-gray-900 font-semibold text-lg p-2 flex items-center justify-center rounded-lg cursor-pointer transform duration-150 shadow-md hover:-translate-y-1 hover:shadow-lg">Create First Field</div>
				</div>
				<img class="h-3/4 object-scale" src="./empty.png" />
			</div>
		{/if}
		</div>
</body>
