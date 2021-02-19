<script>
import api from "./utils/api.js";
export let loggedin
export let currentUser
export let checkUser
export let loadData

const login = async () => {
  let token = await api.login({
    username: document.querySelector('#username').value,
    password: document.querySelector('#password').value
  })
  if (token.message) {
    console.log(token.message)
    return
  }
  window.sessionStorage.setItem("api_key", token.token);
  let ip = await api.findIp()
  console.log(token.token, ip.ip)
  let storedToken = await api.post('/r/tokens', '', { ip: ip.ip, token: token.token, access: 'admin' })
  let user = await checkUser()
  if (user.username) {
    currentUser = user
    loggedin = true
    loadData()
  }
}
</script>

<div class={`${loggedin ? 'hidden' : ''} z-30 fixed w-screen h-screen bg-green-200 flex items-center justify-center`}>
  <div class="flex-col space-y-6 border-4 border-green-600 rounded-lg bg-green-200 p-12 flex items-center justify-center">
    <input id="username" class=" bg-green-200 apperance-none border-green-600 border rounded-lg focus:outline-none ring-green-600 text-green-600 ring-4 ring-opacity-0 focus:ring-opacity-80 p-2" placeholder="username" type="text" />
    <input id="password" class="bg-green-200 apperance-none border-green-600 border rounded-lg focus:outline-none ring-green-600 text-green-600 ring-4 ring-opacity-0 focus:ring-opacity-80 p-2" placeholder="password" type="password" />
    <div on:click={login} class="bg-green-600 border-4 border-green-600 hover:bg-green-200 hover:text-green-600 text-white text-xl font-semibold p-2 rounded-lg w-full flex items-center justify-center cursor-pointer"> Log In</div>
  </div>
</div>
