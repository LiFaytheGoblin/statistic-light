const fs = require('fs')

readFiles().then(results => {
  console.log('in then')
  analyze(results)
}).catch(e => {
  console.error(e)
})

function readFiles() {
  let results = {}
  return getJSON('./logsByIp.json')
  // return getJSON('./types.json')
  // .then(typesJSON => {
  //   results['types'] = typesJSON
  //   return getJSON('./files.json')
  // }).then(filesJSON => {
  //   // console.log('got files', filesJSON)
  //   results['files'] = filesJSON
  //   return getJSON('./notFoundPages.json')
  // }).then(notFoundPagesJSON => {
  //   // console.log('got errors', notFoundPagesJSON)
  //   results['notFoundPages'] = notFoundPagesJSON
  //   return getJSON('./logsByIp.json')
  // })
  .then(logsByIpJSON => {
    // console.log('got errors', notFoundPagesJSON)
    results['logsByIp'] = logsByIpJSON
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
  console.log('in analyze')
  // const limit = 10 //limit for the hitlists
  // let tmp = ""
  //
  // const h1 = hitlist(results.files, limit, 'real', 'htm');
  // const h2 = hitlist(results.notFoundPages, limit, 'real', 'htm')
  // const h3 = hitlist(results.types, results.types.length, 'bot');

  const leastActiveIps = getIpsWithLessThan5Clicks(results.logsByIp)
  // console.log(leastActiveIps)

  // tmp = h1 + h2 + h3;

  // console.log("~~~ Hitlist of most wanted, successfully clicked pages ~~~")
  // console.log(h1)
  // console.log("~~~ Hitlist of most wanted pages that were not Status 200 (ok) ~~~")
  // console.log(h2)
  // console.log("~~~ Hitlist of most wanted file types ~~~")
  // console.log(h3)

  // fs.writeFile("hitlists.json", tmp)

  // fs.writeFile("leastActiveIps.json", JSON.stringify(leastActiveIps))
  printRoadOf('10.1.1.57', leastActiveIps)
  printRoadOf('10.1.24.108', leastActiveIps)
  printRoadOf('10.1.41.117', leastActiveIps)
  printRoadOf('10.1.3.219', leastActiveIps)
  console.log('DONE################################################')
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
  let results = ""
  keys.sort((a, b) => {
    return obj[b][key] - obj[a][key]
  }).slice(0, limit).forEach(page => {
    const realClicks = obj[page].real
    const botClicks = obj[page].bot
    const total = realClicks + botClicks
    results += `>>  ${page}  | Real: ${realClicks} | Bot: ${botClicks} | Total: ${total} \n`
  })
  return results;
}

function getIpsWithLessThan5Clicks(logsByIp) {
  //for(var obj in dataset)
  let tmpIps = Object.assign({}, logsByIp);
  const keys = Object.keys(tmpIps)
  keys.forEach(ip => {
    const l = tmpIps[ip].length
    if (l > 5 || l < 2) delete tmpIps[ip]
  })
  if(Object.keys(tmpIps).length === Object.keys(logsByIp).length) console.log('No ips deleted')
  else {
    console.log(Object.keys(tmpIps).length, Object.keys(logsByIp).length)
  }
  return tmpIps
}

function printRoadOf(ip, log) {
  console.log(`ROAD OF IP ${ip}: \n`)
  const r = log[ip]
  r.forEach(step => {
    console.log(`${step} \n`)
  })
}
