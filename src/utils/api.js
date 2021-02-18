const api = {
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
