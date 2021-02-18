Class Babeljax {
  constructor (table) {
    this.base_url = 'https://babelboxdb.herokuapp.com/api/'
    this.table = table,
    this.filter = filter,
    this.data
  }

  async browse (table = this.table, raw = false) {
    return new Promise ((resolve) => {
      let data = await fetch(`${this.base_url}${table}`)
      data = await data.json()
      if (raw) resolve(data)
      else {
        this.data = data
        resolve(this)
      }
    })
  }

  async read (table = this.table, filter = this.filter, raw = false) {
    let data = await fetch(`${this.base_url}${table}`)
    data = await data.json()
    if (raw) return data
    else {
      this.data = data
      return this
    }
  }

  edit (table = this.table, filter = this.filte) {

  }

  add (table = this.table, filter = this.filte) {

  }

  destroy (table = this.table, filter = this.filte) {

  }

  where (filters, data = this.connectedData || this.data, raw = false) {
    filters = Object.keys(filters)
    filters.forEach((filter) => {
      this.filteredData = data.filter((d) => d[filter] == filters[filter])
    })

    if (raw) return this.filteredData
    else return this
  }

  async with (connections, raw = false) {
    connections = Object.keys(connections)
    connections.forEach((c) => {
      this.connectedData = this.filteredData || this.data
      data.forEach((d, i) => {
        let connection = await this.where(
            { [c]: d[connections[c]] },
            this.read(connections[c], { [c]: d[connections[c]] }),
            true
          )
        this.connectedData[i][c] = connection
        })
      })

      if (raw) return this.connectedData
      else return this
  }
}

export const bb = (table, filter) => {
  return new Babeljax()
}
