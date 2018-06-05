const fs = require('fs')

readFiles().then(results => {
  console.log('in then')
  analyze(results)
}).catch(e => {
  console.error(e)
})

function readFiles() {
  let results = {}
  return getJSON('./types.json')
  .then(typesJSON => {
    console.log('got types', typesJSON)
    results['types'] = typesJSON
    return getJSON('./files.json')
  }).then(filesJSON => {
    // console.log('got files', filesJSON)
    results['files'] = filesJSON
    return getJSON('./notFoundPages.json')
  }).then(notFoundPagesJSON => {
    // console.log('got errors', notFoundPagesJSON)
    results['notFoundPages'] = notFoundPagesJSON
  }).then(() => {
    console.log('resolving read files')
    return results
  }).catch(e => {
    console.error(e)
  })
}

function getJSON(filePath) {
  return new Promise((resolve, reject) => {
    console.log('reading file')
    let content = '';
    const readStream = fs.createReadStream(filePath);
    readStream.setEncoding('utf8')
    readStream
    .on('data', chunk => {
      content += chunk
    })
    .on('end', () => {
      console.log('done reading file')
      resolve(JSON.parse(content))
    })
    .on('error', (err) => {
      reject( err)
    })
  })

}

function analyze(results) {
  const limit = 10 //limit for the hitlists
  console.log("~~~ Hitlist of most wanted, successfully clicked pages ~~~")
  hitlist(results.files, limit, 'real', 'htm');
  console.log("~~~ Hitlist of most wanted pages that were not found (404 or 401) ~~~")
  hitlist(results.notFoundPages, limit, 'real')
  console.log("~~~ Hitlist of most wanted file types ~~~")
  hitlist(results.types, results.types.length, 'real');
}

function hitlist(obj, limit, key, byFileType) {
  if(limit > obj.length) limit = obj.length
  let keys = Object.keys(obj)
  if(byFileType) {
    const fileType = new RegExp(byFileType)
    keys = keys.filter(key => {
      return fileType.test(key)
    })
  }
  keys.sort((a, b) => {
    return obj[b][key] - obj[a][key]
  }).slice(0, limit).forEach(page => {
    const realClicks = obj[page].real
    const botClicks = obj[page].bot
    const total = realClicks + botClicks
    console.log(`>>  ${page}  | Real: ${realClicks} | Bot: ${botClicks} | Total: ${total}`)
  })
}
