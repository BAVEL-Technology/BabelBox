<script>
import camelcase from "camelcase"
export let showAPIDocs
export let activeTable
export let headers

let type = 'javascript'
</script>

<div class={`fixed z-50 overflow-y-scroll h-screen p-4 w-1/2 transform duration-300 flex flex-col ${showAPIDocs ? 'translate-x-0' : '-translate-x-full'} bg-gray-800`}>
  <div class="flex flex-col justify-start h-full">
    <p class="text-xl font-semibold text-green-200 p-4">API Docs for {activeTable ? activeTable[0].toUpperCase() + activeTable.substring(1) : ''}</p>
    {#if type == 'curl'}
    <p class="text-lg font-semibold text-green-200 px-4 pb-4">🍞 BREAD Based API Routes</p>
    <ul class="flex flex-col space-y-3 px-4 font-mono text-green-200 text-xs">
      <li class="break-words">API_URL: https://babelboxdb.herokuapp.com/api</li>
      <li class="break-words">Browse: GET &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}</li>
      <li class="break-words">Read: GET &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
      <li class="break-words">Edit: PUT &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
      <li class="break-words">
        Body: &lcub; <br>
        {#each headers as header, i}
          &nbsp; &nbsp; {camelcase(header.name)}: {header.type} {#if i != (headers.length - 1)},<br>{/if}
        {/each}
        <br>
        &emsp; &rcub;
      </li>
      <li class="break-words">Add: POST &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
      <li class="break-words">
        Body: &lcub; <br>
        {#each headers as header, i}
          &nbsp; &nbsp; {camelcase(header.name)}: {header.type} {#if i != (headers.length - 1)},<br>{/if}
        {/each}
        <br>
        &emsp; &rcub;
      </li>
      <li class="break-words">Delete: DELETE &lcub;API_URL&rcub;/{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}/&lcub;:id&rcub;</li>
    </ul>
    {/if}
    {#if type == 'javascript'}
    <p class="text-2xl font-semibold text-green-200 p-4">🚀 BabelBread Docs</p>
    <p class="font-mono m-4 text-green-200 text-md p-2 bg-gray-600 rounded-md">import bb from "./utils/babelBrea";</p>
    <ul class="flex flex-col space-y-3 px-4 text-green-200 font-mono text-sm">
    <li class="text-lg font-semibold font-sans"># Browse</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().browse('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}')</li>
    <li class="text-lg font-semibold font-sans">Optional:</li>
    <li class="text-lg font-semibold font-sans">limit:</li>
    <li class="text-lg font-sans">The second parameter of browse is the limit.</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().browse('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', 10)</li>
    <li class="text-lg font-semibold font-sans">skip:</li>
    <li class="text-lg font-sans">The third parameter of browse is the skip. This spcifies where to begin the response. </li>
    <li class="p-2 bg-gray-600 rounded-md">bb().browse('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', 10, 10) <br>
    //Records 10 - 20 will be returned</li>
    <li class="text-lg font-semibold font-sans">sort:</li>
    <li class="text-lg font-sans">The forth parameter of browse is the sort method and parameter. This is defaulted to '-createdAt', so the most
    recently created records will be displayed first. Notice the '-' specifys a descending order sort. </li>
    <li class="p-2 bg-gray-600 rounded-md">bb().browse('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', 10, 10, 'createdAt') <br>
    //Records 10 - 20 will be returned starting from the oldest record</li>
    <li class="text-lg font-semibold font-sans"># Read</li>
    <li class="text-lg font-semibold font-sans">With read you are returned one record that matches the given parameter. You can supply multiple parameters,
    but you will only be returned one record.</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().read('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', &lcub;_id: '602f456jhd93m'&rcub;) <br>
    //Will return the one record that matches the given _id</li>
    <li class="text-lg font-semibold font-sans"># Edit</li>
    <li class="text-lg font-semibold font-sans">Edit accepts a table, as many key: value paired filters as you wish, and an object of parameters to update. This
    will update any many records as can be found.</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().edit('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', &lcub;_id: '602f456jhd93m'&rcub;, &lcub;name: 'Steve'&rcub;) <br>
    //Will return all the records that match the given "_id" after the parameter "name" has been replaced with "Steve" on all of them</li>
    <li class="text-lg font-semibold font-sans"># Add</li>
    <li class="text-lg font-semibold font-sans">Add accepts a table and an object of parameters for the new record</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().add('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', &lcub;name: 'Steve'&rcub;) <br>
    //Will return the new record created</li>
    <li class="text-lg font-semibold font-sans"># Join</li>
    <li class="text-lg font-semibold font-sans">Join allows you to replace a simple data type (String, Number, Boolean) with a record from another table.
    Join accepts as many objects as you'd like in the following fasion:</li>
    <li class="p-2 bg-gray-600 rounded-md">&lcub;|col header of joining table|: '|joining table name|, col: |parameter to look for in joing table|'&rcub;</li>
    <li class="text-lg font-semibold font-sans">You can then join, in this example, a "player" with a column named "userId" with the record(s) from the users table
    that coorispond to that "userId".</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().read('players', &lcub;_id: '602f456jhd93m'&rcub;).join(&lcub;_id: 'users'&rcub;, col: 'userId') <br>
    //Will return the one record that matches the given _id</li>
    <li class="text-lg font-semibold font-sans"># Array Helpers</li>
    <li class="text-lg font-semibold font-sans">These helpers can help filter through data that has already been returned from the database.
    Using the extra parameters of browse, edit and destroy can be beneficial when working with larger sets of data.</li>
    <li class="p-2 bg-gray-600 rounded-md">bb().read('{activeTable ? activeTable.toLowerCase().replace(/ /g, "-") : ''}', &lcub;_id: '602f456jhd93m'&rcub;) <br>
    //Will return the one record that matches the given _id</li>
    </ul>
    {/if}
  </div>
</div>
