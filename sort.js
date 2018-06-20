const csvFilePath = './log.csv'
const csv = require('csvtojson')
const fs = require('fs')

getRealPageClicksByFileType();
//new approach
function getRealPageClicksByFileType() {
  let all = []

  //an object for all the relevant types with counters
  const types = {}

  //will be filled with files later on
  const files = {}

  //logs that are not made by bots, only valid types
  const cleanLogs = []

  //Reg exs for errors
  const statusOk = new RegExp(/\s(200)\s/)
  const isAGet = new RegExp(/GET\s/)

  //all files that threw a 404
  const notFoundPages = {}
  //get the csv
  csv({
    output: "csv"
  }).fromFile(csvFilePath).on('data', (data) => { //each line
    const entry = data.toString('utf8') //data is a buffer so convert buffer to string

    if (!isAGet.test(entry)) return //if this was not a get don't continue

    all.push(entry) //logs all the entries in an array

    const currentFilePath = getFilePath(entry) //get path of file from entry
    if (!currentFilePath) return //if neither index page nor another known file type don't handle this entry)
    const currentFileName = getFileName(currentFilePath) //get name of file from file path
    const currentFileType = getFileType(currentFileName) //get type of file from file name

    const clickedBy = getClickCategory(entry) //handle counters that need to be added to depending on bots
    const successfull = statusOk.test(entry) //check if http request to that file was successfull
    if (successfull) { //if file was found and no 404 or 401 error THIS SEEMS TO BE BROKEN
      // addUp(types, currentFileType, clickedBy) //add page type to types (or add up if already there)
      // addUp(files, currentFileName, clickedBy) //add page name to names (or add up if already there)
      if (clickedBy === 'real' && getRelevantTypes().includes(currentFileType)) {
        cleanLogs.push(entry) //ADD TO CLEAN LOG (without bots, just relevant pages, for grep)
      }
    }
    // else addUp(notFoundPages, currentFileName, clickedBy) //else add to errorPages
    //Output for user
    console.log(`Finished analyzing file ${all.length}: ${currentFileName}`)
  }).on('done', () => {
    console.log(`Registred ${all.length} files. Found ${cleanLogs.length} potentially real clicks.`)//Output for user
    const csvContent = cleanLogs.join("\r\n")
    fs.writeFile("cleanLogs.csv", csvContent)
    // fs.writeFile("types.json", JSON.stringify(types))
    // fs.writeFile("files.json", JSON.stringify(files))
    // fs.writeFile("notFoundPages.json", JSON.stringify(notFoundPages))
  }).on('error', (err) => {
    console.error(err)
  })
}

function getAvailableTypes() {
  return ['pdf', 'doc', 'xls', 'htm', 'zip', 'shtm', 'gif', 'png', 'jpg', 'css', 'js', 'mov', 'rmvb', 'wmv']
}

function getRelevantTypes() {
  return getAvailableTypes().slice(0, 5)
}

function getFilePath(entry) {
  const typesString = getAvailableTypes().join('|')
  const get = new RegExp('GET\\s[^\\s]*\\.(' + typesString + ')')
  const index = new RegExp('GET /umwelt/umweltatlas(/*\\s|\\s)')
  const isIndexPage = index.test(entry)
  return (isIndexPage) ? ['GET umwelt/umweltatlas/index.htm'] : get.exec(entry) //if it's the path of the index page, correct the path to also show the file name index.htm
}

function getFileName(filePath) {
  const filePart = filePath[0].split('/')
  const currentFileName = filePart[filePart.length - 1]
  if (!currentFileName) throw `No file name for entry ${entry}`
  return currentFileName
}

function getFileType(fileName) {
  const fileNameParts = fileName.split('.')
  const currentFileType = fileNameParts[fileNameParts.length - 1]
  if (!currentFileType) throw `No file type for entry ${entry}`
  const relevantTypes = getRelevantTypes()
  if (!relevantTypes.includes(currentFileType)) return; //if the file type is not relevant, don't handle this entry
  return currentFileType
}

function getClickCategory(entry) {
  const bot = new RegExp(/.*((B|b)ot|(S|s)pider|BUbiNG|(C|c)rawler|LinkCheck|monitor|naver|Apache)/);
  const wasBot = bot.test(entry) //check if was a bot
  return (wasBot) ? 'bot' : 'real' //find out if the counter needs to go up for all clicks or just real clicks
}

function addUp(obj, prop, key) {
  if (obj.hasOwnProperty(prop)) {
    obj[prop][key] += 1;
  } else {
    obj[prop] = {
      real: 0,
      bot: 0
    };
    obj[prop][key] += 1
  }
}
