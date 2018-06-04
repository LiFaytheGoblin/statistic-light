const csvFilePath = './log.csv'
const csv = require('csvtojson')
getRealPageClicksByFileType();
//new approach
function getRealPageClicksByFileType() {
  const types = ['pdf', 'doc', 'xls', 'htm', 'shtml', 'gif', 'png', 'jpg', 'css', 'js']
  const relevantTypes = types.slice(0, 4)
  //an object for all the results we want
  const result = {}
  //fill this object with counters
  //for which type is most popular
  types.forEach(type => {
    result[type] = {
      real: 0,
      all: 0
    }
  })
  //files clicked by real people
  const files = {}
  //Reg exs
  const error = new RegExp(/\s404\s/)
  const typesString = types.join('|')
  let getEx = new RegExp('GET\\s[^\\s]*\\.(' + typesString + ')')
  const bot = new RegExp(/.*((B|b)ot|(S|s)pider|BUbiNG|(C|c)rawler|LinkCheck|monitor)/);
  //all files that threw a 404
  const errorPages = {}
  //get the csv
  csv({
    output: "csv"
  }).fromFile(csvFilePath).on('data', (data) => { //each line
    //data is a buffer object
    const entry = data.toString('utf8') //convert buffer to string
    // console.log(entry)
    //now process each one individually!
    //find out file name
    let currentFilePath = getEx.exec(entry);
    let currentFileName;
    if (currentFilePath) {
      const filePart = currentFilePath[0].split('/')
      currentFileName = filePart[filePart.length - 1]
    }
    console.log('Analyzing' + currentFileName)
    //get type from file name
    let currentFileType
    if (currentFileName) {
      const fileNameParts = currentFileName.split('.')
      currentFileType = fileNameParts[fileNameParts.length - 1]
      //check if was successfull
      const successfull = !error.test(entry)
      //check if was a bot
      const wasBot = bot.test(entry)
      //add up counter from file name object to real if not a bot, only if successfull, else add to list of pages with errors
      if (wasBot && successfull) result[currentFileType].all += 1
      //TODO: If was bot && successfull: files[currentFileName].all +=1
      else if (!wasBot && successfull) {
        result[currentFileType].real += 1
        if (currentFileType) {
          if (files.hasOwnProperty(currentFileName)) {
            files[currentFileName].real += 1;
          } else if (relevantTypes.includes(currentFileType)) { //else add file name as key to object of file names
            files[currentFileName].real = 1;
          }
        }
      } else if (!wasBot && !successfull) { //if !successfull -> split up in bot vs real requests
        if (errorPages.hasOwnProperty(currentFileName)) errorPages[currentFileName].real += 1
        else errorPages[currentFileName].real = 1
      }
    }
    console.log('Finished analyzing')
  }).on('done', () => {
    console.log('Analyzed all files.')
    //list the top x clicked files
    //and the times they are clicked
    const limit = 10
    console.log("~~~ Page Hitlist (Real people, successfull only) ~~~")
    hitlist(files, limit);
    console.log("~~~ Hitlist of Pages that threw a 404 Error (Real people only) ~~~")
    hitlist(errorPages, limit)
    //tell clicks for each file type
    console.log("~~~ List of Clicks per Type by Bots and Real People ~~~")
    Object.keys(result).forEach(type => {
      const realClicks = result[type].real
      const allClicks = result[type].all
      console.log(`${type}: Found ${realClicks} real clicks from a total of ${allClicks}.`)
    })
  })
}

//TODO: differenciate between real vs. all
//TODO: differenciate by file type
function hitlist(files, limit) {
  Object.keys(files).sort((a, b) => {
    return files[b].real - files[a].real
  }).slice(0, limit).forEach(page => {
    console.log(`${page}: ${files[page].real} clicks.`)
  })
}
