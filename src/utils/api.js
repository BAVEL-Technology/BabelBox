const api = {
		findIp: async () => {
			try {
				const json = (url) => {
				  return fetch(url).then(res => res.json());
				}

				let apiKey = '7be25a9ade8a2bde270fcb94aa63d181c06350d44def3855b0846f24';
				return json(`https://api.ipdata.co?api-key=${apiKey}`)
			} catch (err) {
				console.log(err)
			}
		},
		findToken: async () => {
			try {
				let ip = await api.findIp()
				let getToken = await fetch('/api/r/tokens', {
						method: 'PUT',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ ip: ip.ip })
				})
				return getToken
			} catch (err) {
				console.log(err)
			}
		},
		login: async (body) => {
			try {
				return fetch(`/api/r/admins/login`, {
						method: 'POST',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(body)
				}).then(response => response.json())
			} catch (err) {
				console.log(err)
			}
		},
		get: async (url, token) => {
			try {
				return fetch(`/api/${url}`, {
						method: 'GET',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'token': token
						}
				}).then(response => response.json())
			} catch (err) {
				console.log(err)
			}
		},
		post: async (url, token, body) => {
			try {
				return fetch(`/api/${url}`, {
						method: 'POST',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'token': token
						},
						body: JSON.stringify(body)
				}).then(response => response.json())
			} catch (err) {
				console.log(err)
			}
		},
		put: async (url, token, body) => {
			try {
				return fetch(`/api/${url}`, {
						method: 'PUT',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'token': token
						},
						body: JSON.stringify(body)
				}).then(response => response.json())
			} catch (err) {
				console.log(err)
			}
		},
		destroy: async (url, token) => {
			try {
				return fetch(`/api/${url}`, {
						method: 'DELETE',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'token': token
						}
				}).then(response => response.json())
			} catch (err) {
				console.log(err)
			}
		}
	}

export default api
