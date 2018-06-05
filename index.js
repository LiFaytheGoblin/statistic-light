const csvFilePath = './log.csv'
const csv = require('csvtojson')
getRealPageClicksByFileType();
//new approach
function getRealPageClicksByFileType() {
  let all = [];
  const availableTypes = ['pdf', 'doc', 'xls', 'htm', 'zip', 'shtm', 'gif', 'png', 'jpg', 'css', 'js', 'mov', 'rmvb', 'wmv']
  const relevantTypes = availableTypes.slice(0, 5)
  //an object for all the results we want
  const types = {}
  //fill this object with counters
  //for which type is most popular
  relevantTypes.forEach(type => {
    types[type] = {
      real: 0,
      all: 0
    }
  })
  //files clicked by real people
  const files = {}
  //Reg exs
  const onlyPart = new RegExp(/\s(301)\s/)
  const error = new RegExp(/\s40(4|1)\s/)
  const typesString = availableTypes.join('|')
  const getEx = new RegExp('GET\\s[^\\s]*\\.(' + typesString + ')')
  const otherReqEx = new RegExp('(HEAD|OPTIONS)')
  const indexEx = new RegExp('GET /umwelt/umweltatlas(/*\\s|\\s)')
  const bot = new RegExp(/.*((B|b)ot|(S|s)pider|BUbiNG|(C|c)rawler|LinkCheck|monitor)/);
  //all files that threw a 404
  const errorPages = {}
  //get the csv
  csv({
    output: "csv"
  }).fromFile(csvFilePath).on('data', (data) => { //each line
    //data is a buffer object
    const entry = data.toString('utf8') //convert buffer to string
    all.push(entry);
    //if this was not a get request or this was just a part eg. from a pdf download, don't continue
    if(otherReqEx.test(entry) || onlyPart.test(entry)) return;
    // console.log(entry)
    //now process each one individually!
    //get path of file
    let currentFilePath;
    //if it's the path of the index page, correct the path to also show the file name index.htm
    const isIndexPage = indexEx.test(entry)
    if(isIndexPage) {
      currentFilePath = ['GET umwelt/umweltatlas/index.htm']
    } else {
      currentFilePath = getEx.exec(entry);
    }
    //if neither index page nor another known file type (probably an error, 301 or a query, don't handle this entry)
    if (!currentFilePath) return;
    //get name of file
    const filePart = currentFilePath[0].split('/')
    const currentFileName = filePart[filePart.length - 1]
    if (!currentFileName) throw `No file name for entry ${entry}`

    //Output for user
    // console.log(`Analyzing ${currentFileName}`)
    //get type of file from file name
    const fileNameParts = currentFileName.split('.')
    const currentFileType = fileNameParts[fileNameParts.length - 1]
    if(!currentFileType) throw `No file type for entry ${entry}`
    if(!relevantTypes.includes(currentFileType)) return;
    //check if http request to that file was successfull
    const successfull = !error.test(entry)
    //check if was a bot
    const wasBot = bot.test(entry)
    //find out if the counter needs to go up for all clicks or just real clicks

    const clickCategories = ["all"]
    if (!wasBot) clickCategories.push("real")
    if (successfull) { //if file existed and no 404 error
      clickCategories.forEach(category => {
        addUp(types, currentFileType, category) //add page type to types (or add up if already there)
        addUp(files, currentFileName, category) //add page name to names (or add up if already there)
      })
    } else { //else add to errorPages
      clickCategories.forEach(category => {
        addUp(errorPages, currentFileName, category)
      })
    }
    //Output for user
    console.log(`Finished analyzing file ${all.length}: ${currentFileName}`)
  }).on('done', () => {
    //Output for user
    console.log(`Analyzed all ${all.length} files.`)

    const limit = 10 //limit for the hitlists

    console.log("~~~ Hitlist of most wanted, successfully clicked pages ~~~")
    hitlist(files, 100, 'real');

    console.log("~~~ Hitlist of most wanted pages that were not found (404 or 401) ~~~")
    hitlist(errorPages, limit, 'real')

    console.log("~~~ Hitlist of most wanted file types ~~~")
    hitlist(types, types.length, 'real');
  }).on('error',(err)=>{
	console.log(err)
})
}
//TODO: differenciate by file type
function hitlist(obj, limit, key) {
  if(limit > obj.length) limit = obj.length
  Object.keys(obj).sort((a, b) => {
    return obj[b][key] - obj[a][key]
  }).slice(0, limit).forEach(page => {
    console.log(`${page}: ${obj[page].real} real clicks (vs. ${obj[page].all} in total).`)
  })
}

function addUp(obj, prop, key) {
  //TODO: HOW TO CORRECTlY ADD AN OBJECT?
  if (obj.hasOwnProperty(prop)) {
    obj[prop][key] += 1;
  } else {
    obj[prop] = {
      real: 0,
      all: 0
    };
    obj[prop][key] += 1
  }
}
