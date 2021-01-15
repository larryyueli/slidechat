# How to run this application on your server

1. Install NodeJS v12.18.3 or above.
2. Install command line utilities: `imagemagick`, `ghostscript` and `poppler-utils`. These can be installed with `apt` or other package managers. Enable converting PDF files:

```sh
# Open the file
sudo nano /etc/ImageMagick-6/policy.xml

# find and edit the line
<policy domain="coder" rights="none" pattern="PDF" />
# to :
<policy domain="coder" rights="read|write" pattern="PDF" />
```

This is disabled by default for a historical bug in ghostscript to convert pdf to images, but it is already fixed in the latest version (>= 9.24).  
Reference: https://www.kb.cert.org/vuls/id/332928/

3. Install MongoDB, and create a database for this app.
4. Have some authentication method(e.g. Shibboleth) set up and make "/p" sub path of the application login required. For example, if SlideChat will be running on "/slidechat", then "/slidechat/p" should be protected by login.
5. Download a built version from release, or clone the repo and build from source(see instruction for developers).
6. Create file `secrets.js` in the root directory of the app. Put the database username, database password and session secret (a random string to encrypt session) into this file. This file will be ignored by Git.
   Example:

```js
module.exports = {
	dbUser: "slidechat",
	dbPsw: "password",
	sessSecret: "secret",
};
```

7. Modify `config.js` in the root directory of this app if needed(e.g. change database URL, file storage path, etc). For hosting on paths other than `"/slidechat"`, it is also required to modify the client source and instructor client source and rebuild, clone the repo is needed.
8. Create `instructorList.json` in the root directory of the app and put IDs of instructors into this file. This file will be ignored by Git.
   Example:

```json
["sysadmin", "prof1", "prof2"]
```

9. Create the directory to store uploaded files that is set in the `config.js`. The default storage path can be create by `mkdir -p ~/.slidechat/files`
10. Navigate to the root directory of the app and run `npm i --only=prod` to install only production dependencies.
11. Run `npm run deploy` to deploy the app.

## For maintaining the app

The app is deployed with [pm2](https://www.npmjs.com/package/pm2) and will restart automatically when crashed.

To **restart** the app manually:
Navigate to the root directory of the app, run

```sh
npx pm2 restart SlideChat
```

If there is no other apps deployed with `pm2`, you can also use `npx pm2 restart 0`

To **start the app automatically on startup**:
Check out instructions on [pm2 documentations](https://pm2.keymetrics.io/docs/usage/startup/)

To **stop** the app:

```sh
npx pm2 delete SlideChat
```

To see **real time logs**:

```sh
npx pm2 log
```

To see the **log files**:
The files are located in `~/.slidechat/err-*.log` and `out-*.log` where `*` is a number. The location is configurable in `ecosystem.config.js`.

To **add instructors**:
Just add their ID to `instructorList.json`, it will be loaded automatically when they first log into the instructor page.

To **remove an instructor**:
Remove their ID from `instructorList.json` and restart the server
