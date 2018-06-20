### Requirements
* npm installed
* node 10+ installed

### How to run the program
* copy & Paste your server log file in csv format into the project folder
* rename it log.csv
* open the project folder in the terminal
* install with 'npm install'
* if using for the first time or after an update, run 'npm run clean'
* (then to get the results, run 'npm run analyze')
* 'grep "<IP> " cleanLogs.csv > ip-logs/<IP>.txt' to get all entries for specific IP

### Features so far
Automatically analyzes log files for:
* Clicks per file type, distributed by real people and bots
* Hitlist of most clicked file (by real people)
* Hitlist of most clicked files that didn't exist (404 Error) (by real people)



More to come...
