export const getHeaders =  (data, filter) => {
  let headers = data.filter((dt) => dt.name == filter)[0]
  return headers.props.map((header) => {
    header.owner = headers.owner
    return header
  })
}
